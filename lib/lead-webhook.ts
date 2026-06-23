/**
 * Outbound delivery to the Clean24 Lead Autopilot webhook.
 *
 * Uses the existing env vars (CLEAN24_LEAD_WEBHOOK_URL / _SECRET) and the same
 * `x-webhook-secret` header contract as the main lead route. The secret is only
 * sent as a request header — never logged or returned. Best-effort: failures
 * are logged and reported via the result, never thrown.
 */
export interface WebhookDeliveryResult {
  configured: boolean;
  ok: boolean;
}

export async function postLeadWebhook(
  payload: Record<string, unknown>,
  context = "Webhook"
): Promise<WebhookDeliveryResult> {
  const url = process.env.CLEAN24_LEAD_WEBHOOK_URL;
  if (!url) return { configured: false, ok: false };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CLEAN24_LEAD_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.CLEAN24_LEAD_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        `[Clean24 ${context}] Non-OK webhook response:`,
        res.status,
        await res.text().catch(() => "")
      );
    }
    return { configured: true, ok: res.ok };
  } catch (err) {
    console.error(`[Clean24 ${context}] Failed to deliver webhook:`, err);
    return { configured: true, ok: false };
  }
}
