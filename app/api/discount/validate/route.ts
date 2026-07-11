import { NextResponse } from "next/server";
import { validateDiscountCode } from "@/lib/discount-validate";
import { discountLabel } from "@/lib/discount";
import { calculatePrice } from "@/lib/pricing";

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
  let body: {
    code?: unknown;
    apartment_size?: unknown;
    property_type?: unknown;
    addons?: unknown;
    express?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  if (!code) return NextResponse.json({ valid: false });

  const discount = await validateDiscountCode(code);
  if (!discount) return NextResponse.json({ valid: false });

  const addons =
    typeof body.addons === "object" && body.addons !== null && !Array.isArray(body.addons)
      ? Object.fromEntries(
          Object.entries(body.addons).filter((entry): entry is [string, boolean] =>
            typeof entry[1] === "boolean"
          )
        )
      : {};
  const pricing = calculatePrice(
    {
      apartment_size:
        typeof body.apartment_size === "string" ? body.apartment_size : "3.5",
      property_type:
        typeof body.property_type === "string" ? body.property_type : "wohnung",
      addons,
      express: body.express === true,
    },
    discount
  );

  const result: {
    valid: true;
    code: string;
    type: string;
    value: number;
    label: string;
    price_min: number;
    price_max: number;
  } = {
    valid: true,
    code: discount.code,
    type: discount.type,
    value: discount.value,
    label: discountLabel(discount),
    price_min: pricing.min,
    price_max: pricing.max,
  };

  return NextResponse.json(result);
}
