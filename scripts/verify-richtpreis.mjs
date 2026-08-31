// Local quote UI verification. No form submissions, uploads or real API delivery.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { formatRichtpreis, moveOutRichtpreis } from "../lib/richtpreis.ts";
import { inquiryFields, WINDOW_GROUP_FIELDS } from "../lib/inquiry-fields.ts";
import { buildQuoteRequest, fingerprintServiceInput } from "../lib/sales-engine-contract.ts";

const [url, playwrightModule, osRepo] = process.argv.slice(2);
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname) || !osRepo) {
  throw new Error("Usage: node --import tsx verify-richtpreis.mjs LOCAL_URL PLAYWRIGHT_MODULE READ_ONLY_OS_REPO");
}
assert.equal(execFileSync("git", ["-C", osRepo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), "4312d7eecc630083921d1249c895e53cd626fd91");
const require = createRequire(import.meta.url);
const { chromium } = require(playwrightModule || "playwright");
const { priceService } = await import(pathToFileURL(join(osRepo, "src/domain/pricing/multi-service/engine.ts")).href);
const { defaultPricingValues } = await import(pathToFileURL(join(osRepo, "src/domain/pricing/multi-service/config-catalog.ts")).href);
const { serviceInputSchema } = await import(pathToFileURL(join(osRepo, "src/lib/integrations/sales-engine/quote-contract.ts")).href);
const config = { revision: 1, values: defaultPricingValues() };
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cases = JSON.parse(readFileSync(join(repo, "tests/fixtures/richtpreis-os.json"), "utf8")).cases;
const output = join(repo, ".git/richtpreis-qa");
mkdirSync(output, { recursive: true });
const baselineFile = join(output, "baseline-layout.json");
const baseline = existsSync(baselineFile) ? JSON.parse(readFileSync(baselineFile, "utf8")) : [];
const checks = [], screenshots = [];
const categoryNames = {
  window_cleaning: /^Fensterreinigung/, private_cleaning: /^Wiederkehrende Reinigung Privat/,
  office_cleaning: /^B\u00fcroreinigung/, construction_cleaning: /^Baureinigung/, deep_cleaning: /^Grundreinigung/,
  facility_staircase_cleaning: /^Hauswartung/, clearance_disposal: /^R\u00e4umung/,
  special_cleaning: /^Spezialreinigung/, other_cleaning: /^Andere Reinigung/,
};
const browser = await chromium.launch({ headless: true });
let blockedSubmissions = 0;
try {
  for (const [name, viewport] of [["desktop", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, serviceWorkers: "block" });
    const pageErrors = [], contractErrors = [], quoteRequests = [];
    await context.route("**/*", (route) => {
      if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
      contractErrors.push({ unexpectedExternalRequest: route.request().url() });
      return route.abort();
    });
    let quoteMode = "hold", release;
    let held = new Promise((resolve) => { release = resolve; });
    await context.route("**/api/**", async (route) => {
      const target = new URL(route.request().url());
      assert.equal(target.origin, new URL(url).origin);
      const path = target.pathname;
      if (path !== "/api/quotes") {
        blockedSubmissions++;
        return route.abort();
      }
      const form = route.request().postDataJSON();
      const request = buildQuoteRequest(form, "quote:offline-browser-check-0001");
      quoteRequests.push(request);
      assert.doesNotMatch(JSON.stringify(form), /partner_payout|margin|calculated_customer_gross|total_customer_gross|price_breakdown|pricing_configuration/);
      const schema = serviceInputSchema(request.service_category).safeParse(request.service_input);
      if (!schema.success) {
        contractErrors.push({ request, issues: schema.error.issues });
        return route.fulfill({ status: 422, json: { error: "Unvollstaendige Angaben." } });
      }
      if (quoteMode === "hold" || (quoteMode === "delay_private_two" && request.service_input.visits_per_month === 2)) await held;
      if (quoteMode === "failure") {
        return route.fulfill({ status: 503, json: { error: "Preis konnte momentan nicht berechnet werden." } }).catch(() => {});
      }
      const range = request.service_category === "move_out_cleaning" ? moveOutRichtpreis(form) : null;
      const result = range ? null : priceService({ serviceCategory: request.service_category,
        serviceVariant: request.service_variant, pricingInputs: request.service_input }, config);
      return route.fulfill({ json: { success: true, quote_token: "local-qa-opaque-token", quote: {
        contract: "clean24_sales_quote_response_v1", service_category: request.service_category, service_variant: request.service_variant,
        pricing_mode: result?.pricingMode ?? "automatic", pricing: {
          currency: "CHF", estimated_price_min: range?.min ?? result?.estimatedPriceMin,
          estimated_price_max: range?.max ?? result?.estimatedPriceMax,
          amount_basis: range ? "one_off" : result.recurrence.recurrenceType === "one_off" ? "one_off" : "monthly",
        },
      } } }).catch(() => {}); // Changed input deliberately cancels obsolete requests.
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const calculator = page.locator("#calculator");
    const value = calculator.locator(".tabular-nums");
    const checkRange = async (expected) => {
      await page.waitForFunction((text) => document.querySelector("#calculator .tabular-nums")?.textContent === text, expected);
      assert.equal(await value.innerText(), expected);
      assert.equal(await value.evaluate((el) => el.scrollWidth <= el.clientWidth), true, `${name}: range must fit`);
      checks.push(`${name}: ${expected}`);
    };
    const selectCommon = async (label, selected) => calculator.locator("label").filter({ hasText: label }).locator("..").locator("select").selectOption(selected);
    const openCategory = async (category) => {
      await page.goto(url, { waitUntil: "networkidle" });
      await calculator.getByRole("button", { name: categoryNames[category] }).click();
    };
    const fillFields = async (root, fields, data) => {
      for (const field of fields) {
        const selected = data[field.key];
        if (selected === undefined) continue;
        if (field.kind === "multi") {
          for (const option of field.options.filter((o) => selected.includes(o.value))) await root.getByRole("checkbox", { name: option.label, exact: true }).check();
        } else if (field.kind === "checkbox") {
          const control = root.getByRole("checkbox", { name: field.label, exact: true });
          await control.check();
          if (!selected) await control.uncheck();
        } else {
          const control = root.getByLabel(field.label, { exact: false });
          if (field.kind === "select") await control.selectOption(String(selected));
          else await control.fill(String(selected));
        }
      }
    };
    const fillCase = async (data) => {
      const input = data.pricing_inputs ?? {};
      if (data.service_category === "special_cleaning") await calculator.getByLabel("Welche Spezialreinigung?").selectOption(input.subtype);
      if (data.object_type) await selectCommon(/^Objektart/, data.object_type);
      if (data.facility_product) await calculator.getByLabel("Gew\u00fcnschte Leistung").selectOption(data.facility_product);
      if (data.recurrence_count) await selectCommon(/^Wiederholung/, `${data.recurrence_count}x_${data.recurrence === "weekly" ? "week" : "month"}`);
      if (data.square_meters) await calculator.getByPlaceholder("z.B. 85").fill(data.square_meters);
      if (input.groups) {
        for (let index = 0; index < input.groups.length; index++) {
          if (index > 0) await calculator.getByRole("button", { name: /Fenstergruppe hinzuf/ }).click();
          const root = calculator.getByRole("group", { name: `Fenstergruppe ${index + 1}`, exact: true });
          await fillFields(root, WINDOW_GROUP_FIELDS, input.groups[index]);
        }
      }
      const details = input.nicotine_base ?? input;
      const fields = inquiryFields(data);
      await fillFields(calculator, fields.main, details);
      for (const [kind, title] of [["extras", "Weitere Angaben / Zusatzleistungen (optional)"], ["risks", "Besonderheiten (optional)"]]) {
        if (fields[kind].some((f) => details[f.key] !== undefined) || (kind === "risks" && input.very_severe_nicotine !== undefined)) {
          await calculator.getByText(title, { exact: true }).click();
          await fillFields(calculator, fields[kind], details);
          if (kind === "risks" && input.very_severe_nicotine) await calculator.getByRole("checkbox", { name: "Sehr starke Nikotinbelastung", exact: true }).check();
        }
      }
    };
    const geometry = async () => calculator.locator("button,input,select").evaluateAll((els) => els.map((el) => {
      const b = el.getBoundingClientRect(), p = document.querySelector("#calculator").getBoundingClientRect();
      return { tag: el.tagName, class: el.className, text: el.textContent, x: b.x-p.x, y: b.y-p.y, width: b.width, height: b.height };
    }));
    const checkLayout = async () => {
      const problems = await calculator.locator("input,select,button,textarea,label,summary").evaluateAll((els) => els.flatMap((el) => {
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) return [];
        const parent = document.querySelector("#calculator").getBoundingClientRect();
        return b.left < parent.left - 1 || b.right > parent.right + 1 ? [{ text: el.textContent, x: b.x, width: b.width }] : [];
      }));
      assert.deepEqual(problems, [], `${name}: controls stay within the existing calculator`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    };

    await page.goto(url, { waitUntil: "networkidle" });
    await page.screenshot({ path: join(output, `${name}-hero.png`), animations: "disabled" });
    await calculator.getByRole("button", { name: /^Umzugsreinigung mit Abgabegarantie/ }).click();
    await checkRange("CHF 890\u2013990");
    checks.push(`${name}: immediate move-out range while OS response is held`);
    const before = baseline.find((item) => item.name === name);
    if (before) {
      const actual = await geometry();
      assert.equal(actual.length, before.controls.length);
      actual.forEach((control, index) => {
        const expected = before.controls[index];
        for (const key of ["tag", "class", "text"]) assert.equal(control[key], expected[key], `${name}: unchanged ${key}`);
        for (const key of ["x", "y", "width", "height"]) {
          assert.ok(Math.abs(control[key] - expected[key]) < 0.02, `${name}: unchanged ${key}, allowing subpixel measurement noise`);
        }
      });
      checks.push(`${name}: approved move-out classes/text identical, geometry within 0.02px`);
    }
    for (const [rooms, expected] of [["4.5", "CHF 1'130\u20131'250"], ["1\u20131.5", "CHF 710\u2013790"],
      ["2.5", "CHF 770\u2013860"], ["5.5", "CHF 1'250\u20131'380"], ["6.5+", "CHF 1'490\u20131'640"], ["3.5", "CHF 890\u2013990"]]) {
      await calculator.getByRole("button", { name: `${rooms} Zimmer`, exact: false }).click();
      await checkRange(expected);
    }
    quoteMode = "normal";
    release();
    await calculator.getByRole("button", { name: /^Haus/ }).click();
    await checkRange("CHF 1'090\u20131'190");
    await calculator.getByRole("checkbox", { name: /Express-Termin/ }).check();
    await checkRange("CHF 1'220\u20131'340");
    await calculator.getByRole("checkbox", { name: /Express-Termin/ }).uncheck();
    await calculator.getByRole("button", { name: /^Wohnung/ }).click();
    await calculator.getByRole("button", { name: "Weiter: Zusatzleistungen" }).click();
    await calculator.getByRole("checkbox", { name: /Hochdruckreinigung Terrasse/ }).check();
    await checkRange("CHF 1'090\u20131'190");
    await calculator.getByRole("button", { name: "Weiter: Kontakt & Termin" }).click();
    assert.equal(await calculator.locator("form strong").innerText(), "CHF 1'090\u20131'190");
    checks.push(`${name}: approved contact range, no submission`);

    const photographed = new Set(), dateChecked = new Set();
    for (const [index, c] of cases.entries()) {
      await page.goto(url, { waitUntil: "networkidle" });
      const match = (response) => {
        if (!response.url().endsWith("/api/quotes") || !response.ok()) return false;
        const request = buildQuoteRequest(response.request().postDataJSON(), "quote:match-test-0001");
        return request.service_category === c.service_category && request.service_variant === c.service_variant
          && fingerprintServiceInput(request.service_input) === fingerprintServiceInput(c.pricing_inputs);
      };
      const responsePromise = page.waitForResponse(match);
      // Catch immediately as well as await below, so a failed fill reports its actual error.
      void responsePromise.catch(() => {});
      await calculator.getByRole("button", { name: categoryNames[c.service_category] }).click();
      if (c.service_category !== "other_cleaning") {
        assert.equal(await value.count(), 0);
        assert.match(await calculator.innerText(), /Angaben unvollst\u00e4ndig/i);
      }
      await fillCase(c.form_data);
      await responsePromise;
      if (c.pricing_mode === "automatic") {
        await checkRange(formatRichtpreis({ min: c.min, max: c.max }));
        assert.equal(await calculator.locator("form strong").innerText(), formatRichtpreis({ min: c.min, max: c.max }));
        if (c.amount_basis === "monthly") assert.match(await calculator.innerText(), /monatlicher Richtpreis/);
      } else {
        await calculator.getByText("Individuelle Offerte", { exact: true }).waitFor();
        assert.equal(await value.count(), 0);
      }
      assert.doesNotMatch(await calculator.innerText(), /Partnerverg\u00fctung|Partner-Tarif|Marge|Fixpreis:|Verbindlicher Preis:/);
      if (!dateChecked.has(c.service_category)) {
        dateChecked.add(c.service_category);
        const date = calculator.getByLabel("Gew\u00fcnschter Termin", { exact: false });
        assert.equal(await date.inputValue(), "");
        assert.equal(await date.evaluate((el) => el.required && el.validity.valueMissing), true);
        assert.doesNotMatch(await calculator.locator('label[for="cleaning-date"]').innerText(), /optional/i);
        for (const [label, text] of [[/^Name/, "Clean24 Browser Test"], [/^Telefon/, "+41000000000"], [/^E-Mail/, "browser@example.invalid"],
          [/^Adresse/, "Pruefstrasse 1"], [/^PLZ/, "8000"], [/^Ort/, "Zuerich"]]) {
          await calculator.locator("label").filter({ hasText: label }).locator("..").locator("input").first().fill(text);
        }
        const object = calculator.locator("label").filter({ hasText: /^Objektart/ }).locator("..").locator("select");
        if (!await object.inputValue()) await object.selectOption("wohnung");
        for (const checkbox of await calculator.locator('form input[type="checkbox"][required]').all()) await checkbox.check();
        const form = calculator.locator("form");
        assert.deepEqual(await form.evaluate((el) => [...el.elements].filter((e) => e.willValidate && !e.validity.valid).map((e) => e.id)), ["cleaning-date"]);
        await form.evaluate((el) => el.requestSubmit());
        assert.equal(await date.evaluate((el) => el.matches(":invalid")), true);
        // The handler must also fail before uploads if native validation is bypassed.
        await form.evaluate((el) => { el.noValidate = true; el.requestSubmit(); el.noValidate = false; });
        await calculator.getByText("Bitte w\u00e4hlen Sie einen Reinigungstermin aus.", { exact: true }).waitFor();
        assert.equal(await date.inputValue(), "");
        assert.equal(blockedSubmissions, 0);
        checks.push(`${name}: ${c.service_category}: required empty date, native and handler validation, no invented date or submission`);
        if (c.service_category === "private_cleaning") {
          const recurrence = calculator.locator("label").filter({ hasText: /^Wiederholung/ }).locator("..").locator("select");
          assert.deepEqual(await recurrence.locator("option").allTextContents(), ["Bitte w\u00e4hlen", "1x pro Monat", "2x pro Monat", "4x pro Monat", "8x pro Monat"]);
          checks.push(`${name}: private labels are exact monthly visit counts, not calendar weeks`);
        }
      }
      await checkLayout();
      checks.push(`${name}: ${c.service_category} / ${c.name}: ${c.pricing_mode}, exact canonical input, layout fits`);
      const shot = `${name}-${c.service_category}-${c.service_variant ?? c.pricing_inputs.subtype ?? "standard"}`;
      if (!photographed.has(shot)) {
        photographed.add(shot);
        const path = join(output, `${shot}.png`);
        await calculator.screenshot({ path, animations: "disabled" });
        screenshots.push(path);
      }
      if ((index + 1) % 10 === 0) console.log(`${name}: ${index + 1}/${cases.length} service cases passed`);
    }

    // Removing required input clears the previous quote immediately.
    for (const c of cases.filter((c) => c.pricing_mode === "automatic").filter((c, i, all) => all.findIndex((v) => v.service_category === c.service_category) === i)) {
      await openCategory(c.service_category);
      await fillCase(c.form_data);
      await checkRange(formatRichtpreis({ min: c.min, max: c.max }));
      const beforeCount = quoteRequests.length;
      if (c.form_data.square_meters) await calculator.getByPlaceholder("z.B. 85").fill("");
      else if (c.service_category === "window_cleaning") await calculator.getByLabel("Breite pro Fenster in m", { exact: false }).first().fill("");
      else if (c.service_category === "facility_staircase_cleaning") await calculator.getByLabel("Anzahl Hauseing\u00e4nge", { exact: false }).fill("");
      else await calculator.getByLabel("Wie gross ist die Menge in m\u00b3?", { exact: false }).fill("");
      assert.equal(await value.count(), 0);
      assert.match(await calculator.innerText(), /Angaben unvollst\u00e4ndig/i);
      assert.equal(quoteRequests.length, beforeCount, "incomplete input must not call OS");
      checks.push(`${name}: ${c.service_category}: clearing required input removes stale range without a request`);
    }

    await openCategory("private_cleaning");
    await calculator.getByPlaceholder("z.B. 85").fill("90");
    held = new Promise((resolve) => { release = resolve; });
    quoteMode = "delay_private_two";
    const oldRequest = page.waitForRequest((r) => r.url().endsWith("/api/quotes") && r.postDataJSON().pricing_inputs.visits_per_month === 2);
    await selectCommon(/^Wiederholung/, "2x_month");
    await oldRequest;
    await selectCommon(/^Wiederholung/, "4x_month");
    await checkRange("CHF 720\u2013795");
    release();
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    assert.equal(await value.innerText(), "CHF 720\u2013795");
    checks.push(`${name}: slow obsolete quote cannot overwrite the changed recurrence`);

    quoteMode = "failure";
    await selectCommon(/^Wiederholung/, "1x_month");
    await calculator.getByText("Preis konnte momentan nicht berechnet werden.", { exact: true }).waitFor();
    assert.equal(await value.count(), 0);
    assert.doesNotMatch(await calculator.innerText(), /Individuelle Offerte/i);
    checks.push(`${name}: non-move-out OS failure has no local price or fake manual result`);
    await page.goto(url, { waitUntil: "networkidle" });
    await calculator.getByRole("button", { name: /^Umzugsreinigung mit Abgabegarantie/ }).click();
    await calculator.getByText("Preis konnte momentan nicht berechnet werden.", { exact: true }).waitFor();
    await checkRange("CHF 890\u2013990");
    checks.push(`${name}: OS outage preserves only approved move-out guidance`);
    for (const mode of ["", "?m=review"]) {
      await page.goto(`${url}/danke${mode}`, { waitUntil: "networkidle" });
      const success = page.locator("section").filter({ has: page.getByRole("heading", { name: "Vielen Dank f\u00fcr Ihre Anfrage!" }) });
      const text = await success.innerText();
      assert.match(text, /Ihre Anfrage wurde erfolgreich \u00fcbermittelt\./);
      assert.match(text, /melden uns mit (der Offerte|einer individuellen Offerte)/);
      assert.doesNotMatch(text, /Eingangsbest\u00e4tigung|Best\u00e4tigungsmail|E-Mail ist unterwegs|bereits eine E-Mail|per E-Mail gesendet|Spam-Ordner/);
      if (mode) assert.doesNotMatch(text, /Abgabegarantie|Richtpreis/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
      const path = join(output, `${name}-success-${mode ? "review" : "automatic"}.png`);
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      screenshots.push(path);
      checks.push(`${name}: ${mode ? "manual" : "automatic"} success copy truthful, no receipt-mail promise, layout fits`);
    }
    assert.deepEqual(pageErrors, []);
    assert.deepEqual(contractErrors, []);
    assert.equal(blockedSubmissions, 0, "browser must never attempt submission or attachment delivery");
    checks.push(`${name}: zero page errors, invalid OS requests, submissions or uploads`);
    await context.close();
  }
  writeFileSync(join(output, "verification.json"), JSON.stringify({ passed: checks.length, service_cases_per_viewport: cases.length,
    completed_at: new Date().toISOString(), formular_head: execFileSync("git", ["-C", repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    checks, screenshots, api_delivery: "intercepted; real OS pure schema/engine, no DB", submissions: 0, uploads: 0, real_email_sent: false }, null, 2));
  console.log(`BROWSER_CHECKS=${checks.length} passed; ${cases.length} service cases on desktop + mobile; NO submissions/uploads/emails`);
} finally { await browser.close(); }
