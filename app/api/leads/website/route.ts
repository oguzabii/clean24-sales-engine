import { NextResponse } from "next/server";
import { createClean24OsClient, Clean24OsClientError } from "@/lib/clean24-os-client";
import {
  buildIntakeRequest,
  buildQuoteServiceInput,
  fingerprintServiceInput,
  serviceVariantFor,
  type ThinClientFormData,
} from "@/lib/sales-engine-contract";
import { verifyQuoteToken } from "@/lib/quote-token";

const REQUIRED_FIELDS: (keyof ThinClientFormData)[] = [
  "customer_name",
  "email",
  "phone",
  "city",
  "zip",
  "cleaning_date",
  "quote_token",
];

const CONSENT_COOKIE = "c24_google_consent";
const ACQUISITION_COOKIE = "c24_google_acquisition";
const CONVERSION_COOKIE = "c24_google_conversion";

type ConsentState = "granted" | "denied";

type Acquisition = {
  page_path: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  ad_user_data_consent: ConsentState;
  ad_personalization_consent: ConsentState;
};

type StoredAcquisition = Partial<
  Pick<Acquisition, "page_path" | "referrer" | "utm_source" | "utm_medium" | "utm_campaign" | "gclid" | "gbraid" | "wbraid">
>;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Die Einreichung darf so lange laufen, wie Clean24 OS für Lead und Offerte braucht. */
export const maxDuration = 90;

export async function POST(request: Request) {
  let body: Partial<ThinClientFormData>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const serviceCategory = body.service_category ?? "move_out_cleaning";
  const missing = REQUIRED_FIELDS.filter((field) => !body[field]);
  if (!missing.includes("cleaning_date") && (typeof body.cleaning_date !== "string" || !body.cleaning_date.trim())) {
    missing.push("cleaning_date");
  }
  if (serviceCategory === "move_out_cleaning" && !body.apartment_size) missing.push("apartment_size");
  if (missing.length > 0) {
    return NextResponse.json({ error: `Pflichtfelder fehlen: ${missing.join(", ")}` }, { status: 400 });
  }

  const data = {
    ...body,
    balcony: body.balcony ?? false,
    cellar: body.cellar ?? false,
    oven_heavy: body.oven_heavy ?? false,
    blinds: body.blinds ?? false,
    express: body.express ?? false,
  } as ThinClientFormData;

  const attachmentError = validateAttachmentIds(data.attachments);
  if (attachmentError) {
    return NextResponse.json({ error: attachmentError }, { status: 400 });
  }

  let token;
  try {
    token = verifyQuoteToken(data.quote_token ?? "");
  } catch (error) {
    const expired = error instanceof Error && error.message === "QUOTE_EXPIRED";
    return NextResponse.json(
      { error: expired ? "Die Offerte ist abgelaufen. Bitte berechnen Sie den Preis erneut." : "Bitte berechnen Sie den Preis erneut." },
      { status: expired ? 410 : 400 }
    );
  }

  const serviceInput = buildQuoteServiceInput(data);
  if (
    token.service_category !== String(serviceCategory) ||
    token.service_variant !== serviceVariantFor(data) ||
    token.service_input_fingerprint !== fingerprintServiceInput(serviceInput)
  ) {
    return NextResponse.json({ error: "Ihre Angaben haben sich geändert. Bitte berechnen Sie den Preis erneut." }, { status: 409 });
  }

  try {
    const intakeRequest = {
      ...buildIntakeRequest(data, token.quote_id, token.submission_id),
      acquisition: buildAcquisition(request),
    };
    const intake = await createClean24OsClient().intake(intakeRequest);
    const response = NextResponse.json(
      {
        success: true,
        pricing_mode: intake.pricing_mode,
        status: intake.status,
      },
      { status: intake.status === "created" ? 201 : 200 }
    );

    if (shouldArmGoogleAdsConversion(request)) {
      response.cookies.set(CONVERSION_COOKIE, intake.lead_id, {
        path: "/",
        maxAge: 300,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        httpOnly: false,
      });
    }

    return response;
  } catch (error) {
    if (error instanceof Clean24OsClientError) {
      return NextResponse.json(
        { error: customerSafeError(error.code), code: error.code },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    return NextResponse.json({ error: "Anfrage konnte momentan nicht übermittelt werden." }, { status: 500 });
  }
}

function buildAcquisition(request: Request): Acquisition {
  const cookies = parseCookies(request.headers.get("cookie"));
  const consent: ConsentState = cookies[CONSENT_COOKIE] === "granted" ? "granted" : "denied";
  const refererUrl = safeUrl(request.headers.get("referer"));
  const stored = consent === "granted" ? parseStoredAcquisition(cookies[ACQUISITION_COOKIE]) : {};

  const currentParam = (name: string, max: number) => clamp(refererUrl?.searchParams.get(name) ?? null, max);
  const storedValue = (name: keyof StoredAcquisition, max: number) => clamp(stored[name] ?? null, max);
  const clickId = (name: "gclid" | "gbraid" | "wbraid") =>
    consent === "granted" ? storedValue(name, 500) ?? currentParam(name, 500) : null;

  return {
    page_path: clamp(refererUrl ? `${refererUrl.pathname}${refererUrl.search}` : stored.page_path ?? null, 300),
    referrer: storedValue("referrer", 1000),
    utm_source: storedValue("utm_source", 200) ?? currentParam("utm_source", 200),
    utm_medium: storedValue("utm_medium", 200) ?? currentParam("utm_medium", 200),
    utm_campaign: storedValue("utm_campaign", 300) ?? currentParam("utm_campaign", 300),
    gclid: clickId("gclid"),
    gbraid: clickId("gbraid"),
    wbraid: clickId("wbraid"),
    ad_user_data_consent: consent,
    ad_personalization_consent: consent,
  };
}

function shouldArmGoogleAdsConversion(request: Request): boolean {
  const cookies = parseCookies(request.headers.get("cookie"));
  if (cookies[CONSENT_COOKIE] !== "granted") return false;
  return Boolean(
    process.env.NEXT_PUBLIC_GADS_CONVERSION_ID?.trim() &&
      process.env.NEXT_PUBLIC_GADS_FORM_CONVERSION_LABEL?.trim()
  );
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return index === -1 ? [part, ""] : [part.slice(0, index), part.slice(index + 1)];
      })
  );
}

function parseStoredAcquisition(raw: string | undefined): StoredAcquisition {
  if (!raw) return {};
  try {
    const value = JSON.parse(decodeURIComponent(raw));
    return value && typeof value === "object" && !Array.isArray(value) ? (value as StoredAcquisition) : {};
  } catch {
    return {};
  }
}

function safeUrl(value: string | null): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function clamp(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function validateAttachmentIds(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) return "Ungültige Dateianhänge.";
  if (value.length > 10) return "Maximal 10 Dateien möglich.";
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return value.every((id) => typeof id === "string" && uuid.test(id))
    ? null
    : "Ungültige Dateianhänge.";
}

function customerSafeError(code: string): string {
  if (code === "QUOTE_EXPIRED") return "Die Offerte ist abgelaufen. Bitte berechnen Sie den Preis erneut.";
  if (code === "QUOTE_INPUT_MISMATCH") return "Ihre Angaben haben sich geändert. Bitte berechnen Sie den Preis erneut.";
  if (code === "QUOTE_NOT_FOUND") return "Bitte berechnen Sie den Preis erneut.";
  if (code === "OS_UNAVAILABLE" || code === "OS_TIMEOUT") {
    return "Anfrage konnte momentan nicht übermittelt werden. Bitte versuchen Sie es erneut.";
  }
  return "Anfrage konnte momentan nicht übermittelt werden.";
}
