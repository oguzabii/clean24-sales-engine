import crypto from "node:crypto";
import type { ServiceCategory, ServiceVariant } from "./sales-engine-contract";

export interface QuoteTokenPayload {
  quote_id: string;
  request_id: string;
  submission_id: string;
  service_category: ServiceCategory;
  service_variant: ServiceVariant | null;
  service_input_fingerprint: string;
  expires_at: string;
}

/**
 * DAS GEHEIMNIS DIESER SIGNATUR IST EIN ANDERES ALS DAS DER SCHNITTSTELLE.
 *
 * ---------------------------------------------------------------------------
 * WARUM DIE TRENNUNG SEIN MUSS
 * ---------------------------------------------------------------------------
 *
 * Diese Marke wandert in den Browser des Kunden und muss beim nächsten Schritt
 * wieder gelten — ihr Schlüssel muss also über Minuten bis Stunden STABIL
 * sein.
 *
 * Der Ausweis gegenüber Clean24 OS ist in der Produktion ein Vercel-Merkmal:
 * kurzlebig und von selbst rotierend. Genau richtig für einen Ausweis, und
 * völlig unbrauchbar als Signaturschlüssel — jede Rotation entwertete
 * schlagartig alle offenen Angebotsmarken, und jeder Kunde mitten im Formular
 * bekäme „Ungültige Angebotskennung".
 *
 * Zwei Zwecke, zwei Geheimnisse.
 *
 * ---------------------------------------------------------------------------
 * DER RÜCKFALL
 * ---------------------------------------------------------------------------
 *
 * Fehlt das eigene Geheimnis, gilt das der Schnittstelle. Das hält lokale
 * Läufe und bestehende Prüfungen unverändert lauffähig. In der Produktion ist
 * ein eigenes Geheimnis gesetzt — dort greift der Rückfall nie.
 */
export function quoteTokenSecret(): string {
  return (
    process.env.SALES_ENGINE_QUOTE_TOKEN_SECRET ??
    process.env.SALES_ENGINE_INTEGRATION_SECRET ??
    ""
  );
}

export function signQuoteToken(payload: QuoteTokenPayload, secret = quoteTokenSecret()): string {
  if (!secret) throw new Error("Quote token secret is not configured.");
  const body = base64url(JSON.stringify(payload));
  const signature = hmac(body, secret);
  return `${body}.${signature}`;
}

export function verifyQuoteToken(token: string, secret = quoteTokenSecret()): QuoteTokenPayload {
  if (!secret) throw new Error("Quote token secret is not configured.");
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Ungültige Angebotskennung.");
  const expected = hmac(body, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    throw new Error("Ungültige Angebotskennung.");
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as QuoteTokenPayload;
  if (Date.parse(payload.expires_at) <= Date.now()) throw new Error("QUOTE_EXPIRED");
  return payload;
}

export function newLogicalId(prefix: "quote" | "submission"): string {
  return `${prefix}:${crypto.randomUUID()}`;
}

function hmac(value: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function base64url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}
