import assert from "node:assert/strict";
import test from "node:test";

import {
  ADDONS_BY_KEY,
  BASE_PRICE_RANGES,
  EXPRESS_SURCHARGE,
  HOUSE_SURCHARGE,
} from "../lib/constants";
import type { ValidatedDiscount } from "../lib/discount";
import { buildLeadPayload, type LeadFormData } from "../lib/lead-payload";
import { buildCustomerConfirmationEmail } from "../lib/mail/emails";
import { calculatePrice, type PricingInput } from "../lib/pricing";

const TWENTY_PERCENT: ValidatedDiscount = {
  code: "TEST20",
  type: "percent",
  value: 20,
};

const EXPECTED_RANGES = {
  "1-1.5": { min: 710, max: 790 },
  "2.5": { min: 770, max: 860 },
  "3.5": { min: 890, max: 990 },
  "4.5": { min: 1130, max: 1250 },
  "5.5": { min: 1250, max: 1380 },
  "6.5+": { min: 1490, max: 1640 },
} as const;

const EXPECTED_DISCOUNTED_RANGES = {
  "1-1.5": { min: 570, max: 630 },
  "2.5": { min: 620, max: 690 },
  "3.5": { min: 710, max: 790 },
  "4.5": { min: 900, max: 1000 },
  "5.5": { min: 1000, max: 1100 },
  "6.5+": { min: 1190, max: 1310 },
} as const;

const EXPECTED_ADDONS = {
  terrace_pressure: 200,
  limescale_heavy: 160,
  smoker: 400,
  pet: 200,
  carpet: 180,
  large_cellar: 160,
  wintergarden: 250,
} as const;

function automaticLead(overrides: Partial<LeadFormData> = {}): LeadFormData {
  return {
    customer_name: "Pricing Test",
    email: "pricing@example.com",
    phone: "+41 44 000 00 00",
    address: "Teststrasse 1",
    city: "Dietikon",
    zip: "8953",
    service_category: "move_out_cleaning",
    apartment_size: "3.5",
    property_type: "wohnung",
    addons: {},
    express: false,
    cleaning_date: "2026-08-01",
    ...overrides,
  };
}

test("uses every locked explicit Wohnung room range without generic expansion", () => {
  assert.deepEqual(BASE_PRICE_RANGES, EXPECTED_RANGES);

  for (const [apartment_size, expected] of Object.entries(EXPECTED_RANGES)) {
    const result = calculatePrice({ apartment_size });
    assert.deepEqual({ min: result.min, max: result.max }, expected);
    assert.deepEqual(
      { min: result.base_min, max: result.base_max },
      expected,
      apartment_size
    );
  }
});

test("adds the full CHF 200 Haus surcharge to both endpoints", () => {
  assert.equal(HOUSE_SURCHARGE, 200);
  const apartment = calculatePrice({ apartment_size: "3.5", property_type: "wohnung" });
  const house = calculatePrice({ apartment_size: "3.5", property_type: "haus" });

  assert.deepEqual({ min: apartment.min, max: apartment.max }, { min: 890, max: 990 });
  assert.deepEqual({ min: house.min, max: house.max }, { min: 1090, max: 1190 });
});

test("uses every locked customer add-on price and adds it in full", () => {
  for (const [key, price] of Object.entries(EXPECTED_ADDONS)) {
    assert.equal(ADDONS_BY_KEY[key]?.price, price, key);
    const result = calculatePrice(
      { apartment_size: "3.5", addons: { [key]: true } },
      TWENTY_PERCENT
    );
    assert.equal(result.addons, price, key);
    assert.equal(result.min, EXPECTED_DISCOUNTED_RANGES["3.5"].min + price, key);
    assert.equal(result.max, EXPECTED_DISCOUNTED_RANGES["3.5"].max + price, key);
  }
});

test("applies a 20% discount only to every explicit room endpoint", () => {
  for (const [apartment_size, expected] of Object.entries(
    EXPECTED_DISCOUNTED_RANGES
  )) {
    const result = calculatePrice({ apartment_size }, TWENTY_PERCENT);
    assert.deepEqual({ min: result.min, max: result.max }, expected, apartment_size);
  }
});

test("applies fixed CHF discount rounding only to room endpoints", () => {
  const fixed: ValidatedDiscount = {
    code: "FIX55",
    type: "fixed_chf",
    value: 55,
  };
  const result = calculatePrice(
    {
      apartment_size: "3.5",
      property_type: "haus",
      addons: { wintergarden: true },
    },
    fixed
  );

  assert.deepEqual(
    { min: result.base_min_after_discount, max: result.base_max_after_discount },
    { min: 840, max: 940 }
  );
  assert.deepEqual({ min: result.min, max: result.max }, { min: 1290, max: 1390 });
  assert.equal(result.house_surcharge, 200);
  assert.equal(result.addons, 250);
});

test("keeps Haus and Zusatzleistungen full under a percentage discount", () => {
  const apartment = calculatePrice({ apartment_size: "3.5" }, TWENTY_PERCENT);
  const houseAndWintergarden = calculatePrice(
    {
      apartment_size: "3.5",
      property_type: "haus",
      addons: { wintergarden: true },
    },
    TWENTY_PERCENT
  );

  assert.equal(houseAndWintergarden.min - apartment.min, 450);
  assert.equal(houseAndWintergarden.max - apartment.max, 450);
  assert.deepEqual(
    { min: houseAndWintergarden.min, max: houseAndWintergarden.max },
    { min: 1160, max: 1240 }
  );
});

test("keeps endpoint-based Express at 15% and outside the discount", () => {
  assert.equal(EXPRESS_SURCHARGE, 0.15);
  const input: PricingInput = { apartment_size: "3.5", express: true };
  const original = calculatePrice(input);
  const discounted = calculatePrice(input, TWENTY_PERCENT);
  const payload = buildLeadPayload(automaticLead(input), TWENTY_PERCENT);

  assert.deepEqual(
    {
      min: original.express_surcharge_min,
      max: original.express_surcharge_max,
    },
    { min: 130, max: 150 }
  );
  assert.deepEqual(
    {
      min: discounted.express_surcharge_min,
      max: discounted.express_surcharge_max,
    },
    { min: 130, max: 150 }
  );
  assert.deepEqual({ min: original.min, max: original.max }, { min: 1020, max: 1140 });
  assert.deepEqual({ min: discounted.min, max: discounted.max }, { min: 840, max: 940 });
  assert.equal(payload.pricing_mode, "automatic_range");
  assert.equal(payload.express, true);
  assert.equal(payload.addons.includes("express"), true);
});

test("uses the same pure result for preview and authoritative server payload", () => {
  const input: PricingInput = {
    apartment_size: "3.5",
    property_type: "haus",
    addons: { wintergarden: true },
    express: true,
  };
  const preview = calculatePrice(input, TWENTY_PERCENT);
  const payload = buildLeadPayload(automaticLead(input), TWENTY_PERCENT);

  assert.equal(payload.estimated_price_min, preview.min);
  assert.equal(payload.estimated_price_max, preview.max);
  assert.deepEqual(payload.price_breakdown, preview.price_breakdown);
});

test("stores complete original and discounted final ranges in payload metadata", () => {
  const payload = buildLeadPayload(
    automaticLead({
      property_type: "haus",
      addons: { wintergarden: true },
      express: true,
    }),
    TWENTY_PERCENT
  );

  assert.deepEqual(
    { min: payload.price_min_original, max: payload.price_max_original },
    { min: 1510, max: 1630 }
  );
  assert.deepEqual(
    { min: payload.estimated_price_min, max: payload.estimated_price_max },
    { min: 1330, max: 1430 }
  );
  assert.equal(payload.discount_code, "TEST20");
  assert.equal(payload.discount_type, "percent");
  assert.equal(payload.discount_value, 20);
});

test("does not let an unconfirmed raw discount code alter pricing or metadata", () => {
  const payload = buildLeadPayload(automaticLead({ discount_code: "INVALID" }));

  assert.deepEqual(
    { min: payload.estimated_price_min, max: payload.estimated_price_max },
    EXPECTED_RANGES["3.5"]
  );
  assert.equal(payload.discount_code, undefined);
  assert.equal(payload.discount_type, undefined);
  assert.equal(payload.discount_value, undefined);
  assert.equal(payload.price_min_original, undefined);
  assert.equal(payload.price_max_original, undefined);
});

test("manual-review categories still have no automatic customer pricing", () => {
  const payload = buildLeadPayload(
    automaticLead({
      service_category: "private_cleaning",
      discount_code: "TEST20",
      express: true,
      addons: { smoker: true },
    }),
    TWENTY_PERCENT
  );

  assert.equal(payload.pricing_mode, "manual_review");
  assert.equal(payload.estimated_price_min, undefined);
  assert.equal(payload.estimated_price_max, undefined);
  assert.equal(payload.price_breakdown, undefined);
  assert.equal(payload.discount_code, undefined);
  assert.deepEqual(payload.addons, []);
  assert.equal(payload.express, false);
});

test("Abgabegarantie does not change the customer range", () => {
  const withGuarantee = buildLeadPayload(
    automaticLead({ handover_guarantee_requested: true }),
    TWENTY_PERCENT
  );
  const withoutGuarantee = buildLeadPayload(
    automaticLead({ handover_guarantee_requested: false }),
    TWENTY_PERCENT
  );

  assert.equal(withGuarantee.estimated_price_min, withoutGuarantee.estimated_price_min);
  assert.equal(withGuarantee.estimated_price_max, withoutGuarantee.estimated_price_max);
});

test("customer email uses final/original ranges without sensitive pricing wording", () => {
  const payload = buildLeadPayload(
    automaticLead({
      property_type: "haus",
      addons: { wintergarden: true },
      express: true,
    }),
    TWENTY_PERCENT
  );
  const email = buildCustomerConfirmationEmail(payload);
  const rendered = `${email.html}\n${email.text}`;

  assert.match(email.text, /Ihr Richtpreis: CHF 1330 – CHF 1430/);
  assert.match(email.text, /statt CHF 1510 – CHF 1630/);
  assert.doesNotMatch(
    rendered,
    /Rabatt auf den Grundpreis|vom Rabatt ausgenommen|Rabatt gilt nicht für Zusatzleistungen|Partnerkosten|Mindestmarge|Bruttodifferenz/i
  );
});

test("customer price breakdown contains no partner or margin fields", () => {
  const payload = buildLeadPayload(automaticLead(), TWENTY_PERCENT);
  const keys = Object.keys(payload.price_breakdown ?? {});

  assert.equal(keys.some((key) => /partner|margin|minimum/i.test(key)), false);
});
