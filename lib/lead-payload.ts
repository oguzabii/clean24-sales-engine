import { calculatePrice } from "./pricing";

export interface LeadFormData {
  customer_name: string;
  email: string;
  phone: string;
  /** Street + house number, e.g. "Musterstrasse 12". */
  address?: string;
  city: string;
  zip: string;
  apartment_size: string;
  square_meters?: string;
  cleaning_date: string;
  handover_date?: string;
  windows_count?: string;
  /** Map of addon key -> selected. Keys must match `ADDONS` in constants.ts. */
  addons?: Record<string, boolean>;
  express?: boolean;
  notes?: string;
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
  created_at: string;
}

export function buildLeadPayload(data: LeadFormData): LeadPayload {
  const pricing = calculatePrice({
    apartment_size: data.apartment_size,
    addons: data.addons,
    express: data.express,
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
    estimated_price_min: pricing.min,
    estimated_price_max: pricing.max,
    created_at: new Date().toISOString(),
  };
}
