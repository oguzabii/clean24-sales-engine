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
    const intake = await createClean24OsClient().intake(buildIntakeRequest(data, token.quote_id, token.submission_id));
    return NextResponse.json(
      {
        success: true,
        pricing_mode: intake.pricing_mode,
        status: intake.status,
      },
      { status: intake.status === "created" ? 201 : 200 }
    );
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
