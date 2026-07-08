import { calculatePrice } from "./pricing";
import {
  MOVE_OUT_CATEGORY,
  pricingModeFor,
  resolveServiceCategory,
  type PricingMode,
} from "./service-categories";

/**
 * Reference to a file already uploaded to the Lead Autopilot upload endpoint
 * (`POST /api/uploads/website-lead`). Only these references travel in the
 * lead payload — never file contents or base64.
 */
export interface LeadAttachmentRef {
  storage_path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
}

export interface LeadFormData {
  customer_name: string;
  email: string;
  phone: string;
  /** Street + house number, e.g. "Musterstrasse 12". */
  address?: string;
  city: string;
  zip: string;
  /**
   * Service category (lib/service-categories.ts). Missing/unknown → treated
   * as move_out_cleaning so legacy submits keep working unchanged.
   */
  service_category?: string;
  /** Required for move_out_cleaning (drives the Richtpreis); absent otherwise. */
  apartment_size?: string;
  /** Non-move-out inquiries: wohnung | haus | buero_gewerbe | baustelle | treppenhaus_liegenschaft | andere. */
  object_type?: string;
  /** Non-move-out inquiries: optional preferred date (mirrors cleaning_date). */
  preferred_date?: string;
  /** "wohnung" (default) or "haus" — "haus" adds HOUSE_SURCHARGE to the range. */
  property_type?: string;
  square_meters?: string;
  /** Floor area in m² (info only, no price effect). */
  floor_area_m2?: string;
  /** Required for move_out_cleaning; optional "gewünschter Termin" otherwise. */
  cleaning_date?: string;
  handover_date?: string;
  /** Optional handover time (HH:MM), only meaningful together with handover_date. */
  handover_time?: string;
  /** Abgabegarantie gewünscht? Defaults to true. No effect on the range. */
  handover_guarantee_requested?: boolean;
  /** Recurring services only: daily | weekly | biweekly | monthly | other. */
  recurrence?: string;
  /** Info only: low | medium | high. */
  dirtiness_level?: string;
  windows_count?: string;
  /** Map of addon key -> selected. Keys must match `ADDONS` in constants.ts. */
  addons?: Record<string, boolean>;
  express?: boolean;
  notes?: string;
  /** Optional discount / Rabattcode entered by the customer. */
  discount_code?: string;
  /** References to files already uploaded to the Lead Autopilot (optional). */
  attachments?: LeadAttachmentRef[];
  page_path?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface LeadPayload extends Omit<LeadFormData, "addons" | "express"> {
  source: "clean24_website";
  /** "umzugsreinigung" for move_out_cleaning (unchanged); category value otherwise. */
  service_type: string;
  /** Category metadata (v: category flow) — stable value + German label. */
  service_category: string;
  service_category_label: string;
  service_category_description?: string;
  /** automatic_range (move_out_cleaning) | manual_review (all other categories). */
  pricing_mode: PricingMode;
  /** Selected add-on keys (plus "express" if applicable) for webhook receiver. */
  addons: string[];
  express: boolean;
  /** Only set for pricing_mode=automatic_range — never computed for manual review. */
  estimated_price_min?: number;
  estimated_price_max?: number;
  /** Discount metadata — set only when a valid Rabattcode was applied. */
  discount_type?: "percent" | "fixed_chf" | null;
  discount_value?: number | null;
  /** Pre-discount Richtpreis range (set only when a discount was applied). */
  price_min_original?: number | null;
  price_max_original?: number | null;
  created_at: string;
}

export function buildLeadPayload(data: LeadFormData): LeadPayload {
  const category = resolveServiceCategory(data.service_category);
  const pricingMode = pricingModeFor(category.value);

  const { addons: _addons, express: _express, ...rest } = data;
  void _addons;
  void _express;

  const common = {
    ...rest,
    source: "clean24_website" as const,
    service_category: category.value,
    service_category_label: category.label,
    service_category_description: category.description,
    pricing_mode: pricingMode,
    created_at: new Date().toISOString(),
  };

  if (pricingMode === "automatic_range") {
    // Umzugsreinigung — EXACTLY the previous behavior (pricing, add-ons,
    // guarantee default "Ja", service_type value unchanged).
    const pricing = calculatePrice({
      apartment_size: data.apartment_size ?? "3.5",
      addons: data.addons,
      express: data.express,
      property_type: data.property_type,
    });
    const addons: string[] = [...pricing.selected_addons];
    if (data.express) addons.push("express");

    return {
      ...common,
      service_type: "umzugsreinigung",
      addons,
      express: data.express ?? false,
      // Abgabegarantie defaults to "Ja" — always sent explicitly.
      handover_guarantee_requested: data.handover_guarantee_requested ?? true,
      estimated_price_min: pricing.min,
      estimated_price_max: pricing.max,
    };
  }

  // Manual review — NO price calculation, no house surcharge, no add-ons,
  // no guarantee default. Individual inquiry with the common fields only.
  return {
    ...common,
    service_type: category.value,
    addons: [],
    express: false,
    handover_guarantee_requested: data.handover_guarantee_requested,
    preferred_date: data.preferred_date ?? (data.cleaning_date || undefined),
  };
}

export { MOVE_OUT_CATEGORY };
