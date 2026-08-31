// Explicit opt-in only: one real local chain and one retry; never acceptance.
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { randomBytes, createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";
import { stopCaptureProcess as stop } from "./stop-process.mjs";

const [osRepoArg, playwrightModule, execute] = process.argv.slice(2);
if (!osRepoArg || !playwrightModule || execute !== "--execute-one") {
  throw new Error("Usage: node scripts/capture-e2e/run.mjs READ_ONLY_OS_REPO PLAYWRIGHT_MODULE --execute-one");
}
const osRepo = resolve(osRepoArg), here = dirname(fileURLToPath(import.meta.url)), repo = resolve(here, "../..");
const git = (path, ...args) => execFileSync("git", ["-C", path, ...args], { encoding: "utf8" }).trim();
const osHead = "4312d7eecc630083921d1249c895e53cd626fd91";
assert.equal(git(osRepo, "rev-parse", "HEAD"), osHead);
const osStatus = git(osRepo, "status", "--short");
assert.equal(osStatus, "", "Read-only OS must match the clean authoritative snapshot");
const local = parseEnv(readFileSync(join(osRepo, ".env.test.local"), "utf8"));
const localDb = new URL(local.DATABASE_URL);
assert.equal(localDb.hostname, "127.0.0.1");
assert.equal(localDb.port, "55432");
assert.equal(localDb.pathname, "/clean24_os_local_test");
assert.equal(local.DATABASE_PURPOSE, "clean24-os-local-test");
const docker = (...args) => execFileSync("docker", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, windowsHide: true });
const container = "clean24-os-local-test-db";
const identity = JSON.parse(docker("exec", container, "psql", "-U", "supabase_admin", "-d", "clean24_os_local_test", "-X", "-Atc",
  "select json_build_object('database', current_database(), 'purpose', environment_purpose, 'generation', schema_generation, 'migrations', (select count(*) from drizzle.__drizzle_migrations)) from app_metadata where application_name='clean24-os'"));
assert.deepEqual(identity, { database: "clean24_os_local_test", purpose: "clean24-os-local-test", generation: 20, migrations: 36 });
const dbName = `clean24_formular_capture_${randomBytes(6).toString("hex")}`;
assert.match(dbName, /^clean24_formular_capture_[a-f0-9]{12}$/);
const output = join(repo, ".git", "capture-e2e", dbName);
mkdirSync(output, { recursive: true });
const report = { osHead, formularHead: git(repo, "rev-parse", "HEAD"), database: dbName, sourceIdentity: identity,
  output, executed: false, result: "BLOCKED", cleanup: false, realEmailSent: false };
const secret = `local-capture-${randomBytes(24).toString("hex")}`;
const systemEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) =>
  /^(path|pathext|systemroot|windir|comspec|temp|tmp|userprofile|homedrive|homepath|appdata|localappdata)$/i.test(k)));
const guard = join(here, "network-guard.cjs");
const childEnv = (ports, name, extra) => ({ ...systemEnv, NEXT_TELEMETRY_DISABLED: "1", CLEAN24_CAPTURE_TEST: "1",
  CLEAN24_CAPTURE_PORTS: ports.join(","), CLEAN24_CAPTURE_EVIDENCE: join(output, `${name}-network.json`),
  NODE_OPTIONS: `--require "${guard.replaceAll("\\", "/")}"`, ...extra });
let created = false, osChild, formular, browser;
const logs = [];
function launch(args, cwd, env, name, ipc = false) {
  const child = spawn(process.execPath, args, { cwd, env, windowsHide: true, stdio: ["ignore", "pipe", "pipe", ...(ipc ? ["ipc"] : [])] });
  const log = createWriteStream(join(output, `${name}.log`));
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  logs.push(log);
  return child;
}
function message(child, event, action) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error(`Timed out waiting for ${event}`)), 120_000);
    function finish(error, value) {
      clearTimeout(timer); child.off("message", receive); child.off("exit", exited);
      if (error) reject(error); else resolve(value);
    }
    function receive(value) { if (value.event === "error") finish(new Error(value.error)); else if (value.event === event) finish(null, value); }
    function exited(code) { finish(new Error(`Isolated OS process exited ${code} before ${event}; see ${output}`)); }
    child.on("message", receive);
    child.once("exit", exited);
    if (action) child.send({ action });
  });
}
async function unusedPort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
try {
  // Schema only, from the guarded LOCAL test DB. No source rows or config copied.
  const schema = docker("exec", container, "pg_dump", "-U", "supabase_admin", "-d", "clean24_os_local_test", "--schema-only",
    "--no-owner", "--no-privileges", "--schema=public", "--schema=auth", "--schema=storage");
  report.schemaSha256 = createHash("sha256").update(schema).digest("hex");
  docker("exec", container, "psql", "-U", "supabase_admin", "-d", "postgres", "-X", "-v", "ON_ERROR_STOP=1", "-qc", `CREATE DATABASE ${dbName} OWNER postgres`);
  created = true;
  docker("exec", container, "psql", "-U", "postgres", "-d", dbName, "-X", "-v", "ON_ERROR_STOP=1", "-qc", "DROP SCHEMA public CASCADE");
  execFileSync("docker", ["exec", "-i", container, "psql", "-U", "postgres", "-d", dbName, "-X", "-v", "ON_ERROR_STOP=1", "-q"],
    { input: schema, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, windowsHide: true });
  localDb.pathname = `/${dbName}`;
  osChild = launch(["--import", "tsx", join(here, "os-server.mjs")], osRepo,
    childEnv([55432], "os", { NODE_ENV: "test", CLEAN24_CAPTURE_OS_SERVER: "1", DATABASE_URL: localDb.href, DATABASE_URL_MIGRATION: localDb.href,
      DATABASE_PURPOSE: "clean24-os-local-test", DELIVERY_MODE: "capture", DOCUMENT_STORAGE_DRIVER: "local",
      DOCUMENT_STORAGE_LOCAL_ROOT: join(output, "private-storage"), DOCUMENT_NUMBER_NAMESPACE: "QA",
      SALES_ENGINE_INTEGRATION_SECRET: secret, CLEAN24_CAPTURE_OUTPUT: output,
      NODE_V8_COVERAGE: join(output, "os-coverage") }), "os", true);
  const ready = await message(osChild, "ready");
  assert.equal(ready.mode, "capture");
  assert.ok(Object.values(ready.before).every((count) => count === 0));
  await message(osChild, "inspection", "inspect"); // Check every evidence query before creating a quote.
  console.log(`ISOLATED_OS_READY=${dbName}; CAPTURE; empty business tables; OS files unchanged`);
  const port = await unusedPort(), url = `http://127.0.0.1:${port}`;
  formular = launch([join(repo, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], repo,
    childEnv([ready.port, port], "formular", { NODE_ENV: "production", CLEAN24_OS_BASE_URL: `http://127.0.0.1:${ready.port}`,
      SALES_ENGINE_INTEGRATION_SECRET: secret, SALES_ENGINE_QUOTE_TOKEN_SECRET: secret,
      CLEAN24_LEAD_WEBHOOK_URL: "", SMTP_HOST: "", SMTP_USER: "", SMTP_PASSWORD: "" }), "formular");
  const until = Date.now() + 60_000;
  while (true) {
    if (formular.exitCode !== null) throw new Error(`Local Formular exited ${formular.exitCode}; see ${output}`);
    try { if ((await fetch(url)).ok) break; } catch { /* Startup is not yet listening. */ }
    if (Date.now() > until) throw new Error("Local Formular startup timed out");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const require = createRequire(import.meta.url);
  const { chromium } = require(playwrightModule);
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block" });
  let forbiddenBrowserCalls = 0;
  await context.route("**/*", (route) => {
    const request = new URL(route.request().url());
    if (request.origin === url && (!request.pathname.startsWith("/api/") || ["/api/quotes", "/api/leads/website"].includes(request.pathname))) return route.continue();
    forbiddenBrowserCalls++;
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const calculator = page.locator("#calculator");
  await page.goto(url, { waitUntil: "networkidle" });
  const quoted = page.waitForResponse((r) => r.url() === `${url}/api/quotes`);
  await calculator.getByRole("button", { name: /^Umzugsreinigung mit Abgabegarantie/ }).click();
  const quoteResponse = await quoted;
  assert.equal(quoteResponse.status(), 200);
  const publicQuote = await quoteResponse.json();
  assert.deepEqual(publicQuote.quote.pricing, { currency: "CHF", estimated_price_min: 890, estimated_price_max: 990, amount_basis: "one_off" });
  assert.doesNotMatch(JSON.stringify(publicQuote.quote), /partner|margin|tariff|revision|breakdown|calculated_customer|total_customer|quote_id|lead_id/i);
  assert.equal(await calculator.locator(".tabular-nums").innerText(), "CHF 890\u2013990");
  await calculator.getByRole("button", { name: "Weiter: Zusatzleistungen" }).click();
  await calculator.getByRole("button", { name: "Weiter: Kontakt & Termin" }).click();
  for (const [label, value] of [[/^Name/, "Clean24 E2E Test"], [/^Telefon/, "+41000000000"], [/^E-Mail/, "clean24-e2e@example.invalid"],
    [/^Adresse/, "Teststrasse 123"], [/^PLZ/, "8000"], [/^Ort/, "Zuerich"]]) {
    await calculator.locator("label").filter({ hasText: label }).locator("..").locator("input").fill(value);
  }
  const date = calculator.getByLabel("Reinigungsdatum", { exact: false });
  assert.equal(await date.inputValue(), "");
  assert.equal(await date.evaluate((el) => el.required && el.validity.valueMissing), true);
  await calculator.locator("form").evaluate((el) => el.requestSubmit());
  assert.equal(await date.evaluate((el) => el.matches(":invalid")), true);
  const selectedDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  await date.fill(selectedDate);
  assert.equal(await calculator.locator("form").evaluate((el) => el.checkValidity()), true);
  await calculator.screenshot({ path: join(output, "before-submit.png") });
  const submitted = page.waitForResponse((r) => r.url() === `${url}/api/leads/website`, { timeout: 90_000 });
  report.executed = true;
  await calculator.locator('button[type="submit"]').click();
  const first = await submitted;
  const body = first.request().postDataJSON();
  report.firstStatus = first.status();
  assert.equal(body.cleaning_date, selectedDate);
  assert.equal(body.email, "clean24-e2e@example.invalid");
  assert.equal(first.status(), 201);
  const firstPublic = await first.json();
  report.publicResponses = { quote: publicQuote.quote, first: firstPublic };
  assert.deepEqual(firstPublic, { success: true, pricing_mode: "automatic", status: "created" });
  await page.waitForURL(`${url}/danke`);
  await page.screenshot({ path: join(output, "success-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: join(output, "success-mobile.png"), fullPage: true });
  const beforeRetry = (await message(osChild, "inspection", "inspect")).data;
  report.evidence = beforeRetry;
  report.submissionId = beforeRetry.submissions[0]?.submission_id;
  writeFileSync(join(output, "report.json"), JSON.stringify(report, null, 2));
  assert.deepEqual(beforeRetry.counts, { leads: 1, pricing_quotes: 1, offers: 1, outbound_messages: 1,
    jobs: 0, partner_job_requests: 0, invoices: 0, offer_followups: 3 });
  console.log("FIRST_SUBMISSION=1 lead + 1 quote + 1 offer + 1 captured delivery; retrying the SAME identifier once");
  const retry = await context.request.post(`${url}/api/leads/website`, { data: body, timeout: 90_000 });
  assert.equal(retry.status(), 200);
  const retryPublic = await retry.json();
  report.publicResponses.retry = retryPublic;
  assert.deepEqual(retryPublic, { success: true, pricing_mode: "automatic", status: "duplicate" });
  const after = (await message(osChild, "inspection", "inspect")).data;
  report.evidence = after;
  assert.deepEqual(after.counts, beforeRetry.counts);
  assert.deepEqual(after.calls, { quote: 1, intake: 2, forbidden: 0 });
  assert.equal(after.submissions[0].submission_id, after.submissions[1].submission_id);
  const offer = after.offers[0], delivery = after.deliveries[0];
  assert.equal(offer.customer_total_chf, "940.00");
  assert.ok(offer.offer_number);
  assert.ok(offer.issued_at);
  assert.equal(offer.accepted_at, null);
  assert.equal(offer.declined_at, null);
  assert.equal(after.quotes[0].calculated_customer_gross, "940.00");
  assert.ok(after.quotes[0].consumed_at);
  assert.equal(after.leads[0].binding_price_chf, "940.00");
  assert.equal(after.leads[0].cleaning_date, selectedDate);
  assert.equal(after.leads[0].object_address_line, "Teststrasse 123");
  assert.equal(after.leads[0].current_offer_id, offer.id);
  assert.equal(delivery.kind, "offer_issued");
  assert.equal(delivery.status, "captured");
  assert.equal(delivery.delivery_mode, "capture");
  assert.equal(delivery.recipient, "clean24-e2e@example.invalid");
  assert.equal(delivery.attempt_count, 1);
  assert.equal(delivery.sent_at, null);
  assert.equal(delivery.provider_message_id, null);
  assert.ok(delivery.rendered_subject.includes(offer.offer_number));
  assert.match(delivery.rendered_subject, /Offerte.*Clean24/);
  assert.doesNotMatch(`${delivery.rendered_body_text} ${delivery.rendered_body_html}`, /partner_payout|margin_chf|Partnerverg\u00fctung|Marge|pricing_config/i);
  assert.equal(after.pdfs.length, 1);
  assert.equal(after.documents[0].type, "offerte");
  assert.equal(after.attachments.length, 1);
  assert.equal(after.attachments[0].outbound_message_id, delivery.id);
  assert.equal(after.attachments[0].document_id, after.documents[0].id);
  for (const [index, hours] of [24, 48, 120].entries()) {
    assert.equal(after.followups[index].status, "pending");
    assert.equal(after.followups[index].step, index + 1);
    assert.equal(Date.parse(after.followups[index].scheduled_for) - Date.parse(offer.sent_at ?? offer.issued_at), hours * 3_600_000);
  }
  assert.equal(after.automation[0].status, "succeeded");
  assert.equal(after.network.deniedConnections, 0);
  assert.equal(after.network.providerCalls, 0);
  assert.equal(forbiddenBrowserCalls, 0);
  assert.deepEqual(errors, []);
  await stop(formular);
  report.formularNetwork = JSON.parse(readFileSync(join(output, "formular-network.json"), "utf8"));
  assert.equal(report.formularNetwork.deniedConnections, 0);
  assert.equal(report.formularNetwork.providerCalls, 0);
  report.publicResponses = { quote: publicQuote.quote, first: firstPublic, retry: retryPublic };
  report.submissionId = after.submissions[0].submission_id;
  report.result = "PASS";
  console.log(`CAPTURE_E2E=PASS; OFFER=${offer.offer_number}; GROSS=940.00; LEADS=1; QUOTES=1; OFFERS=1; CAPTURED=1; SMTP=0; JOBS=0; PARTNER_REQUESTS=0; INVOICES=0`);
} catch (error) {
  report.result = report.executed ? "FAIL" : "BLOCKED";
  report.error = error.message;
  process.exitCode = 1;
  console.error(error);
} finally {
  if (browser) await browser.close();
  await stop(formular);
  await stop(osChild, true);
  if (existsSync(join(output, "formular-network.json"))) {
    report.formularNetwork = JSON.parse(readFileSync(join(output, "formular-network.json"), "utf8"));
  }
  for (const log of logs) log.end();
  if (created) {
    assert.match(dbName, /^clean24_formular_capture_[a-f0-9]{12}$/);
    docker("exec", container, "psql", "-U", "supabase_admin", "-d", "postgres", "-X", "-v", "ON_ERROR_STOP=1", "-qc", `DROP DATABASE ${dbName} WITH (FORCE)`);
    const remaining = docker("exec", container, "psql", "-U", "supabase_admin", "-d", "postgres", "-X", "-Atc", `select count(*) from pg_database where datname='${dbName}'`).trim();
    assert.equal(remaining, "0");
    report.cleanup = true;
  }
  assert.equal(git(osRepo, "status", "--short"), osStatus);
  assert.equal(git(osRepo, "rev-parse", "HEAD"), osHead);
  writeFileSync(join(output, "report.json"), JSON.stringify(report, null, 2));
  console.log(`EVIDENCE=${output}; DISPOSABLE_DATABASE_REMOVED=${report.cleanup}`);
}
