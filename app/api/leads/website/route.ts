import { NextRequest, NextResponse } from "next/server";
import { buildLeadPayload, type LeadFormData } from "@/lib/lead-payload";

const REQUIRED_FIELDS: (keyof LeadFormData)[] = [
  "customer_name",
  "email",
  "phone",
  "city",
  "zip",
  "apartment_size",
  "cleaning_date",
];

export async function POST(request: NextRequest) {
  let body: Partial<LeadFormData>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((f) => !body[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Pflichtfelder fehlen: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const data = body as LeadFormData;

  const payload = buildLeadPayload({
    ...data,
    addons: data.addons ?? {},
    express: data.express ?? false,
  });

  if (process.env.NODE_ENV === "development") {
    console.log("[Clean24 Lead]", JSON.stringify(payload, null, 2));
  }

  const webhookUrl = process.env.CLEAN24_LEAD_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const webhookRes = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CLEAN24_LEAD_WEBHOOK_SECRET
            ? { "x-webhook-secret": process.env.CLEAN24_LEAD_WEBHOOK_SECRET }
            : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!webhookRes.ok) {
        console.error(
          "[Clean24 Webhook] Non-OK response:",
          webhookRes.status,
          await webhookRes.text().catch(() => "")
        );
      }
    } catch (err) {
      console.error("[Clean24 Webhook] Failed to deliver lead:", err);
    }
  }

  return NextResponse.json({
    success: true,
    estimated_price_min: payload.estimated_price_min,
    estimated_price_max: payload.estimated_price_max,
  });
}
