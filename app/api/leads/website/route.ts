import { NextRequest, NextResponse } from "next/server";
import { buildLeadPayload, type LeadFormData } from "@/lib/lead-payload";
import { isSmtpConfigured, sendMail } from "@/lib/mail/smtp";
import { buildLeadNotificationEmail } from "@/lib/mail/emails";

// nodemailer requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

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

  // ---- 1. Lead Autopilot webhook (unchanged behavior) ----------------
  // The webhook stays the primary, one-way delivery channel. Failures are
  // logged and never thrown — exactly as before.
  const webhookUrl = process.env.CLEAN24_LEAD_WEBHOOK_URL;
  const webhookConfigured = !!webhookUrl;
  let webhookOk = false;

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

      webhookOk = webhookRes.ok;
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

  // ---- 2. Internal admin notification email (additive) ---------------
  // Best-effort: a failure here must not block the customer flow as long as
  // the webhook succeeded. Only when BOTH channels are configured and BOTH
  // fail do we surface an error to the client.
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const emailConfigured = !!adminEmail && isSmtpConfigured();
  let emailOk = false;

  if (emailConfigured) {
    try {
      const { subject, html, text } = buildLeadNotificationEmail(payload);
      await sendMail({
        to: adminEmail as string,
        subject,
        html,
        text,
        // Replies go straight to the customer when an address is present.
        replyTo: payload.email || undefined,
      });
      emailOk = true;
    } catch (err) {
      console.warn(
        "[Clean24 Lead] Admin notification email failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // ---- 3. Decide the response ----------------------------------------
  // Error only when both configured outbound channels failed (the lead would
  // otherwise be silently lost). If a channel is not configured it is not a
  // failure — this preserves the legacy behavior where a webhook-only setup
  // (or local dev with neither configured) still returns success.
  if (webhookConfigured && emailConfigured && !webhookOk && !emailOk) {
    return NextResponse.json(
      {
        error:
          "Ihre Anfrage konnte gerade nicht übermittelt werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.",
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    estimated_price_min: payload.estimated_price_min,
    estimated_price_max: payload.estimated_price_max,
  });
}
