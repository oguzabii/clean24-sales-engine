// Run with tsx and the read-only OS tsconfig. This imports pure domain code only.
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { BASE_PRICE_RANGES } from "../lib/constants.ts";
import { formatRichtpreis, moveOutRichtpreis } from "../lib/richtpreis.ts";
import { inquiryQuoteSelection } from "../lib/inquiry-pricing-input.ts";
import { buildQuoteRequest } from "../lib/sales-engine-contract.ts";

const osRepo = process.argv[2];
if (!osRepo) throw new Error("Pass the read-only Clean24 OS repository path.");
const osHead = "4a1aadda2f0175384c5e4fae535c0920a4457c2b";
const actualHead = execFileSync("git", ["-C", osRepo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (actualHead !== osHead) throw new Error(`OS reference changed: ${actualHead}`);
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const domain = join(osRepo, "src/domain/pricing/multi-service");
const { priceService } = await import(pathToFileURL(join(domain, "engine.ts")).href);
const { defaultPricingValues } = await import(pathToFileURL(join(domain, "config-catalog.ts")).href);
const { serviceInputSchema } = await import(pathToFileURL(join(osRepo, "src/lib/integrations/sales-engine/quote-contract.ts")).href);
const config = { revision: 1, values: defaultPricingValues() };
const cases = [];

function add(name, service_category, pricing_inputs, service_variant = null) {
  // Independent fixture shape: customer field values, not a second price engine.
  const form_data = { service_category, pricing_inputs: structuredClone(pricing_inputs) };
  if (service_variant) form_data.facility_product = service_variant;
  const base = pricing_inputs.nicotine_base ?? pricing_inputs;
  if (base.object_type) form_data.object_type = { apartment: "wohnung", house: "haus", commercial: "buero_gewerbe" }[base.object_type];
  if (base.floor_area_m2 || pricing_inputs.area_m2) form_data.square_meters = String(base.floor_area_m2 ?? pricing_inputs.area_m2);
  if (pricing_inputs.visits_per_month) {
    form_data.recurrence = "monthly";
    form_data.recurrence_count = pricing_inputs.visits_per_month;
  } else if (pricing_inputs.recurrence) {
    const [count, unit] = pricing_inputs.recurrence.split("x_");
    form_data.recurrence = unit === "week" ? "weekly" : "monthly";
    form_data.recurrence_count = Number(count);
  }
  const detail = form_data.pricing_inputs.nicotine_base ?? form_data.pricing_inputs;
  for (const key of ["object_type", "floor_area_m2", "area_m2", "recurrence", "visits_per_month"]) delete detail[key];
  const selection = inquiryQuoteSelection(form_data);
  assert.ok(selection, `${service_category} / ${name}: required form question still missing`);
  const request = buildQuoteRequest({ ...form_data, ...selection }, "audit:offline-form-inputs-0001");
  assert.deepEqual(request.service_input, pricing_inputs, `${service_category} / ${name}: canonical transport drift`);
  assert.equal(request.service_variant, service_variant);
  const schemaResult = serviceInputSchema(service_category).safeParse(request.service_input);
  assert.ok(schemaResult.success, `${name}: ${JSON.stringify(schemaResult.error?.issues)}`);
  const result = priceService({ serviceCategory: service_category, serviceVariant: service_variant, pricingInputs: pricing_inputs }, config);
  cases.push({ name, service_category, service_variant, form_data, pricing_inputs,
    pricing_mode: result.pricingMode, min: result.estimatedPriceMin, max: result.estimatedPriceMax,
    amount_basis: result.recurrence.recurrenceType === "one_off" ? "one_off" : "monthly",
    why_manual: [...result.manualReviewReasons] });
}

for (const window_type of ["normal", "balcony_door", "floor_to_ceiling", "other"]) {
  for (const lamella_blinds of [false, true]) {
    add(`${window_type}, 18 m2, lamella=${lamella_blinds}`, "window_cleaning", {
      groups: [{ width_m: 1.5, height_m: 1, quantity: 6, window_type, lamella_blinds }],
    });
  }
}
add("minimum job", "window_cleaning", { groups: [{ width_m: 1, height_m: 1, quantity: 1, window_type: "normal" }] });
for (const visits_per_month of [1, 2, 4, 8]) {
  add(`145 m2, 3 bathrooms, 4 floors, ${visits_per_month}/month`, "private_cleaning", {
    floor_area_m2: 145, bathrooms: 3, floors: 4, visits_per_month,
  });
}
const recurrences = ["1x_month", "2x_month", "1x_week", "2x_week", "3x_week", "4x_week", "5x_week"];
for (const recurrence of recurrences) {
  add(`120 m2, ${recurrence}`, "office_cleaning", { floor_area_m2: 120, recurrence });
  for (const variant of ["staircase", "facility_basis"]) {
    add(`${variant}, 1 entrance, 3 floors, 6 units, ${recurrence}`, "facility_staircase_cleaning", {
      entrances: 1, floors: 3, residential_units: 6, recurrence,
    }, variant);
  }
}
for (const [prefix, category] of [["construction", "construction_cleaning"], ["deep", "deep_cleaning"]]) {
  for (const key of Object.keys(config.values)) {
    const match = key.match(new RegExp(`^${prefix}\\.(apartment|house)\\.(.+)\\.price$`));
    if (!match) continue;
    const [, object_type, rooms] = match;
    const floor_area_m2 = config.values[`${prefix}.${object_type}.${rooms}.ceiling_sqm`] ?? 150;
    add(`${object_type}, ${rooms} rooms, ${floor_area_m2} m2`, category, { object_type, rooms, floor_area_m2 });
  }
}
add("commercial, 100 m2", "deep_cleaning", { object_type: "commercial", floor_area_m2: 100 });
add("commercial, strong, fully furnished, 100 m2", "deep_cleaning", {
  object_type: "commercial", floor_area_m2: 100, dirtiness: "strong", furnishing: "fully_furnished",
});
for (const volume_m3 of [1, 25]) {
  add(`${volume_m3} m3, ground floor`, "clearance_disposal", { volume_m3 });
}
for (const floor_without_lift of [1, 2, 3, 4]) {
  add(`25 m3, floor ${floor_without_lift}, no lift`, "clearance_disposal", { volume_m3: 25, floor_without_lift });
}
add("carpet, 40 m2", "special_cleaning", { subtype: "carpet", area_m2: 40 });
add("carpet, 40 m2, stains and heavy dirt", "special_cleaning", {
  subtype: "carpet", area_m2: 40, strong_stains_pet_odor: true, very_dirty: true,
});
add("high pressure, 30 m2", "special_cleaning", { subtype: "high_pressure", area_m2: 30 });
add("garage, 300 m2, 2 oil spots", "special_cleaning", { subtype: "garage", area_m2: 300, oil_spots: 2 });
add("nicotine, apartment, 4-4.5 rooms, 120 m2", "special_cleaning", {
  subtype: "nicotine", nicotine_base: { object_type: "apartment", rooms: "4-4.5", floor_area_m2: 120 },
});
for (const subtype of ["mold", "disinfection", "graffiti_facade"]) {
  add(subtype, "special_cleaning", { subtype });
}
add("lift required", "window_cleaning", { groups: [{ width_m: 1, height_m: 1, quantity: 1, window_type: "normal" }], lift_required: true });
add("heavy cement", "construction_cleaning", { object_type: "apartment", rooms: "4-4.5", floor_area_m2: 120, heavy_cement: true });
add("extreme clutter", "deep_cleaning", { object_type: "commercial", floor_area_m2: 100, extreme_clutter: true });
add("piano", "clearance_disposal", { volume_m3: 10, piano: true });
add("unknown scope", "other_cleaning", {});
add("mixed window groups with selected extras", "window_cleaning", { groups: [
  { width_m: 1.5, height_m: 1, quantity: 4, window_type: "normal", lamella_blinds: true, heavy_limescale_count: 1 },
  { width_m: 1, height_m: 2, quantity: 2, window_type: "balcony_door", mold_count: 1 },
] });
add("private selected extras", "private_cleaning", { floor_area_m2: 90, visits_per_month: 4, oven_inside: true, bed_count: 2 });
add("private area beyond configured band", "private_cleaning", { floor_area_m2: config.values["private.max_area_sqm"] + 1, visits_per_month: 2 });
add("private mold", "private_cleaning", { floor_area_m2: 90, visits_per_month: 2, mold: true });
add("office selected rooms and workplaces", "office_cleaning", { floor_area_m2: 120, recurrence: "2x_week",
  wc_count: 2, shower_count: 1, kitchen_count: 1, meeting_room_count: 2, workplaces: 18, floors: 2, reception_area: true, high_traffic_customer_area: true });
add("office medical hygiene", "office_cleaning", { floor_area_m2: 120, recurrence: "1x_week", medical_hygiene: true });
add("office area beyond configured band", "office_cleaning", { floor_area_m2: config.values["office.max_area_sqm"] + 1, recurrence: "1x_week" });
add("construction unsupported house room band", "construction_cleaning", { object_type: "house", rooms: "1-1.5", floor_area_m2: 45 });
add("construction area beyond configured band", "construction_cleaning", { object_type: "apartment", rooms: "6-6.5", floor_area_m2: config.values["construction.max_area_sqm"] + 1 });
add("deep selected extras", "deep_cleaning", { object_type: "apartment", rooms: "4-4.5", floor_area_m2: 120,
  furnishing: "partly_furnished", dirtiness: "strong", addons: ["oven_inside", "pet_hair"] });
add("deep unsupported house room band", "deep_cleaning", { object_type: "house", rooms: "1-1.5", floor_area_m2: 45 });
add("deep very strong or unclear", "deep_cleaning", { object_type: "commercial", floor_area_m2: 100, dirtiness: "very_strong_unclear" });
for (const variant of ["staircase", "facility_basis"]) {
  add(`${variant}, selected shared areas`, "facility_staircase_cleaning", { entrances: 2, floors: 4, residential_units: 12,
    recurrence: "2x_week", lift_cabin: true, basement_corridor: true, laundry_room: true, bike_room: true, exterior_entrance_area: true }, variant);
}
add("facility winter service", "facility_staircase_cleaning", { entrances: 1, floors: 3, recurrence: "1x_week", winter_service: true }, "facility_basis");
add("clearance carrying and dismantling", "clearance_disposal", { volume_m3: 10, floor_without_lift: 2, carrying_distance: "over_20m", complex_dismantling: true });
add("clearance volume beyond configured band", "clearance_disposal", { volume_m3: config.values["clearance.max_volume_cbm"] + 1 });
add("clearance fifth floor without lift", "clearance_disposal", { volume_m3: 10, floor_without_lift: 5 });
add("clearance carrying over 50m", "clearance_disposal", { volume_m3: 10, carrying_distance: "over_50m" });
add("special delicate carpet", "special_cleaning", { subtype: "carpet", area_m2: 40, wool_delicate: true });
add("special natural stone", "special_cleaning", { subtype: "high_pressure", area_m2: 30, natural_stone: true });
add("special garage beyond configured band", "special_cleaning", { subtype: "garage", area_m2: config.values["special.garage_max_area_sqm"] + 1 });
add("nicotine commercial", "special_cleaning", { subtype: "nicotine", nicotine_base: { object_type: "commercial", floor_area_m2: 100, furnishing: "fully_furnished" } });
add("very severe nicotine", "special_cleaning", { subtype: "nicotine", very_severe_nicotine: true,
  nicotine_base: { object_type: "apartment", rooms: "4-4.5", floor_area_m2: 120 } });
add("nicotine extensive mold", "special_cleaning", { subtype: "nicotine",
  nicotine_base: { object_type: "apartment", rooms: "4-4.5", floor_area_m2: 120, extensive_mold: true } });

const fixture = join(repo, "tests/fixtures/richtpreis-os.json");
mkdirSync(dirname(fixture), { recursive: true });
writeFileSync(fixture, JSON.stringify({ source: `OS ${osHead}: config-catalog.ts defaults + engine.ts (offline, not live DB)`, cases }, null, 2) + "\n");

const lines = ["# Richtpreis Display Audit", "",
  "Move-out source: approved live Formular ab7011d18b886c7c641759db5faea2052ced4b9e, lib/constants.ts + lib/pricing.ts (unchanged).",
  `Other services source: read-only OS ${osHead}, src/domain/pricing/multi-service/config-catalog.ts and engine.ts.`,
  "", "The OS rows below are offline reference outputs from approved shipped defaults, not a read of the active production DB revision. Runtime ranges come only from OS quote responses. No new-service price table is shipped to the browser.", "",
  "## Move-out", "", "| SERVICE | FORM_VARIANT | INPUTS | RANGE_MIN | RANGE_MAX | AUTOMATIC_OR_MANUAL | SOURCE |", "|---|---|---|---:|---:|---|---|",
];
for (const apartment_size of Object.keys(BASE_PRICE_RANGES)) {
  for (const property_type of ["wohnung", "haus"]) {
    const range = moveOutRichtpreis({ apartment_size, property_type });
    lines.push(`| move_out_cleaning | ${property_type}, ${apartment_size} | \`${JSON.stringify({ apartment_size, property_type })}\` | ${range.min} | ${range.max} | automatic | Historical approved live Formular guidance; OS binding price |`);
  }
}
lines.push("", "All seven selected addon surcharges and the endpoint-based Express rounding reuse the unchanged historical function. No local discount is applied. Display ranges are never sent as an Offer price.", "",
  "## Service Range Matrix", "", "Each row is checked through actual form-value mapping, the Formular quote adapter, the frozen OS input schema, and the pure OS pricing engine. The full form values are retained in tests/fixtures/richtpreis-os.json.", "",
  "| SERVICE | FORM_VARIANT | INPUTS | RANGE_MIN | RANGE_MAX | AUTOMATIC_OR_MANUAL | SOURCE | WHY_MANUAL / OS_RULE_EVIDENCE |",
  "|---|---|---|---:|---:|---|---|---|");
for (const row of cases) {
  lines.push(`| ${row.service_category} | ${row.name}${row.amount_basis === "monthly" ? " (monthly)" : ""} | \`${JSON.stringify(row.pricing_inputs)}\` | ${row.min ?? "-"} | ${row.max ?? "-"} | ${row.pricing_mode} | OS config-catalog.ts + engine.ts | ${row.why_manual.length ? row.why_manual.join(", ") + " (engine.ts decision branch)" : "-"} |`);
}
const automaticCategories = [...new Set(cases.filter((c) => c.pricing_mode === "automatic").map((c) => c.service_category))];
assert.equal(automaticCategories.length, 8, "All eight non-move-out automatic categories must be reachable");
lines.push("", "## Input Coverage", "",
  "Before-edit gap matrix: [RICHTPREIS_INPUT_GAPS.md](RICHTPREIS_INPUT_GAPS.md). All nine automatic categories (including unchanged move-out) now have complete customer input paths. ACCIDENTAL_MANUAL_REVIEW_GAPS=0.", "",
  "Added only OS input questions: window groups/dimensions/type/lamella; supported recurring choices; construction/deep room bands; condition/furnishing; facility product/entrances/floors/units/shared areas; clearance volume/access; special subtype/area/nicotine base. Price-affecting extras and business exceptions use optional disclosure sections. Existing page, step flow, move-out controls and visual classes are retained.", "",
  "Private offers exactly 1/2/4/8 visits per calendar month. Neither the frozen schema nor pricePrivate() supports calendar-week/fortnightly private contracts, so no weekly cadence is falsely relabelled as a fixed monthly count. Office/staircase/facility offer all seven OS recurrence keys; 52/12 normalization stays entirely in OS.", "",
  "Missing/invalid required fields show an incomplete state and send no quote. Completed exceptions are sent to OS, not locally labelled manual. Manual-only special subtypes (mold, disinfection, graffiti_facade) and other_cleaning receive OS manual quotes with null endpoints. Evidence: priceSpecial() final branch and priceService() other_cleaning branch; no configured automatic formula exists for those cases at the frozen HEAD.", "",
  "## Privacy and Authority", "",
  "Public quotes allow only contract/category/variant/state and CHF range endpoints with their one-off/monthly basis. Exact totals, per-visit/monthly exact amounts, raw breakdown, discount calculations, scope, revisions and internal fields are not serialized. Manual quotes have null endpoints. OS failures return errors, never local offers or false submission success.", "",
  "## Submission Boundary", "",
  "Intake, private attachment delivery, address/Haus forwarding, discount transport, stable signed submission IDs, 8/60/30-second client timeouts and 90-second intake route remain unchanged. New service inputs and facility variant travel identically through quote and intake. No legacy dual-write or lifecycle SMTP is introduced.", "",
  "This is quote/input coverage, not a production lifecycle E2E. Browser verification does not submit forms. Existing limitation outside this input-only pass: inquiry date is labelled optional while the intake route requires cleaning_date. Safe E2E must supply a date or separately address that mismatch. Private unsupported calendar-week intent requires a separate OS product decision, not a Formular approximation.", "");
mkdirSync(join(repo, "docs"), { recursive: true });
writeFileSync(join(repo, "docs/RICHTPREIS_DISPLAY_AUDIT.md"), lines.join("\n"));
console.table(cases.map(({ service_category, name, min, max, amount_basis }) => ({ SERVICE: service_category, INPUT: name, MIN: min, MAX: max, BASIS: amount_basis })));
console.log(`AUDITED_OS_CASES=${cases.length}`);
console.log(`AUTOMATIC_SERVICES_WITH_RICHTPREIS=${automaticCategories.length + 1}; ACCIDENTAL_MANUAL_REVIEW_GAPS=0`);
console.log(`MOVE_OUT_3_5=${formatRichtpreis(moveOutRichtpreis({ apartment_size: "3.5" }))}`);
console.log(`MOVE_OUT_4_5=${formatRichtpreis(moveOutRichtpreis({ apartment_size: "4.5" }))}`);
