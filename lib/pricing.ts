import {
  ADDONS_BY_KEY,
  BASE_PRICES,
  EXPRESS_SURCHARGE,
  PRICE_RANGE_MARGIN,
} from "./constants";

export interface PricingInput {
  apartment_size: string;
  /** Map of addon key -> selected. Keys must match `ADDONS` in constants.ts. */
  addons?: Record<string, boolean>;
  express?: boolean;
}

export interface PricingResult {
  base: number;
  addons: number;
  express_surcharge: number;
  subtotal: number;
  min: number;
  max: number;
  display_min: string;
  display_max: string;
  /** Keys of currently selected add-ons. */
  selected_addons: string[];
}

export function calculatePrice(input: PricingInput): PricingResult {
  const base = BASE_PRICES[input.apartment_size] ?? BASE_PRICES["3.5"];

  const selected_addons: string[] = [];
  let addonsTotal = 0;
  if (input.addons) {
    for (const [key, selected] of Object.entries(input.addons)) {
      if (!selected) continue;
      const meta = ADDONS_BY_KEY[key];
      if (!meta) continue; // unknown key — ignore silently
      selected_addons.push(key);
      addonsTotal += meta.price;
    }
  }

  const subtotal_before_express = base + addonsTotal;
  const express_surcharge = input.express
    ? Math.round(subtotal_before_express * EXPRESS_SURCHARGE)
    : 0;

  const subtotal = subtotal_before_express + express_surcharge;

  const min = Math.floor(subtotal / 10) * 10;
  const max = Math.ceil((subtotal * (1 + PRICE_RANGE_MARGIN)) / 10) * 10;

  return {
    base,
    addons: addonsTotal,
    express_surcharge,
    subtotal,
    min,
    max,
    display_min: `CHF ${min.toLocaleString("de-CH")}`,
    display_max: `CHF ${max.toLocaleString("de-CH")}`,
    selected_addons,
  };
}

export function formatPrice(amount: number): string {
  return `CHF ${amount.toLocaleString("de-CH")}`;
}
