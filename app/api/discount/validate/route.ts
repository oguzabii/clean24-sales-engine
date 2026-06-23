import { NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discount-validate";
import { applyDiscountToRange, discountLabel } from "@/lib/discount";

// fetch() to the Autopilot runs in the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser-facing discount preview. Validates the code via the Autopilot
 * (server-to-server, secret stays server-side) and returns the discount plus
 * an optional discounted price range for the live form preview. The authoritative
 * application happens again in the lead route on submit.
 */
export async function POST(request: Request) {
  let body: { code?: string; price_min?: number; price_max?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  if (!code) return NextResponse.json({ valid: false });

  const discount = await validateDiscountCode(code);
  if (!discount) return NextResponse.json({ valid: false });

  const result: {
    valid: true;
    code: string;
    type: string;
    value: number;
    label: string;
    price_min?: number;
    price_max?: number;
  } = {
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    label: discountLabel(discount),
  };

  if (typeof body.price_min === "number" && typeof body.price_max === "number") {
    const ranged = applyDiscountToRange(body.price_min, body.price_max, discount);
    result.price_min = ranged.min;
    result.price_max = ranged.max;
  }

  return NextResponse.json(result);
}
