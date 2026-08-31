import { BASE_PRICE_RANGES } from "./constants";
import { calculatePrice, type PricingInput } from "./pricing";
import type { AmountBasis, CustomerQuoteResponseBody } from "./sales-engine-contract";

export interface RichtpreisRange {
  min: number;
  max: number;
  amount_basis: AmountBasis;
}

/** Approved live guidance only. Never pass these amounts to OS quote/intake. */
export function moveOutRichtpreis(input: PricingInput): RichtpreisRange | null {
  if (!Object.hasOwn(BASE_PRICE_RANGES, input.apartment_size)) return null;
  const { min, max } = calculatePrice(input);
  return { min, max, amount_basis: "one_off" };
}

/** A single amount, missing endpoints, or manual review is not a price range. */
export function quoteRichtpreis(quote: CustomerQuoteResponseBody | null): RichtpreisRange | null {
  if (quote?.pricing_mode !== "automatic" || quote.pricing.currency !== "CHF") return null;
  const { estimated_price_min: min, estimated_price_max: max, amount_basis } = quote.pricing;
  if (typeof min !== "number" || typeof max !== "number" ||
      !Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max <= min ||
      (amount_basis !== "one_off" && amount_basis !== "monthly")) return null;
  return { min, max, amount_basis };
}

export function formatRichtpreis(range: Pick<RichtpreisRange, "min" | "max">): string {
  const number = (value: number) => new Intl.NumberFormat("de-CH", {
    maximumFractionDigits: 2,
  }).format(value).replace(/\u2019/g, "'");
  return `CHF ${number(range.min)}\u2013${number(range.max)}`;
}
