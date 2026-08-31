import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { POST as intakePost } from "../app/api/leads/website/route";
import { PRIVATE_RECURRENCES } from "../lib/inquiry-fields";
import { inquiryPricingInput, recurrencePatch } from "../lib/inquiry-pricing-input";
import { signQuoteToken } from "../lib/quote-token";
import { SERVICE_CATEGORIES } from "../lib/service-categories";
import { buildIntakeRequest, buildQuoteServiceInput, fingerprintServiceInput, type ServiceCategory } from "../lib/sales-engine-contract";

const customer = {
  customer_name: "Clean24 Contract Test", email: "contract@example.invalid", phone: "+41000000000",
  address: "Pruefstrasse 1", city: "Zuerich", zip: "8000", apartment_size: "3.5", property_type: "wohnung",
};

for (const { value: service_category } of SERVICE_CATEGORIES) {
  test(`${service_category}: intake rejects every missing/blank date before contacting OS`, async (t) => {
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => { calls++; throw new Error("No OS request expected"); });
    for (const cleaning_date of [undefined, null, "", "  ", 123, true, {}]) {
      const response = await intakePost(new Request("http://formular.local/api/leads/website", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...customer, service_category, cleaning_date, quote_token: "not-yet-needed" }),
      }));
      assert.equal(response.status, 400);
      assert.match((await response.json()).error, /cleaning_date/);
    }
    assert.equal(calls, 0);
  });
}

test("both customer date fields are required, accessible and empty until selected", () => {
  const source = readFileSync("components/LeadForm.tsx", "utf8");
  assert.equal(source.match(/id="cleaning-date"/g)?.length, 2);
  assert.equal(source.match(/htmlFor="cleaning-date"/g)?.length, 2);
  assert.equal(source.match(/id="cleaning-date"\s+type="date"\s+required\s+value=\{form.cleaning_date \?\? ""\}/g)?.length, 2);
  assert.doesNotMatch(source, /Gew\u00fcnschter Termin \(optional\)/);
  assert.match(source, /Reinigungsdatum <span className="text-red-500">\*<\/span>/);
  assert.match(source, /Gew\u00fcnschter Termin <span className="text-red-500">\*<\/span>/);
  assert.ok(source.indexOf('if (!(form.cleaning_date ?? "").trim())') < source.indexOf("await uploadLeadFiles"));
  const initial = source.slice(source.indexOf("useState<Partial<FormState>>"), source.indexOf("// Move-out retains"));
  assert.doesNotMatch(initial, /cleaning_date|new Date/);
  for (const { value: service_category } of SERVICE_CATEGORIES) {
    const data = { ...customer, service_category };
    assert.equal(buildIntakeRequest(data, "a".repeat(64), "submission:date-not-invented").object.cleaning_date, undefined);
    assert.equal(buildIntakeRequest({ ...data, cleaning_date: "2026-12-21" }, "a".repeat(64), "submission:date-chosen").object.cleaning_date, "2026-12-21");
  }
});

for (const visits of [1, 2, 4, 8]) {
  test(`private ${visits}x pro Monat: exact label, count and selected date reach OS intake`, async (t) => {
    const names = ["CLEAN24_OS_BASE_URL", "SALES_ENGINE_INTEGRATION_SECRET", "SALES_ENGINE_QUOTE_TOKEN_SECRET"];
    const old = names.map((name) => process.env[name]);
    process.env.CLEAN24_OS_BASE_URL = "https://os.example.invalid";
    process.env.SALES_ENGINE_INTEGRATION_SECRET = "contract-test-only";
    process.env.SALES_ENGINE_QUOTE_TOKEN_SECRET = "contract-signature-test-only";
    try {
      const option = PRIVATE_RECURRENCES.find((o) => o.value === `${visits}x_month`)!;
      assert.equal(option.label, `${visits}x pro Monat`);
      const service_category: ServiceCategory = "private_cleaning";
      const form = { ...customer, service_category, square_meters: "90", cleaning_date: "2026-12-21", ...recurrencePatch(option.value) };
      assert.equal(form.recurrence, "monthly");
      assert.equal(form.recurrence_unit, "month");
      assert.equal(form.recurrence_count, visits);
      const data = { ...form, pricing_inputs: inquiryPricingInput(form)! };
      const quote_token = signQuoteToken({ quote_id: "a".repeat(64), request_id: "quote:monthly-contract-test",
        submission_id: `submission:monthly-contract-${visits}`, service_category, service_variant: null,
        service_input_fingerprint: fingerprintServiceInput(buildQuoteServiceInput(data)), expires_at: "2099-01-01T00:00:00Z" });
      let calls = 0;
      t.mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
        assert.equal(String(url), "https://os.example.invalid/api/integrations/sales-engine/intake");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.object.cleaning_date, "2026-12-21");
        assert.deepEqual(body.service_input, { floor_area_m2: 90, visits_per_month: visits });
        assert.doesNotMatch(JSON.stringify(body.service_input), /week|52|4\.33|price|gross/);
        calls++;
        return Response.json({ contract: "clean24_sales_intake_response_v1", status: "created", pricing_mode: "automatic" });
      });
      const response = await intakePost(new Request("http://formular.local/api/leads/website", {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, quote_token }),
      }));
      assert.equal(response.status, 201);
      assert.equal(calls, 1);
    } finally {
      names.forEach((name, i) => old[i] === undefined ? delete process.env[name] : process.env[name] = old[i]);
    }
  });
}
