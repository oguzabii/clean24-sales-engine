import { calculatePrice } from "./pricing";

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
  apartment_size: string;
  /** "wohnung" (default) or "haus" — "haus" adds HOUSE_SURCHARGE to the range. */
  property_type?: string;
  square_meters?: string;
  /** Floor area in m² (info only, no price effect). */
  floor_area_m2?: string;
  cleaning_date: string;
  handover_date?: string;
  /** Optional handover time (HH:MM), only meaningful together with handover_date. */
  handover_time?: string;
  /** Abgabegarantie gewünscht? Defaults to true. No effect on the range. */
  handover_guarantee_requested?: boolean;
  /** Recurring services only: daily | weekly | biweekly | monthly | other. */
  recurrence?: string;
  /** Info only: low | medium | high. */
  dirtiness_level?: string;
  /** Info only: quality | price. */
  priority_preference?: string;
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
  service_type: "umzugsreinigung";
  /** Selected add-on keys (plus "express" if applicable) for webhook receiver. */
  addons: string[];
  express: boolean;
  estimated_price_min: number;
  estimated_price_max: number;
  /** Discount metadata — set only when a valid Rabattcode was applied. */
  discount_type?: "percent" | "fixed_chf" | null;
  discount_value?: number | null;
  /** Pre-discount Richtpreis range (set only when a discount was applied). */
  price_min_original?: number | null;
  price_max_original?: number | null;
  created_at: string;
}

export function buildLeadPayload(data: LeadFormData): LeadPayload {
  const pricing = calculatePrice({
    apartment_size: data.apartment_size,
    addons: data.addons,
    express: data.express,
    property_type: data.property_type,
  });

  const addons: string[] = [...pricing.selected_addons];
  if (data.express) addons.push("express");

  const { addons: _addons, express: _express, ...rest } = data;
  void _addons;
  void _express;

  return {
    ...rest,
    source: "clean24_website",
    service_type: "umzugsreinigung",
    addons,
    express: data.express ?? false,
    // Abgabegarantie defaults to "Ja" — always sent explicitly.
    handover_guarantee_requested: data.handover_guarantee_requested ?? true,
    estimated_price_min: pricing.min,
    estimated_price_max: pricing.max,
    created_at: new Date().toISOString(),
  };
}
