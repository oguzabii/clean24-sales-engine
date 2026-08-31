import type { LeadFormData } from "./lead-payload";
export type ServiceCategory = string;

export type ServiceVariant = "staircase" | "facility_basis";
export type PricingMode = "automatic" | "manual_review";
export type AmountBasis = "one_off" | "monthly";

export interface QuoteRequestBody {
  contract: "clean24_sales_quote_request_v1";
  request_id: string;
  service_category: ServiceCategory;
  service_variant?: ServiceVariant | null;
  service_input: Record<string, unknown>;
  /**
   * Der Rabatt- oder Partnercode — dieselbe Form wie bei der Einreichung.
   *
   * Ein zweiter Feldname für dieselbe Sache wäre die verlässlichste Art, den
   * Code auf einem der beiden Wege zu verlieren.
   */
  commercial_context?: { discount_code?: string | null } | null;
  source_reference?: string | null;
}

export interface QuoteResponseBody {
  contract: "clean24_sales_quote_response_v1";
  quote_id: string;
  request_id: string;
  service_category: ServiceCategory;
  service_variant: ServiceVariant | null;
  pricing_mode: PricingMode;
  pricing: {
    /** BASISPREIS, ohne Rabatt. Die Offerte weist ihn als Zwischensumme aus. */
    calculated_customer_gross: number | null;
    /**
     * BASISPREIS MINUS RABATT — nur serverseitig, nicht im Formular anzeigen.
     *
     * Ohne gültigen Code identisch mit "calculated_customer_gross". Clean24 OS
     * bildet ihn mit derselben Funktion, die später die Offerte bildet; die
     * beiden Beträge können deshalb nicht auseinanderlaufen.
     */
    total_customer_gross: number | null;
    currency: "CHF";
    estimated_price_min: number | null;
    estimated_price_max: number | null;
    amount_basis: AmountBasis;
    price_breakdown: Record<string, unknown> | null;
  };
  /** Das Urteil über den eingegebenen Code. Null, wenn keiner gesendet wurde. */
  discount: QuoteDiscount | null;
  manual_review_reasons: string[];
  pricing_engine: string;
  pricing_engine_version: number;
  pricing_configuration_revision: number;
  service_scope: { included: string[]; not_included: string[]; selected_extras: string[] };
  recurrence: Record<string, unknown>;
  expires_at: string;
  created_at: string;
}

/**
 * Before submission the browser receives guidance ranges only. Exact totals,
 * discounts, recurrence calculations and scope stay in the OS offer contract.
 */
export type CustomerQuoteResponseBody = Pick<
  QuoteResponseBody,
  "contract" | "service_category" | "service_variant" | "pricing_mode"
> & {
  pricing: Pick<
    QuoteResponseBody["pricing"],
    "currency" | "estimated_price_min" | "estimated_price_max" | "amount_basis"
  >;
};

/**
 * WAS CLEAN24 OS ÜBER EINEN CODE ZURÜCKMELDET.
 *
 * Ausdrücklich OHNE Kontingent, ohne die Firma hinter einem B2B-Code und ohne
 * andere Einlösungen. Der Kunde erfährt, ob SEIN Code gilt und was er ihm
 * bringt — nicht, wie das Programm dahinter aussieht.
 */
export interface QuoteDiscount {
  code: string;
  /** "valid" · "not_found" · "expired" · "not_yet_valid" · "inactive" · … */
  status: string;
  /** Kundentauglicher Klartext bei Ablehnung, sonst null. */
  message: string | null;
  type: "percent" | "fixed_chf" | null;
  value: number | null;
  /** Was der Rabatt abzieht, in Franken. 0, wenn er nicht gilt. */
  amount_gross: number;
}

export interface IntakeRequestBody {
  contract: "clean24_sales_intake_request_v1";
  submission_id: string;
  quote_id: string;
  service_category: ServiceCategory;
  service_variant?: ServiceVariant | null;
  service_input: Record<string, unknown>;
  customer: {
    salutation?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
  object: {
    address_line?: string | null;
    house_number?: string | null;
    zip?: string | null;
    city?: string | null;
    canton?: string | null;
    floor?: string | null;
    access_notes?: string | null;
    cleaning_date?: string | null;
    cleaning_time?: string | null;
    handover_date?: string | null;
    handover_time?: string | null;
  };
  commercial_context?: { discount_code?: string | null } | null;
  attachments?: string[] | null;
  customer_message?: string | null;
  source_reference?: string | null;
  submitted_at?: string | null;
}

export interface IntakeResponseBody {
  contract: "clean24_sales_intake_response_v1";
  submission_id: string;
  lead_id: string;
  quote_id: string;
  service_category: ServiceCategory;
  pricing_mode: PricingMode;
  status: "created" | "duplicate";
  offer: {
    created: boolean;
    offer_id: string | null;
    offer_number: string | null;
    reason:
      | "created"
      | "already_exists"
      | "manual_review_required"
      | "automatic_offer_disabled"
      | "service_not_eligible"
      | "pricing_not_ready"
      | "in_progress"
      | "automation_failed";
  };
}

export interface Clean24ApiErrorBody {
  contract: "clean24_api_error_v1";
  code: string;
  message: string;
  request_id: string | null;
  details?: Array<{ field: string; message: string }>;
}

export interface ThinClientFormData extends LeadFormData {
  quote_token?: string;
  discount_code?: string;
}

const SERVICE_INPUT_KEYS: Record<string, string[]> = {
  private_cleaning: [
    "floor_area_m2",
    "bathrooms",
    "floors",
    "visits_per_month",
    "oven_inside",
    "fridge_inside",
    "kitchen_cabinets_inside",
    "cellar_hobby_up_to_20",
    "balcony_terrace_up_to_15",
    "strong_pet_hair",
    "bed_count",
    "strong_contamination",
    "mold",
    "extreme_clutter",
    "construction_state",
    "unusual_requirements",
  ],
  office_cleaning: [
    "floor_area_m2",
    "wc_count",
    "shower_count",
    "kitchen_count",
    "meeting_room_count",
    "reception_area",
    "workplaces",
    "floors",
    "high_traffic_customer_area",
    "recurrence",
    "preferred_time",
    "access_method",
    "consumables",
    "medical_hygiene",
    "gastro_food",
    "industry_workshop",
    "heavy_contamination",
    "machine_cleaning",
    "special_disinfection",
    "complex_multibuilding",
    "special_security",
    "sensitive_floor",
    "unclear_scope",
  ],
  construction_cleaning: [
    "object_type",
    "rooms",
    "floor_area_m2",
    "heavy_cement",
    "heavy_silicone",
    "heavy_glue",
    "heavy_paint",
    "protective_film",
    "damaged_sensitive_surfaces",
    "lift_required",
    "inaccessible_glass",
    "facade_glazing",
    "construction_waste",
    "dangerous_substances",
    "asbestos_suspicion",
    "fire_chemical_damage",
    "industrial_facility",
    "active_site",
    "unclear_scope",
  ],
  deep_cleaning: [
    "object_type",
    "rooms",
    "floor_area_m2",
    "dirtiness",
    "furnishing",
    "addons",
    "extreme_clutter",
    "extensive_mold",
    "fire_smoke_damage",
    "unknown_chemicals",
    "special_floor",
    "extreme_grease_limescale",
    "large_furniture_movement",
    "industrial_equipment",
    "unclear_state",
  ],
  facility_staircase_cleaning: [
    "entrances",
    "floors",
    "residential_units",
    "lift_cabin",
    "basement_corridor",
    "laundry_room",
    "bike_room",
    "exterior_entrance_area",
    "recurrence",
    "garden_maintenance",
    "lawn_mowing",
    "winter_service",
    "snow_clearing",
    "emergency_duty",
    "technical_repairs",
    "large_garage",
    "complex_technical_services",
  ],
  clearance_disposal: [
    "volume_m3",
    "floor_without_lift",
    "carrying_distance",
    "complex_dismantling",
    "value_offset_possible",
    "piano",
    "safe",
    "heavy_machinery",
    "chemicals",
    "paint_solvents",
    "asbestos",
    "medical_waste",
    "industrial_appliances",
    "extreme_waste",
    "hygiene_contamination",
    "pests",
    "construction_rubble",
    "unclear_volume",
    "difficult_access",
  ],
  special_cleaning: [
    "subtype",
    "area_m2",
    "strong_stains_pet_odor",
    "very_dirty",
    "wool_delicate",
    "natural_stone",
    "wood",
    "coated_sensitive",
    "facade",
    "oil_spots",
    "heavy_oil_chemical",
    "special_wastewater",
    "sensitive_coating",
    "active_traffic",
    "floor_marking",
    "extreme_contamination",
    "nicotine_base",
    "very_severe_nicotine",
  ],
};

export function serviceVariantFor(data: Pick<LeadFormData, "service_category" | "facility_product">): ServiceVariant | null {
  return data.service_category === "facility_staircase_cleaning"
    ? data.facility_product ?? "staircase"
    : null;
}

export function buildQuoteServiceInput(data: Pick<LeadFormData, "service_category" | "apartment_size" | "property_type" | "balcony" | "cellar" | "oven_heavy" | "blinds" | "express" | "pricing_inputs" | "addons">): Record<string, unknown> {
  const serviceCategory = data.service_category ?? "move_out_cleaning";

  if (serviceCategory === "move_out_cleaning") {
    const addonKeys = [
      data.balcony ? "balcony" : null,
      data.cellar ? "cellar" : null,
      data.oven_heavy ? "oven_heavy" : null,
      data.blinds ? "blinds" : null,
      ...Object.entries(data.addons ?? {}).filter(([, selected]) => selected).map(([key]) => key),
    ].filter((key): key is string => key !== null);

    return compact({
      rooms_key: data.apartment_size,
      /**
       * WOHNUNG ODER HAUS — die Angabe des Kunden, nicht eine Annahme.
       *
       * Hier stand fest „wohnung". Solange das Formular die Objektart gar
       * nicht erst erhob, war die Annahme wenigstens ehrlich. Sobald der
       * Kunde aber wählen kann, wäre sie eine stille Falschangabe: wer
       * „Haus" antippt und trotzdem als Wohnung offeriert wird, bekommt beim
       * Termin eine andere Rechnung als im Formular.
       *
       * Bewertet wird die Angabe weiterhin ausschliesslich in Clean24 OS.
       * Die Sales Engine reicht sie durch und rechnet nichts daraus.
       */
      property_type: data.property_type === "haus" ? "haus" : "wohnung",
      addon_keys: addonKeys,
      express: data.express === true,
    });
  }

  if (serviceCategory === "window_cleaning") {
    const raw = (data.pricing_inputs ?? {}) as Record<string, unknown>;
    const groups = Array.isArray(raw.groups)
      ? raw.groups.map((group) =>
          pick(group as Record<string, unknown>, [
            "width_m",
            "height_m",
            "quantity",
            "window_type",
            "frame_material",
            "lamella_blinds",
            "heavy_limescale_count",
            "mold_count",
          ])
        )
      : raw.groups;
    return compact({
      ...pick(raw, [
        "lift_required",
        "inaccessible_outside",
        "unusual_height",
        "facade_glazing",
        "wintergarten",
        "construction_glue",
        "silicone_residue",
        "paint_residue",
        "cement_residue",
        "damaged_frames",
        "severe_or_unclear_mold",
        "special_glazing",
        "customer_unsure",
      ]),
      groups,
    });
  }

  const keys = SERVICE_INPUT_KEYS[serviceCategory];
  const input = keys ? pick(data.pricing_inputs ?? {}, keys) : { ...(data.pricing_inputs ?? {}) };
  if (serviceCategory === "special_cleaning" && input.nicotine_base && typeof input.nicotine_base === "object" && !Array.isArray(input.nicotine_base)) {
    input.nicotine_base = pick(input.nicotine_base as Record<string, unknown>, SERVICE_INPUT_KEYS.deep_cleaning);
  }
  return input;
}

export function buildQuoteRequest(data: ThinClientFormData, requestId: string): QuoteRequestBody {
  const serviceCategory = data.service_category ?? "move_out_cleaning";
  return {
    contract: "clean24_sales_quote_request_v1",
    request_id: requestId,
    service_category: serviceCategory,
    service_variant: serviceVariantFor(data),
    service_input: buildQuoteServiceInput(data),
    commercial_context: data.discount_code ? { discount_code: data.discount_code } : null,
    source_reference: data.page_path ?? "formular",
  };
}

export function buildIntakeRequest(data: ThinClientFormData, quoteId: string, submissionId: string): IntakeRequestBody {
  const serviceCategory = data.service_category ?? "move_out_cleaning";
  const name = splitName(data.customer_name);
  return {
    contract: "clean24_sales_intake_request_v1",
    submission_id: submissionId,
    quote_id: quoteId,
    service_category: serviceCategory,
    service_variant: serviceVariantFor(data),
    service_input: buildQuoteServiceInput(data),
    customer: {
      salutation: null,
      first_name: name.firstName,
      last_name: name.lastName,
      email: data.email,
      phone: data.phone,
    },
    object: {
      address_line: data.street ?? data.address ?? null,
      house_number: null,
      zip: data.zip,
      city: data.city,
      canton: null,
      floor: null,
      access_notes: null,
      cleaning_date: data.cleaning_date,
      cleaning_time: null,
      handover_date: data.handover_date ?? null,
      handover_time: null,
    },
    commercial_context: data.discount_code ? { discount_code: data.discount_code } : null,
    attachments: data.attachments ?? [],
    customer_message: data.notes ?? null,
    source_reference: data.page_path ?? "formular",
    submitted_at: new Date().toISOString(),
  };
}

export function fingerprintServiceInput(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

export function containsAuthoritativePrice(value: unknown): boolean {
  return /\b(price|total|calculated_customer_gross|estimated_price_min|estimated_price_max|calculated_gross|richtpreis|subtotal|amount_chf)\b/i.test(
    JSON.stringify(value)
  );
}

function pick(source: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  return keys.reduce<Record<string, unknown>>((result, key) => {
    if (Object.prototype.hasOwnProperty.call(source, key)) result[key] = source[key];
    return result;
  }, {});
}

function compact(source: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== undefined));
}

function splitName(name: string): { firstName: string | null; lastName: string | null } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts.slice(0, -1).join(" "), lastName: parts.at(-1) ?? null };
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortDeep(nested)])
    );
  }
  return value;
}
