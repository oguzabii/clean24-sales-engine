import {
  ADDONS_BY_KEY,
  BASE_PRICE_RANGES,
  EXPRESS_SURCHARGE,
  HOUSE_SURCHARGE,
} from "./constants";
import { applyDiscountToRange, type ValidatedDiscount } from "./discount";

export interface PricingInput {
  apartment_size: string;
  /** Map of addon key -> selected. Keys must match `ADDONS` in constants.ts. */
  addons?: Record<string, boolean>;
  express?: boolean;
  /** "haus" adds HOUSE_SURCHARGE to both ends of the displayed range. */
  property_type?: string;
}

/** Non-sensitive customer-price reconciliation data sent with automatic leads. */
export interface PriceBreakdown {
  base_min_original: number;
  base_max_original: number;
  base_min_after_discount: number;
  base_max_after_discount: number;
  house_surcharge: number;
  addons_total: number;
  express_surcharge_min: number;
  express_surcharge_max: number;
  final_min: number;
  final_max: number;
}

export interface PricingResult {
  /** Compatibility alias for the former scalar base; always the explicit min. */
  base: number;
  base_min: number;
  base_max: number;
  base_min_after_discount: number;
  base_max_after_discount: number;
  addons: number;
  /** Compatibility alias for the min-endpoint Express delta. */
  express_surcharge: number;
  express_surcharge_min: number;
  express_surcharge_max: number;
  /** CHF added to both min and max when property_type is "haus", else 0. */
  house_surcharge: number;
  /** Compatibility alias for the pre-house min endpoint. */
  subtotal: number;
  original_min: number;
  original_max: number;
  min: number;
  max: number;
  display_min: string;
  display_max: string;
  /** Keys of currently selected add-ons. */
  selected_addons: string[];
  price_breakdown: PriceBreakdown;
}

const FALLBACK_APARTMENT_SIZE = "3.5";

function floorTo10(amount: number): number {
  return Math.floor(amount / 10) * 10;
}

function ceilTo10(amount: number): number {
  return Math.ceil(amount / 10) * 10;
}

/**
 * Preserve the previous Express behavior on each explicit range endpoint:
 * 15% of room + add-ons, rounded to whole CHF first, with the displayed min
 * floored and max ceiled to CHF 10. Haus remains outside the Express basis.
 * The returned deltas can then be kept unchanged when only the room range is
 * discounted.
 */
function calculateExpressDeltas(
  baseMin: number,
  baseMax: number,
  addonsTotal: number,
  express: boolean
): { min: number; max: number } {
  if (!express) return { min: 0, max: 0 };

  const beforeExpressMin = baseMin + addonsTotal;
  const beforeExpressMax = baseMax + addonsTotal;
  const rawMinSurcharge = Math.round(beforeExpressMin * EXPRESS_SURCHARGE);
  const rawMaxSurcharge = Math.round(beforeExpressMax * EXPRESS_SURCHARGE);

  return {
    min: floorTo10(beforeExpressMin + rawMinSurcharge) - beforeExpressMin,
    max: ceilTo10(beforeExpressMax + rawMaxSurcharge) - beforeExpressMax,
  };
}

/**
 * Shared pure customer-pricing calculation for client previews and server
 * payloads. A confirmed discount applies only to the explicit room endpoints;
 * Haus, add-ons, and the precomputed Express deltas remain at full value.
 */
export function calculatePrice(
  input: PricingInput,
  discount?: ValidatedDiscount | null
): PricingResult {
  const baseRange =
    BASE_PRICE_RANGES[input.apartment_size as keyof typeof BASE_PRICE_RANGES] ??
    BASE_PRICE_RANGES[FALLBACK_APARTMENT_SIZE];

  const selected_addons: string[] = [];
  let addonsTotal = 0;
  if (input.addons) {
    for (const [key, selected] of Object.entries(input.addons)) {
      if (!selected) continue;
      const meta = ADDONS_BY_KEY[key];
      if (!meta) continue; // unknown customer key does not affect the range
      selected_addons.push(key);
      addonsTotal += meta.price;
    }
  }

  const discountedBase = discount
    ? applyDiscountToRange(baseRange.min, baseRange.max, discount)
    : { min: baseRange.min, max: baseRange.max };
  const expressDeltas = calculateExpressDeltas(
    baseRange.min,
    baseRange.max,
    addonsTotal,
    input.express === true
  );
  const house_surcharge = input.property_type === "haus" ? HOUSE_SURCHARGE : 0;

  const original_min =
    baseRange.min + addonsTotal + expressDeltas.min + house_surcharge;
  const original_max =
    baseRange.max + addonsTotal + expressDeltas.max + house_surcharge;
  const min = discountedBase.min + addonsTotal + expressDeltas.min + house_surcharge;
  const max = discountedBase.max + addonsTotal + expressDeltas.max + house_surcharge;

  const price_breakdown: PriceBreakdown = {
    base_min_original: baseRange.min,
    base_max_original: baseRange.max,
    base_min_after_discount: discountedBase.min,
    base_max_after_discount: discountedBase.max,
    house_surcharge,
    addons_total: addonsTotal,
    express_surcharge_min: expressDeltas.min,
    express_surcharge_max: expressDeltas.max,
    final_min: min,
    final_max: max,
  };

  return {
    base: baseRange.min,
    base_min: baseRange.min,
    base_max: baseRange.max,
    base_min_after_discount: discountedBase.min,
    base_max_after_discount: discountedBase.max,
    addons: addonsTotal,
    express_surcharge: expressDeltas.min,
    express_surcharge_min: expressDeltas.min,
    express_surcharge_max: expressDeltas.max,
    house_surcharge,
    subtotal: baseRange.min + addonsTotal + expressDeltas.min,
    original_min,
    original_max,
    min,
    max,
    display_min: formatPrice(min),
    display_max: formatPrice(max),
    selected_addons,
    price_breakdown,
  };
}

export function formatPrice(amount: number): string {
  return `CHF ${amount.toLocaleString("de-CH")}`;
}
