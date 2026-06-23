/**
 * Discount (Rabattcode) helpers — pure, shared by the form preview and the
 * server lead route. No network/IO here. Discount codes are validated against
 * the Lead Autopilot API (see lib/discount-validate.ts); this module only
 * applies an already-validated discount to a price.
 */

export type DiscountType = "percent" | "fixed_chf";

export interface ValidatedDiscount {
  code: string;
  type: DiscountType;
  value: number;
}

export function discountLabel(d: ValidatedDiscount): string {
  return d.type === "percent" ? `${d.value}%` : `CHF ${d.value}`;
}

function roundTo10(n: number): number {
  return Math.max(0, Math.round(n / 10) * 10);
}

/** Apply a discount to a single CHF amount, floored at 0 and rounded to 10. */
export function applyDiscountAmount(amount: number, d: ValidatedDiscount): number {
  const discounted =
    d.type === "percent" ? amount * (1 - d.value / 100) : amount - d.value;
  return roundTo10(discounted);
}

/** Apply a discount to a Richtpreis range. Ordering is preserved. */
export function applyDiscountToRange(
  min: number,
  max: number,
  d: ValidatedDiscount
): { min: number; max: number } {
  return { min: applyDiscountAmount(min, d), max: applyDiscountAmount(max, d) };
}
