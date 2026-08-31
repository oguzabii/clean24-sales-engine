/**
 * Server-only discount-code validation against Clean24 OS.
 *
 * Uses CLEAN24_OS_DISCOUNT_VALIDATE_URL + CLEAN24_OS_INTAKE_SECRET
 * (sent as `x-intake-secret`, server-to-server only — never exposed to the
 * browser). Returns the validated discount, or null when the code is invalid,
 * unknown, or validation is not configured/unreachable.
 */
import type { DiscountType, ValidatedDiscount } from "./discount";

export async function validateDiscountCode(
  code: string
): Promise<ValidatedDiscount | null> {
  const url = process.env.CLEAN24_OS_DISCOUNT_VALIDATE_URL;
  const trimmed = code.trim();
  if (!url || !trimmed) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CLEAN24_OS_INTAKE_SECRET
          ? { "x-intake-secret": process.env.CLEAN24_OS_INTAKE_SECRET }
          : {}),
      },
      body: JSON.stringify({ code: trimmed }),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json().catch(() => null)) as {
      valid?: boolean;
      code?: string;
      discount_type?: string;
      discount_value?: number;
    } | null;

    if (
      data?.valid &&
      (data.discount_type === "percent" || data.discount_type === "fixed_chf") &&
      typeof data.discount_value === "number" &&
      data.discount_value > 0
    ) {
      return {
        code: String(data.code ?? trimmed).toUpperCase(),
        type: data.discount_type as DiscountType,
        value: data.discount_value,
      };
    }
    return null;
  } catch {
    return null;
  }
}
