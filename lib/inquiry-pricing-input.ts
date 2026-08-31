import type { LeadFormData } from "./lead-payload";
import { inquiryFields, needsFloorArea, recurrenceOptionsFor, SPECIAL_SUBTYPES, WINDOW_GROUP_FIELDS, type InquiryField } from "./inquiry-fields";
import { buildQuoteServiceInput } from "./sales-engine-contract";

export interface InquiryQuoteSelection {
  pricing_inputs: Record<string, unknown>;
  facility_product?: LeadFormData["facility_product"];
}

export function recurrenceSelection(data: Partial<LeadFormData>): string {
  if (!Number.isInteger(data.recurrence_count)) return "";
  if (data.recurrence === "monthly") return `${data.recurrence_count}x_month`;
  if (data.recurrence === "weekly") return `${data.recurrence_count}x_week`;
  return "";
}

export function recurrencePatch(selection: string): Partial<LeadFormData> {
  const match = /^([1-8])x_(month|week)$/.exec(selection);
  if (!match) return { recurrence: undefined, recurrence_count: undefined, recurrence_unit: undefined, recurrence_summary: undefined };
  const count = Number(match[1]);
  return { recurrence: match[2] === "month" ? "monthly" : "weekly", recurrence_count: count,
    recurrence_unit: match[2], recurrence_summary: `${count}x pro ${match[2] === "month" ? "Monat" : "Woche"}` };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readFields(fields: InquiryField[], raw: Record<string, unknown>): Record<string, unknown> | null {
  const input: Record<string, unknown> = {};
  for (const field of fields) {
    const value = raw[field.key];
    if (value === undefined || value === "") {
      if (field.required) return null;
      continue;
    }
    if (field.kind === "number" && (typeof value !== "number" || !Number.isFinite(value)
      || value < (field.min ?? 0) || (field.required && value <= 0) || (field.integer && !Number.isInteger(value)))) return null;
    if (field.kind === "select" && !field.options?.some((o) => o.value === String(value))) return null;
    if (field.kind === "checkbox" && typeof value !== "boolean") return null;
    if (field.kind === "multi" && (!Array.isArray(value) || value.some((v) => !field.options?.some((o) => o.value === v))
      || new Set(value).size !== value.length)) return null;
    input[field.key] = value;
  }
  return input;
}

/** Completeness and transport only: never compute prices or clamp to OS bands. */
export function inquiryPricingInput(data: Partial<LeadFormData>): Record<string, unknown> | null {
  const category = data.service_category ?? "";
  if (category === "other_cleaning") return {};
  const raw = data.pricing_inputs ?? {};
  if (!isRecord(raw)) return null;
  const subtype = raw.subtype;
  const area = typeof data.square_meters === "string" && data.square_meters.trim() ? Number(data.square_meters) : NaN;
  if (needsFloorArea(category, subtype) && (!Number.isFinite(area) || area <= 0)) return null;
  const recurrences = recurrenceOptionsFor(category);
  const recurrence = recurrenceSelection(data);
  if (recurrences && !recurrences.some((o) => o.value === recurrence)) return null;

  if (category === "special_cleaning" && !SPECIAL_SUBTYPES.some((o) => o.value === subtype)) return null;
  if (category === "special_cleaning" && ["mold", "disinfection", "graffiti_facade"].includes(String(subtype))) {
    return { subtype };
  }

  const nicotine = category === "special_cleaning" && subtype === "nicotine";
  const details = nicotine ? raw.nicotine_base ?? {} : raw;
  if (!isRecord(details)) return null;
  const fields = inquiryFields(data);
  const selected = readFields([...fields.main, ...fields.extras, ...fields.risks], details);
  if (!selected) return null;

  let input: Record<string, unknown>;
  if (category === "window_cleaning") {
    if (!Array.isArray(raw.groups) || raw.groups.length === 0) return null;
    const groups: Record<string, unknown>[] = [];
    for (const group of raw.groups) {
      if (!isRecord(group)) return null;
      const parsed = readFields(WINDOW_GROUP_FIELDS, group);
      if (!parsed || Number(parsed.heavy_limescale_count ?? 0) > Number(parsed.quantity)
        || Number(parsed.mold_count ?? 0) > Number(parsed.quantity)) return null;
      groups.push(parsed);
    }
    input = { ...selected, groups };
  } else if (category === "private_cleaning") {
    input = { ...selected, floor_area_m2: area, visits_per_month: data.recurrence_count };
  } else if (category === "office_cleaning") {
    input = { ...selected, floor_area_m2: area, recurrence };
  } else if (category === "construction_cleaning" || category === "deep_cleaning" || nicotine) {
    const object_type = data.object_type === "wohnung" ? "apartment" : data.object_type === "haus" ? "house"
      : data.object_type === "buero_gewerbe" ? "commercial" : null;
    if (!object_type || (category === "construction_cleaning" && object_type === "commercial")) return null;
    const base = { ...selected, object_type, floor_area_m2: area };
    if (nicotine && raw.very_severe_nicotine !== undefined && typeof raw.very_severe_nicotine !== "boolean") return null;
    input = nicotine ? { subtype, nicotine_base: base, ...(raw.very_severe_nicotine === undefined ? {} : { very_severe_nicotine: raw.very_severe_nicotine }) } : base;
  } else if (category === "facility_staircase_cleaning") {
    if (data.facility_product !== "staircase" && data.facility_product !== "facility_basis") return null;
    input = { ...selected, recurrence };
  } else if (category === "clearance_disposal") {
    input = { ...selected, ...(selected.floor_without_lift === undefined ? {} : { floor_without_lift: Number(selected.floor_without_lift) }) };
  } else if (category === "special_cleaning") {
    input = { ...selected, subtype, area_m2: area };
  } else {
    return null;
  }

  return buildQuoteServiceInput({ service_category: category, pricing_inputs: input });
}

export function inquiryQuoteSelection(data: Partial<LeadFormData>): InquiryQuoteSelection | null {
  const input = inquiryPricingInput(data);
  return input ? { pricing_inputs: input, ...(data.service_category === "facility_staircase_cleaning" ? { facility_product: data.facility_product } : {}) } : null;
}
