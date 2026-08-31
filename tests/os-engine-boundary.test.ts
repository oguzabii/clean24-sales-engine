import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { POST as quotesPost } from "../app/api/quotes/route";
import { POST as intakePost } from "../app/api/leads/website/route";
import { ADDONS, BASE_PRICE_RANGES } from "../lib/constants";
import { inquiryPricingInput, inquiryQuoteSelection } from "../lib/inquiry-pricing-input";
import type { LeadFormData } from "../lib/lead-payload";
import { calculatePrice } from "../lib/pricing";
import { verifyQuoteToken } from "../lib/quote-token";
import { formatRichtpreis, moveOutRichtpreis, quoteRichtpreis } from "../lib/richtpreis";
import { buildIntakeRequest, buildQuoteServiceInput, type AmountBasis, type QuoteResponseBody } from "../lib/sales-engine-contract";

const base = {
  customer_name: "Maria Beispiel",
  email: "maria@example.invalid",
  phone: "+41790000000",
  address: "Musterstrasse 12",
  city: "Dietikon",
  zip: "8953",
  apartment_size: "3.5",
  property_type: "wohnung",
  cleaning_date: "2026-09-21",
  balcony: false,
  cellar: false,
  oven_heavy: false,
  blinds: false,
  express: false,
  addons: {},
  service_category: "move_out_cleaning",
} as const;

test("Haus and address are mapped to the OS contract without local repricing", () => {
  const data = { ...base, property_type: "haus" as const };
  assert.equal(buildQuoteServiceInput(data).property_type, "haus");
  assert.equal(buildIntakeRequest(data, "a".repeat(64), "submission:baseline-haus-0001").object.address_line, "Musterstrasse 12");
});

test("recurrence is retained in the OS service input", () => {
  const data = {
    ...base,
    service_category: "private_cleaning",
    pricing_inputs: { floor_area_m2: 90, bathrooms: 1, floors: 1, visits_per_month: 2 },
  };
  assert.equal(buildIntakeRequest(data, "b".repeat(64), "submission:baseline-recurring-01").service_input.visits_per_month, 2);
});

test("the quote route exposes only customer-safe OS fields", async () => {
  const originalFetch = globalThis.fetch;
  const originalBase = process.env.CLEAN24_OS_BASE_URL;
  const originalSecret = process.env.SALES_ENGINE_INTEGRATION_SECRET;
  process.env.CLEAN24_OS_BASE_URL = "https://os.example.invalid";
  process.env.SALES_ENGINE_INTEGRATION_SECRET = "baseline-os-secret-2026";
  globalThis.fetch = (async () => Response.json({
    contract: "clean24_sales_quote_response_v1",
    quote_id: "os-internal-id",
    request_id: "quote:internal-id",
    service_category: "move_out_cleaning",
    service_variant: null,
    pricing_mode: "automatic",
    pricing: {
      calculated_customer_gross: 940,
      total_customer_gross: 940,
      currency: "CHF",
      estimated_price_min: 890,
      estimated_price_max: 990,
      amount_basis: "one_off",
      price_breakdown: { partner_payout: 564, margin: 376 },
    },
    discount: null,
    manual_review_reasons: [],
    pricing_engine: "legacy_move_out",
    pricing_engine_version: 1,
    pricing_configuration_revision: 4,
    service_scope: { included: [], not_included: [], selected_extras: [] },
    recurrence: {},
    expires_at: "2099-01-01T00:00:00.000Z",
    created_at: "2026-08-27T00:00:00.000Z",
  })) as typeof fetch;

  try {
    const response = await quotesPost(new Request("http://formular.local/api/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(base),
    }));
    const body = await response.json();
    const serialized = JSON.stringify(body);
    assert.equal(response.status, 200);
    assert.equal(body.quote.pricing.estimated_price_min, 890);
    assert.equal(body.quote.pricing.estimated_price_max, 990);
    assertPublicRangeOnly(body);
    assert.doesNotMatch(serialized, /os-internal|partner_payout|pricing_configuration_revision|pricing_engine_version/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalBase === undefined) delete process.env.CLEAN24_OS_BASE_URL;
    else process.env.CLEAN24_OS_BASE_URL = originalBase;
    if (originalSecret === undefined) delete process.env.SALES_ENGINE_INTEGRATION_SECRET;
    else process.env.SALES_ENGINE_INTEGRATION_SECRET = originalSecret;
  }
});

test("the live-baseline form no longer calls legacy upload, discount, or local pricing paths", () => {
  const calculator = readFileSync("components/PriceCalculator.tsx", "utf8");
  const form = readFileSync("components/LeadForm.tsx", "utf8");
  assert.doesNotMatch(calculator, /calculatePrice|BASE_PRICE_RANGES/);
  assert.doesNotMatch(form, /NEXT_PUBLIC_CLEAN24_LEAD_UPLOAD_URL|\/api\/discount\/validate/);
  assert.match(form, /uploadLeadFiles/);
  assert.match(form, /quote_token/);
});

function request(path: string, data: unknown): Request {
  return new Request(`http://formular.local${path}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data),
  });
}

function osQuote(overrides: Partial<QuoteResponseBody> = {}): QuoteResponseBody {
  return {
    contract: "clean24_sales_quote_response_v1", quote_id: "os-internal-id", request_id: "quote:internal-id",
    service_category: "move_out_cleaning", service_variant: null, pricing_mode: "automatic",
    pricing: { calculated_customer_gross: 940, total_customer_gross: 940, currency: "CHF",
      estimated_price_min: 890, estimated_price_max: 990, amount_basis: "one_off",
      price_breakdown: { partner_payout: 564, margin: 376, internal_calculation: "private" } },
    discount: { code: "TEST", status: "valid", message: null, type: "percent", value: 10, amount_gross: 94 },
    manual_review_reasons: [], pricing_engine: "legacy_move_out_v1", pricing_engine_version: 1,
    pricing_configuration_revision: 4,
    service_scope: { included: ["not a public calculation"], not_included: [], selected_extras: [] },
    recurrence: { monthly_customer_gross: 940, price_per_visit_gross: 470 },
    expires_at: "2099-01-01T00:00:00.000Z", created_at: "2026-08-27T00:00:00.000Z", ...overrides,
  };
}

async function withOs(fetchImpl: typeof fetch, run: () => Promise<void>) {
  const originalFetch = globalThis.fetch;
  const names = ["CLEAN24_OS_BASE_URL", "SALES_ENGINE_INTEGRATION_SECRET", "SALES_ENGINE_QUOTE_TOKEN_SECRET"];
  const original = names.map((name) => process.env[name]);
  process.env.CLEAN24_OS_BASE_URL = "https://os.example.invalid";
  process.env.SALES_ENGINE_INTEGRATION_SECRET = "range-test-integration-secret";
  process.env.SALES_ENGINE_QUOTE_TOKEN_SECRET = "range-test-signature-secret";
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /^https:\/\/os\.example\.invalid\/api\/integrations\/sales-engine\/(quote|intake)$/);
    return fetchImpl(url, init);
  };
  try { await run(); } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => {
      if (original[i] === undefined) delete process.env[name];
      else process.env[name] = original[i];
    });
  }
}

function assertPublicRangeOnly(body: { quote: object }) {
  assert.deepEqual(Object.keys(body.quote).sort(), ["contract", "pricing", "pricing_mode", "service_category", "service_variant"]);
  assert.doesNotMatch(JSON.stringify(body.quote), /\b940\b|calculated_customer|total_customer|partner|margin|tariff|price_breakdown|revision|engine|recurrence|discount|scope|price_per_visit/);
}

for (const [rooms, min, max, label] of [
  ["1-1.5", 710, 790, "CHF 710\u2013790"], ["2.5", 770, 860, "CHF 770\u2013860"],
  ["3.5", 890, 990, "CHF 890\u2013990"], ["4.5", 1130, 1250, "CHF 1'130\u20131'250"],
  ["5.5", 1250, 1380, "CHF 1'250\u20131'380"], ["6.5+", 1490, 1640, "CHF 1'490\u20131'640"],
] as const) {
  test(`approved live range renders immediately: ${rooms}`, () => {
    const range = moveOutRichtpreis({ apartment_size: rooms });
    assert.deepEqual(range, { min, max, amount_basis: "one_off" });
    assert.equal(formatRichtpreis(range!), label);
    assert.doesNotMatch(formatRichtpreis(range!), /\b940\b/);
  });
}

test("all rooms, Haus, addon combinations and Express preserve historical range behavior", () => {
  for (const apartment_size of Object.keys(BASE_PRICE_RANGES)) {
    for (const property_type of ["wohnung", "haus"]) {
      for (const express of [false, true]) {
        for (let mask = 0; mask < 2 ** ADDONS.length; mask++) {
          const addons = Object.fromEntries(ADDONS.map((addon, i) => [addon.key, Boolean(mask & (1 << i))]));
          const input = { apartment_size, property_type, express, addons };
          const historical = calculatePrice(input);
          assert.deepEqual(moveOutRichtpreis(input), { min: historical.min, max: historical.max, amount_basis: "one_off" });
        }
      }
    }
  }
  assert.deepEqual(moveOutRichtpreis({ apartment_size: "3.5", property_type: "haus" }), { min: 1090, max: 1190, amount_basis: "one_off" });
  assert.deepEqual(moveOutRichtpreis({ apartment_size: "3.5", express: true, addons: { terrace_pressure: true } }), { min: 1250, max: 1370, amount_basis: "one_off" });
  assert.equal(moveOutRichtpreis({ apartment_size: "unknown" }), null);
});

interface OsRangeCase {
  name: string; service_category: string; service_variant: "staircase" | "facility_basis" | null;
  pricing_inputs: Record<string, unknown>; pricing_mode: "automatic" | "manual_review";
  min: number | null; max: number | null; amount_basis: AmountBasis;
  form_data: Partial<LeadFormData>;
}
const fixture = JSON.parse(readFileSync(new URL("./fixtures/richtpreis-os.json", import.meta.url), "utf8")) as { cases: OsRangeCase[] };
for (const c of fixture.cases) {
  test(`OS range boundary: ${c.service_category} / ${c.name}`, async () => {
    const raw = osQuote({ service_category: c.service_category, service_variant: c.service_variant, pricing_mode: c.pricing_mode });
    raw.pricing = { ...raw.pricing, estimated_price_min: c.min, estimated_price_max: c.max, amount_basis: c.amount_basis };
    const selection = inquiryQuoteSelection(c.form_data);
    assert.ok(selection, "every audited case is reachable from the actual form values");
    const data = { ...base, ...c.form_data, ...selection, discount_code: "OS-ONLY" };
    const submissions = new Set<string>();
    await withOs(async (url, init) => {
      const sent = JSON.parse(String(init?.body));
      assert.deepEqual(sent.service_input, c.pricing_inputs);
      assert.equal(sent.service_variant, c.service_variant);
      assert.equal(sent.commercial_context.discount_code, "OS-ONLY");
      if (String(url).endsWith("/quote")) return Response.json(raw);
      assert.equal(sent.object.address_line, base.address);
      const duplicate = submissions.has(sent.submission_id);
      submissions.add(sent.submission_id);
      return Response.json({ contract: "clean24_sales_intake_response_v1", pricing_mode: c.pricing_mode,
        status: duplicate ? "duplicate" : "created", offer: { created: c.pricing_mode === "automatic" } });
    }, async () => {
      const response = await quotesPost(request("/api/quotes", data));
      const body = await response.json();
      assert.equal(response.status, 200);
      assertPublicRangeOnly(body);
      assert.equal(body.quote.pricing.estimated_price_min, c.min);
      assert.equal(body.quote.pricing.estimated_price_max, c.max);
      assert.equal(body.quote.pricing.amount_basis, c.amount_basis);
      if (c.pricing_mode === "automatic") {
        const range = quoteRichtpreis(body.quote);
        assert.deepEqual(range, { min: c.min, max: c.max, amount_basis: c.amount_basis });
        assert.match(formatRichtpreis(range!), /^CHF [\d']+(?:\.\d+)?\u2013[\d']+(?:\.\d+)?$/);
      } else {
        assert.equal(quoteRichtpreis(body.quote), null);
      }
      for (const status of [201, 200]) {
        const intake = await intakePost(request("/api/leads/website", { ...data, quote_token: body.quote_token }));
        assert.equal(intake.status, status, "quote inputs must match intake inputs including facility variant");
        const receipt = await intake.json();
        assert.deepEqual(Object.keys(receipt).sort(), ["pricing_mode", "status", "success"]);
        assert.equal(receipt.pricing_mode, c.pricing_mode);
      }
      assert.equal(submissions.size, 1, "mock OS receives the same submission identifier on retry");
    });
  });
}

test("manual review never displays stray totals, recurrence amounts or ranges", async () => {
  await withOs(async () => Response.json(osQuote({ pricing_mode: "manual_review" })), async () => {
    const response = await quotesPost(request("/api/quotes", base));
    const body = await response.json();
    assert.equal(body.quote.pricing.estimated_price_min, null);
    assert.equal(body.quote.pricing.estimated_price_max, null);
    assert.equal(quoteRichtpreis(body.quote), null);
    assertPublicRangeOnly(body);
  });
});

test("OS exact amounts cannot replace missing or malformed range endpoints", async () => {
  for (const [min, max] of [[null, null], [940, 940], [990, 890], [-10, 100], [Infinity, 100]]) {
    const raw = osQuote({ service_category: "window_cleaning" });
    raw.pricing = { ...raw.pricing, estimated_price_min: min, estimated_price_max: max };
    await withOs(async () => Response.json(raw), async () => {
      const response = await quotesPost(request("/api/quotes", { ...base, service_category: "window_cleaning" }));
      assert.equal(response.status, 502);
      const body = await response.json();
      assert.equal(body.success, undefined);
      assert.equal(body.quote, undefined);
    });
  }
});

test("move-out guidance remains available when OS has no display endpoints", async () => {
  const raw = osQuote();
  raw.pricing.estimated_price_min = null;
  raw.pricing.estimated_price_max = null;
  await withOs(async () => Response.json(raw), async () => {
    const response = await quotesPost(request("/api/quotes", { ...base, apartment_size: "4.5" }));
    const body = await response.json();
    assert.equal(formatRichtpreis(quoteRichtpreis(body.quote)!), "CHF 1'130\u20131'250");
    assertPublicRangeOnly(body);
    assert.doesNotMatch(JSON.stringify(verifyQuoteToken(body.quote_token)), /calculated_customer_gross|total_customer_gross|partner_payout|margin/);
  });
});

test("ranges and discount input cannot become an Offer price; retries retain one OS submission", async () => {
  const submissions = new Set<string>();
  let intakeCalls = 0;
  await withOs(async (url, init) => {
    const sent = JSON.parse(String(init?.body));
    assert.doesNotMatch(JSON.stringify(sent), /estimated_price|range_min|range_max|calculated_customer_gross|binding_price|price_gross|price_breakdown/);
    assert.equal(sent.commercial_context.discount_code, "OS-ONLY");
    if (String(url).endsWith("/quote")) return Response.json(osQuote());
    intakeCalls++;
    assert.equal(sent.quote_id, "os-internal-id");
    const duplicate = submissions.has(sent.submission_id);
    submissions.add(sent.submission_id);
    return Response.json({ contract: "clean24_sales_intake_response_v1", status: duplicate ? "duplicate" : "created",
      pricing_mode: "automatic", offer: { created: true, price_gross: 940 } });
  }, async () => {
    const data = { ...base, discount_code: "OS-ONLY", estimated_price_min: 1, range_min: 1, calculated_customer_gross: 1 };
    const response = await quotesPost(request("/api/quotes", data));
    const { quote_token } = await response.json();
    for (const status of [201, 200]) {
      const intake = await intakePost(request("/api/leads/website", { ...data, quote_token }));
      assert.equal(intake.status, status);
      assert.deepEqual(Object.keys(await intake.json()).sort(), ["pricing_mode", "status", "success"]);
    }
    assert.equal(intakeCalls, 2);
    assert.equal(submissions.size, 1);
  });
});

test("OS failures keep guidance but never fake success or expose raw error details", async () => {
  const error = { contract: "clean24_api_error_v1", code: "OS_UNAVAILABLE", message: "partner_payout=564 margin=376",
    details: [{ field: "internal", message: "binding price 940" }] };
  await withOs(async () => Response.json(osQuote()), async () => {
    const initial = await quotesPost(request("/api/quotes", base));
    const { quote_token } = await initial.json();
    globalThis.fetch = async () => Response.json(error, { status: 503 });
    for (const response of [await quotesPost(request("/api/quotes", base)), await intakePost(request("/api/leads/website", { ...base, quote_token }))]) {
      assert.equal(response.status, 503);
      const body = await response.json();
      assert.equal(body.success, undefined);
      assert.doesNotMatch(JSON.stringify(body), /partner_payout|margin|internal|940/);
    }
    assert.equal(formatRichtpreis(moveOutRichtpreis(base)!), "CHF 890\u2013990");
  });
});

test("existing inquiry controls map only compatible OS area and recurrence inputs", () => {
  assert.deepEqual(inquiryPricingInput({ service_category: "private_cleaning", object_type: "haus", square_meters: "90", recurrence: "monthly", recurrence_count: 2 }), { floor_area_m2: 90, visits_per_month: 2 });
  assert.deepEqual(inquiryPricingInput({ service_category: "office_cleaning", object_type: "buero_gewerbe", square_meters: "120", recurrence: "weekly", recurrence_count: 3 }), { floor_area_m2: 120, recurrence: "3x_week" });
  assert.deepEqual(inquiryPricingInput({ service_category: "deep_cleaning", object_type: "buero_gewerbe", square_meters: "100" }), { object_type: "commercial", floor_area_m2: 100 });
  for (const recurrence of ["weekly", "biweekly", "once", "by_agreement"]) {
    assert.equal(inquiryPricingInput({ service_category: "private_cleaning", object_type: "wohnung", square_meters: "90", recurrence, recurrence_count: 2 }), null);
  }
});

test("incomplete service forms never invent rooms, dimensions, volume or subtype", () => {
  for (const service_category of ["window_cleaning", "construction_cleaning", "deep_cleaning", "facility_staircase_cleaning", "clearance_disposal", "special_cleaning"]) {
    assert.equal(inquiryPricingInput({ service_category, object_type: "wohnung", square_meters: "90", recurrence: "monthly", recurrence_count: 2 }), null);
  }
  assert.deepEqual(inquiryPricingInput({ service_category: "other_cleaning" }), {}, "OS intentionally supports a manual quote with no price dimensions");
  for (const square_meters of ["", "0", "-1", "Infinity", "NaN"]) {
    assert.equal(inquiryPricingInput({ service_category: "deep_cleaning", object_type: "buero_gewerbe", square_meters }), null);
  }
});

test("display guidance stays out of binding intake, legacy delivery and SMTP", () => {
  const calculator = readFileSync("components/PriceCalculator.tsx", "utf8");
  const intake = readFileSync("app/api/leads/website/route.ts", "utf8");
  assert.doesNotMatch(calculator, /calculated_customer_gross|total_customer_gross|price_breakdown/);
  assert.match(calculator, /moveOutRichtpreis\(state\)/);
  assert.doesNotMatch(intake, /calculatePrice|richtpreis|BASE_PRICE_RANGES|buildLeadPayload|sendMail|postLeadWebhook|CLEAN24_LEAD_WEBHOOK/);
});
