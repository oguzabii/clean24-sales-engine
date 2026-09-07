import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { inquiryPricingInput, inquiryQuoteSelection, recurrencePatch, recurrenceSelection } from "../lib/inquiry-pricing-input";
import { CONTRACT_RECURRENCES, PRIVATE_RECURRENCES, SPECIAL_SUBTYPES, inquiryFields, recurrenceOptionsFor } from "../lib/inquiry-fields";
import type { LeadFormData } from "../lib/lead-payload";
import { buildQuoteServiceInput, containsAuthoritativePrice } from "../lib/sales-engine-contract";

const form = (service_category: string, pricing_inputs: Record<string, unknown> = {}, patch: Partial<LeadFormData> = {}): Partial<LeadFormData> =>
  ({ service_category, pricing_inputs, ...patch });
const windowGroup = { width_m: 1.5, height_m: 1, quantity: 6, window_type: "normal", lamella_blinds: true };

test("window requires real positive dimensions, integer count and a known type for every group", () => {
  for (const key of ["width_m", "height_m", "quantity", "window_type"]) {
    const group: Record<string, unknown> = { ...windowGroup };
    delete group[key];
    assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [group] })), null);
  }
  for (const invalid of [undefined, [], null, [null], [{}]]) {
    assert.equal(inquiryPricingInput(form("window_cleaning", { groups: invalid })), null);
  }
  for (const width_m of [0, -1, NaN, Infinity, "1.5", true]) {
    assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [{ ...windowGroup, width_m }] })), null);
  }
  assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [{ ...windowGroup, quantity: 1.5 }] })), null);
  assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [{ ...windowGroup, window_type: "future" }] })), null);
  assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [windowGroup, {}] })), null);
  const input = { groups: [windowGroup, { ...windowGroup, width_m: 0.25, quantity: 2, window_type: "balcony_door", heavy_limescale_count: 2, mold_count: 1 }] };
  assert.deepEqual(inquiryPricingInput(form("window_cleaning", input)), input);
});

test("window extras cannot be negative, fractional or more than the selected windows", () => {
  for (const key of ["heavy_limescale_count", "mold_count"]) {
    for (const value of [-1, 0.5, 7, Infinity]) {
      assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [{ ...windowGroup, [key]: value }] })), null);
    }
  }
});

test("all four private monthly recurrences are explicit and survive without week approximations", () => {
  assert.deepEqual(PRIVATE_RECURRENCES.map((o) => o.value), ["1x_month", "2x_month", "4x_month", "8x_month"]);
  for (const option of PRIVATE_RECURRENCES) {
    const patch = recurrencePatch(option.value);
    assert.equal(recurrenceSelection(patch), option.value);
    assert.equal(patch.recurrence_unit, "month");
    assert.equal(patch.recurrence_summary, option.label);
    assert.deepEqual(inquiryPricingInput(form("private_cleaning", {}, { square_meters: "90", ...patch })),
      { floor_area_m2: 90, visits_per_month: Number(option.value[0]) });
  }
  for (const recurrence of ["weekly", "biweekly", "once", "by_agreement"]) {
    assert.equal(inquiryPricingInput(form("private_cleaning", {}, { square_meters: "90", recurrence, recurrence_count: 2 })), null);
  }
  for (const recurrence_count of [undefined, 0, 3, 5, 6, 7, 9, 1.5]) {
    assert.equal(inquiryPricingInput(form("private_cleaning", {}, { square_meters: "90", recurrence: "monthly", recurrence_count })), null);
  }
});

for (const category of ["office_cleaning", "facility_staircase_cleaning"]) {
  test(`${category}: all seven OS cadence keys survive without local normalization`, () => {
    assert.equal(recurrenceOptionsFor(category)?.length, 7);
    for (const option of CONTRACT_RECURRENCES) {
      const data = form(category, category === "office_cleaning" ? {} : { entrances: 1, floors: 3 },
        { square_meters: "120", facility_product: "staircase", ...recurrencePatch(option.value) });
      const input = inquiryPricingInput(data)!;
      assert.equal(input.recurrence, option.value);
      assert.doesNotMatch(JSON.stringify(input), /monthly_visits|hours|price|total/);
    }
  });
}

for (const category of ["private_cleaning", "office_cleaning", "construction_cleaning", "deep_cleaning"]) {
  test(`${category}: missing/invalid area is incomplete, never a guessed area`, () => {
    for (const square_meters of [undefined, "", " ", "0", "-1", "Infinity", "NaN", "10m2"]) {
      assert.equal(inquiryPricingInput(form(category, { rooms: "4-4.5" }, { object_type: "wohnung", square_meters,
        recurrence: "monthly", recurrence_count: 2 })), null);
    }
  });
}

for (const category of ["construction_cleaning", "deep_cleaning"]) {
  test(`${category}: residential room band and object type are explicit`, () => {
    for (const object_type of [undefined, "baustelle", "andere", "toString"]) {
      assert.equal(inquiryPricingInput(form(category, { rooms: "4-4.5" }, { square_meters: "120", object_type })), null);
    }
    for (const object_type of ["wohnung", "haus"]) {
      assert.equal(inquiryPricingInput(form(category, {}, { square_meters: "120", object_type })), null);
      assert.deepEqual(inquiryPricingInput(form(category, { rooms: "4-4.5" }, { square_meters: "120", object_type })),
        { rooms: "4-4.5", floor_area_m2: 120, object_type: object_type === "haus" ? "house" : "apartment" });
    }
  });
}

test("commercial deep cleaning does not invent a room band; condition and furnishing reach OS", () => {
  const data = form("deep_cleaning", { dirtiness: "strong", furnishing: "fully_furnished", rooms: "4-4.5", addons: ["oven_inside"] },
    { object_type: "buero_gewerbe", square_meters: "100" });
  assert.deepEqual(inquiryPricingInput(data), { object_type: "commercial", floor_area_m2: 100, dirtiness: "strong",
    furnishing: "fully_furnished", addons: ["oven_inside"] });
});

test("facility requires product, entrances and floors; both product variants remain distinct", () => {
  const data = form("facility_staircase_cleaning", { entrances: 2, floors: 4, residential_units: 12 }, recurrencePatch("2x_week"));
  assert.equal(inquiryPricingInput(data), null);
  for (const facility_product of ["staircase", "facility_basis"] as const) {
    assert.equal(inquiryQuoteSelection({ ...data, facility_product })!.facility_product, facility_product);
    for (const key of ["entrances", "floors"]) {
      const raw = { ...data.pricing_inputs };
      delete raw[key];
      assert.equal(inquiryPricingInput({ ...data, facility_product, pricing_inputs: raw }), null);
    }
  }
});

test("clearance uses volume, not floor area; lift/access selection is transported exactly", () => {
  assert.equal(inquiryPricingInput(form("clearance_disposal", {}, { square_meters: "100" })), null);
  assert.deepEqual(inquiryPricingInput(form("clearance_disposal", { volume_m3: 12.5, floor_without_lift: "2", carrying_distance: "over_20m", complex_dismantling: true })),
    { volume_m3: 12.5, floor_without_lift: 2, carrying_distance: "over_20m", complex_dismantling: true });
  assert.equal(inquiryPricingInput(form("clearance_disposal", { volume_m3: -1 })), null);
});

test("special has four reachable automatic subtypes and three intentional manual subtypes", () => {
  assert.deepEqual(SPECIAL_SUBTYPES.map((o) => o.value).sort(), ["carpet", "disinfection", "garage", "graffiti_facade", "high_pressure", "mold", "nicotine"]);
  for (const subtype of ["carpet", "high_pressure", "garage"]) {
    assert.equal(inquiryPricingInput(form("special_cleaning", { subtype })), null);
    assert.deepEqual(inquiryPricingInput(form("special_cleaning", { subtype }, { square_meters: "40" })), { subtype, area_m2: 40 });
  }
  for (const subtype of ["mold", "disinfection", "graffiti_facade"]) {
    assert.deepEqual(inquiryPricingInput(form("special_cleaning", { subtype })), { subtype });
  }
  assert.equal(inquiryPricingInput(form("special_cleaning", { subtype: "future" }, { square_meters: "40" })), null);
});

test("nicotine base and severe-nicotine exception survive the canonical adapter", () => {
  const data = form("special_cleaning", { subtype: "nicotine", very_severe_nicotine: true,
    nicotine_base: { rooms: "4-4.5", dirtiness: "strong", addons: ["oven_inside"], partner_payout: 1 } },
  { object_type: "haus", square_meters: "120" });
  const input = inquiryPricingInput(data)!;
  assert.deepEqual(input, { subtype: "nicotine", very_severe_nicotine: true,
    nicotine_base: { object_type: "house", rooms: "4-4.5", floor_area_m2: 120, dirtiness: "strong", addons: ["oven_inside"] } });
  assert.deepEqual(buildQuoteServiceInput({ service_category: "special_cleaning", pricing_inputs: input }), input);
  assert.equal(inquiryPricingInput({ ...data, pricing_inputs: { subtype: "nicotine" } }), null);
});

test("out-of-band but well-formed input is sent to OS without a local pricing/manual decision", () => {
  assert.equal(inquiryPricingInput(form("private_cleaning", {}, { square_meters: "10001", ...recurrencePatch("2x_month") }))!.floor_area_m2, 10001);
  assert.equal(inquiryPricingInput(form("clearance_disposal", { volume_m3: 10001, floor_without_lift: "5" }))!.volume_m3, 10001);
  assert.equal(inquiryPricingInput(form("construction_cleaning", { rooms: "1-1.5" }, { object_type: "haus", square_meters: "45" }))!.rooms, "1-1.5");
});

test("every displayed risk flag is transported, never converted to a local price", () => {
  const samples = [
    form("window_cleaning", { groups: [windowGroup] }),
    form("private_cleaning", {}, { square_meters: "90", ...recurrencePatch("2x_month") }),
    form("office_cleaning", {}, { square_meters: "120", ...recurrencePatch("1x_week") }),
    form("construction_cleaning", { rooms: "4-4.5" }, { square_meters: "120", object_type: "wohnung" }),
    form("deep_cleaning", {}, { square_meters: "100", object_type: "buero_gewerbe" }),
    form("facility_staircase_cleaning", { entrances: 1, floors: 3 }, { facility_product: "facility_basis", ...recurrencePatch("1x_week") }),
    form("clearance_disposal", { volume_m3: 10 }),
    ...["carpet", "high_pressure", "garage"].map((subtype) => form("special_cleaning", { subtype }, { square_meters: "40" })),
  ];
  for (const data of samples) for (const risk of inquiryFields(data).risks) {
    const input = inquiryPricingInput({ ...data, pricing_inputs: { ...data.pricing_inputs, [risk.key]: true } })!;
    assert.equal(input[risk.key], true, `${data.service_category}.${risk.key}`);
    assert.equal(containsAuthoritativePrice(input), false);
  }
});

test("numeric extras and selection flags reject malformed values instead of silently dropping them", () => {
  for (const value of [-1, 1.5, Infinity, "2", null]) {
    assert.equal(inquiryPricingInput(form("private_cleaning", { bathrooms: value }, { square_meters: "90", ...recurrencePatch("2x_month") })), null);
  }
  assert.equal(inquiryPricingInput(form("window_cleaning", { groups: [windowGroup], lift_required: "true" })), null);
  for (const addons of [["not_configured"], ["oven_inside", "oven_inside"], "oven_inside"]) {
    assert.equal(inquiryPricingInput(form("deep_cleaning", { addons }, { square_meters: "100", object_type: "buero_gewerbe" })), null);
  }
});

test("stale input and forged financial fields cannot become price authority", () => {
  assert.deepEqual(inquiryPricingInput(form("office_cleaning", { price: 1, partner_payout: 1, floor_area_m2: 1, recurrence: "5x_week" },
    { square_meters: "120", ...recurrencePatch("1x_month") })), { floor_area_m2: 120, recurrence: "1x_month" });
  assert.deepEqual(inquiryPricingInput(form("other_cleaning", { price: 1 })), {});
  assert.equal(inquiryPricingInput(form("unknown_category")), null);
  assert.equal(inquiryQuoteSelection(form("private_cleaning", {}, { square_meters: "90", ...recurrencePatch("") })), null);
});

test("runtime input modules contain questions and transport, not OS tariffs or price formulas", () => {
  for (const file of ["lib/inquiry-fields.ts", "lib/inquiry-pricing-input.ts", "components/InquiryPricingFields.tsx"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /defaultPricingValues|priceService\(|config-catalog|rate_per|hourly_rate|37\.5|62\.5|estimated_price_min|estimated_price_max/);
  }
});
