// HTTP adapter around the pinned, unmodified OS route handlers. No business mocks.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

const osRepo = process.cwd();
const requireOs = createRequire(join(osRepo, "package.json"));
const postgres = requireOs("postgres");
const os = (path) => import(pathToFileURL(join(osRepo, path)).href);
const { assertLocalTestDatabase, deliveryMode, serverEnv } = await os("src/lib/env.ts");
assertLocalTestDatabase();
assert.equal(deliveryMode(), "capture");
assert.equal(serverEnv().DOCUMENT_STORAGE_DRIVER, "local");
const dbName = new URL(process.env.DATABASE_URL).pathname.slice(1);
assert.match(dbName, /^clean24_formular_capture_[a-f0-9]{12}$/);
assert.equal(new URL(process.env.DATABASE_URL).port, "55432");
assert.ok(globalThis.__clean24CaptureEvidence);
const { renderSmokeFixture } = await os("src/lib/documents/pdf/smoke-fixture.tsx");
const renderProbe = await renderSmokeFixture({ issuedOn: "2026-08-27", reference: "SYNTHETIC-RENDER-PREFLIGHT" });
assert.equal(Buffer.from(renderProbe).subarray(0, 5).toString(), "%PDF-");
const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice() {} });
const [{ current_database: actualName }] = await sql`select current_database()`;
assert.equal(actualName, dbName);
const tables = ["leads", "pricing_quotes", "offers", "outbound_messages", "jobs", "partner_job_requests", "invoices", "offer_followups"];
async function counts() {
  const result = {};
  for (const table of tables) result[table] = Number((await sql`select count(*) as n from ${sql(table)}`)[0].n);
  return result;
}
assert.deepEqual(await counts(), Object.fromEntries(tables.map((t) => [t, 0])));
await sql`insert into app_metadata (application_name, environment_purpose, schema_generation)
  values ('clean24-os', 'clean24-os-local-test', 20)`;
const { getDb, closeDb } = await os("src/db/client.ts");
const { seedTestConfiguration } = await os("tests/support/seed-configuration.ts");
await seedTestConfiguration(getDb());
// This single test database owns its rule. No existing environment is altered.
await sql`update business_rules set value_text = 'true' where key = 'auto_offer_enabled'`;
const { transportForRuntime } = await os("src/lib/mail/transport.ts");
assert.equal(transportForRuntime("Clean24").name, "capture");
const { POST: quotePost } = await os("src/app/api/integrations/sales-engine/quote/route.ts");
const { POST: intakePost } = await os("src/app/api/integrations/sales-engine/intake/route.ts");
const { documentStorage } = await os("src/lib/storage/document-storage.ts");

const calls = { quote: 0, intake: 0, forbidden: 0 };
const submissions = [], responses = [];
let quoteId;
const server = createServer(async (req, res) => {
  try {
    const isQuote = req.url === "/api/integrations/sales-engine/quote";
    const isIntake = req.url === "/api/integrations/sales-engine/intake";
    if (req.method !== "POST" || (!isQuote && !isIntake)) {
      calls.forbidden++;
      res.writeHead(403).end();
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const input = JSON.parse(body);
    assert.equal(input.service_category, "move_out_cleaning");
    assert.deepEqual(input.service_input, { rooms_key: "3.5", property_type: "wohnung", addon_keys: [], express: false });
    assert.ok(!input.commercial_context?.discount_code);
    if (isQuote) assert.equal(++calls.quote, 1, "Only one persisted quote is authorized");
    else {
      assert.ok(++calls.intake <= 2, "Only the initial submission and one retry are authorized");
      assert.equal(input.customer.email, "clean24-e2e@example.invalid");
      assert.equal(input.quote_id, quoteId);
      assert.deepEqual(input.attachments ?? [], []);
      if (submissions.length) assert.equal(input.submission_id, submissions[0].submission_id);
      submissions.push(input);
    }
    const request = new Request(`http://127.0.0.1:${server.address().port}${req.url}`, {
      method: "POST", headers: req.headers, body,
    });
    const result = await (isQuote ? quotePost(request) : intakePost(request));
    const payload = await result.text();
    const parsed = JSON.parse(payload);
    if (isQuote) quoteId = parsed.quote_id;
    responses.push({ operation: isQuote ? "quote" : "intake", status: result.status, body: parsed });
    res.writeHead(result.status, Object.fromEntries(result.headers)).end(payload);
  } catch (error) {
    console.error(error);
    res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: "Isolated test failed" }));
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
process.env.APP_BASE_URL = `http://127.0.0.1:${server.address().port}`;
const { resetEnvCache } = await os("src/lib/env.ts");
resetEnvCache();
process.send({ event: "ready", port: server.address().port, database: dbName, mode: deliveryMode(), before: await counts() });

process.on("message", async (message) => {
  try {
    if (message.action === "inspect") {
      const countsNow = await counts();
      const offerRows = await sql`select id, lead_id, offer_number, customer_total_chf, status, issued_at, accepted_at, declined_at, sent_at from offers`;
      const quotes = await sql`select id, service_category, calculated_customer_gross, consumed_at from pricing_quotes`;
      const leadRows = await sql`select id, email, cleaning_date::text as cleaning_date, object_address_line, pricing_mode, binding_price_chf, current_offer_id from leads`;
      const deliveries = await sql`select id, kind, recipient, status, delivery_mode, attempt_count, sent_at, provider_message_id,
        rendered_subject, rendered_body_text, rendered_body_html from outbound_messages`;
      const followups = await sql`select offer_id, step, status, scheduled_for from offer_followups order by step`;
      const automation = await sql`select automation_key, status, details, error_message from automation_runs`;
      const documents = await sql`select id, entity_id, type, storage_path, file_size_bytes::int as file_size_bytes, file_hash_sha256 from documents`;
      const attachments = await sql`select document_id, outbound_message_id, sent_at from document_deliveries`;
      const pdfs = [];
      for (const doc of documents) {
        const bytes = await documentStorage().download(doc.storage_path);
        assert.equal(createHash("sha256").update(bytes).digest("hex"), doc.file_hash_sha256);
        assert.equal(bytes.byteLength, doc.file_size_bytes);
        assert.equal(Buffer.from(bytes).subarray(0, 5).toString(), "%PDF-");
        const path = join(process.env.CLEAN24_CAPTURE_OUTPUT, "offer.pdf");
        writeFileSync(path, bytes);
        pdfs.push({ path, size: bytes.byteLength, sha256: doc.file_hash_sha256 });
      }
      process.send({ event: "inspection", data: { counts: countsNow, calls, submissions, responses, offers: offerRows,
        leads: leadRows, quotes, deliveries, followups, automation, documents, attachments, pdfs, network: globalThis.__clean24CaptureEvidence } });
    } else if (message.action === "stop") {
      await new Promise((resolve) => server.close(resolve));
      await closeDb();
      await sql.end({ timeout: 5 });
      process.disconnect();
    }
  } catch (error) {
    process.send({ event: "error", error: error.message });
  }
});
