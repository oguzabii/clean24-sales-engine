import { NextRequest, NextResponse } from "next/server";
import {
  buildLeadPayload,
  type LeadAttachmentRef,
  type LeadFormData,
  type LeadPayload,
} from "@/lib/lead-payload";
import { isSmtpConfigured, sendMail } from "@/lib/mail/smtp";
import {
  buildLeadNotificationEmail,
  buildCustomerConfirmationEmail,
  type WebhookDeliveryStatus,
  type CustomerEmailDeliveryStatus,
} from "@/lib/mail/emails";
import { COMPANY } from "@/lib/constants";
import { MOVE_OUT_CATEGORY, resolveServiceCategory } from "@/lib/service-categories";
import { validateDiscountCode } from "@/lib/discount-validate";

// nodemailer requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

const MAX_ATTACHMENT_REFS = 10;

type ConsentChoice = "granted" | "denied";

type Attribution = {
  consent: ConsentChoice;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

function sanitizeAttachments(value: unknown): LeadAttachmentRef[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const refs = value
    .filter(
      (a): a is LeadAttachmentRef =>
        typeof a === "object" &&
        a !== null &&
        typeof (a as LeadAttachmentRef).storage_path === "string" &&
        (a as LeadAttachmentRef).storage_path.trim() !== "" &&
        typeof (a as LeadAttachmentRef).filename === "string" &&
        typeof (a as LeadAttachmentRef).mime_type === "string" &&
        typeof (a as LeadAttachmentRef).size_bytes === "number"
    )
    .slice(0, MAX_ATTACHMENT_REFS)
    .map((a) => ({
      storage_path: a.storage_path,
      filename: a.filename,
      mime_type: a.mime_type,
      size_bytes: a.size_bytes,
    }));
  return refs.length > 0 ? refs : undefined;
}

function nonEmpty(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function positiveInteger(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function splitCustomerName(name: string): { firstName?: string; lastName?: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function attributionFromRequest(request: NextRequest): Attribution {
  const consent: ConsentChoice =
    request.cookies.get("c24_google_consent")?.value === "granted" ? "granted" : "denied";

  const referer = request.headers.get("referer");
  let params: URLSearchParams | null = null;
  if (referer) {
    try {
      params = new URL(referer).searchParams;
    } catch {
      params = null;
    }
  }

  const adsIds =
    consent === "granted"
      ? {
          gclid: nonEmpty(params?.get("gclid")),
          gbraid: nonEmpty(params?.get("gbraid")),
          wbraid: nonEmpty(params?.get("wbraid")),
        }
      : {};

  return {
    consent,
    ...adsIds,
    utmSource: nonEmpty(params?.get("utm_source")),
    utmMedium: nonEmpty(params?.get("utm_medium")),
    utmCampaign: nonEmpty(params?.get("utm_campaign")),
  };
}

function buildClean24OsPayload(
  payload: LeadPayload,
  data: LeadFormData,
  attribution: Attribution,
  submittedCode: string
): Record<string, unknown> {
  const name = splitCustomerName(data.customer_name);

  return {
    schema_version: 1,
    source: "clean24_website",
    submitted_at: new Date().toISOString(),

    first_name: name.firstName,
    last_name: name.lastName,
    email: payload.email,
    phone: payload.phone,

    // Sales Engine currently captures street + house number in one field.
    // Clean24 OS therefore receives it only as `address` to avoid duplication.
    address: payload.address,
    zip: payload.zip,
    city: payload.city,

    service_category: payload.service_category,
    service_type: payload.service_type,
    apartment_size: payload.apartment_size,
    square_meters: positiveInteger(payload.floor_area_m2 ?? payload.square_meters),
    property_type: payload.property_type,
    windows_count: positiveInteger(payload.windows_count),

    cleaning_date: payload.cleaning_date,
    handover_date: payload.handover_date,
    handover_time: payload.handover_time,
    handover_guarantee_requested: payload.handover_guarantee_requested,

    addons: payload.addons,
    express: payload.express,
    notes: payload.notes,

    attachments: payload.attachments?.map((attachment) => ({
      filename: attachment.filename,
      mime_type: attachment.mime_type,
      size_bytes: attachment.size_bytes,
      kind: attachment.mime_type === "application/pdf" ? "dokument" : "foto",
      external_ref: attachment.storage_path,
    })),

    // Preserve what the customer actually entered. Clean24 OS is the final
    // authority for discount validity and pricing.
    discount_code: submittedCode || undefined,
    estimated_price_min: payload.estimated_price_min,
    estimated_price_max: payload.estimated_price_max,

    page_path: payload.page_path,
    utm_source: payload.utm_source ?? attribution.utmSource,
    utm_medium: payload.utm_medium ?? attribution.utmMedium,
    utm_campaign: payload.utm_campaign ?? attribution.utmCampaign,

    // Stored by Clean24 OS for later Google Ads offline attribution. Click IDs
    // are forwarded only after explicit Google measurement consent.
    gclid: attribution.gclid,
    gbraid: attribution.gbraid,
    wbraid: attribution.wbraid,
    ad_user_data_consent: attribution.consent,
    ad_personalization_consent: attribution.consent,
  };
}

/** Always required — every category needs contact + address data. */
const REQUIRED_BASE_FIELDS: (keyof LeadFormData)[] = [
  "customer_name",
  "email",
  "phone",
  "address",
  "city",
  "zip",
];

/** Additionally required for move_out_cleaning only (drive the Richtpreis). */
const REQUIRED_MOVE_OUT_FIELDS: (keyof LeadFormData)[] = ["apartment_size", "cleaning_date"];

export async function POST(request: NextRequest) {
  let body: Partial<LeadFormData>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const category = resolveServiceCategory(
    typeof body.service_category === "string" ? body.service_category : undefined
  );
  const isMoveOut = category.value === MOVE_OUT_CATEGORY;

  const requiredFields = isMoveOut
    ? [...REQUIRED_BASE_FIELDS, ...REQUIRED_MOVE_OUT_FIELDS]
    : REQUIRED_BASE_FIELDS;
  const missing = requiredFields.filter((f) => !body[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Pflichtfelder fehlen: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  const data = body as LeadFormData;
  const submittedCode = isMoveOut ? (data.discount_code ?? "").trim() : "";

  // Discount preview remains customer-facing; validation now comes from
  // Clean24 OS instead of the legacy Lead Autopilot.
  const discount = submittedCode ? await validateDiscountCode(submittedCode) : null;

  const payload = buildLeadPayload(
    {
      ...data,
      service_category: category.value,
      addons: data.addons ?? {},
      express: data.express ?? false,
      attachments: sanitizeAttachments(data.attachments),
    },
    discount
  );

  const attribution = attributionFromRequest(request);

  // ---- 1. Clean24 OS intake ------------------------------------------
  // Clean24 OS currently owns the automatic Umzugsreinigung workflow. Other
  // inquiry categories remain on manual review until the OS contract supports
  // them explicitly, preventing accidental misclassification as Umzugsreinigung.
  const intakeUrl = process.env.CLEAN24_OS_INTAKE_URL;
  const intakeConfigured = isMoveOut && Boolean(intakeUrl);
  let intakeOk = false;
  let clean24OsLeadId: string | undefined;

  if (intakeConfigured && intakeUrl) {
    try {
      const intakeRes = await fetch(intakeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.CLEAN24_OS_INTAKE_SECRET
            ? { "x-intake-secret": process.env.CLEAN24_OS_INTAKE_SECRET }
            : {}),
        },
        body: JSON.stringify(buildClean24OsPayload(payload, data, attribution, submittedCode)),
        cache: "no-store",
      });

      const intakeBody = (await intakeRes.json().catch(() => null)) as {
        status?: string;
        lead_id?: string;
        error?: string;
      } | null;

      intakeOk = intakeRes.ok && (intakeBody?.status === "accepted" || intakeBody?.status === "duplicate");
      clean24OsLeadId = typeof intakeBody?.lead_id === "string" ? intakeBody.lead_id : undefined;

      if (!intakeOk) {
        console.error(
          "[Clean24 OS Intake] Non-OK response:",
          intakeRes.status,
          intakeBody?.error ?? intakeBody?.status ?? "unknown"
        );
      }
    } catch (err) {
      console.error(
        "[Clean24 OS Intake] Failed:",
        err instanceof Error ? err.message : "unknown error"
      );
    }
  }

  // Existing email templates use this generic delivery status type.
  const webhookStatus: WebhookDeliveryStatus = !intakeConfigured
    ? "not_configured"
    : intakeOk
      ? "delivered"
      : "failed";

  const smtpReady = isSmtpConfigured();

  // ---- 2. Customer confirmation email --------------------------------
  let customerEmailStatus: CustomerEmailDeliveryStatus;
  if (!smtpReady) {
    customerEmailStatus = "not_configured";
  } else if (!payload.email) {
    customerEmailStatus = "no_email";
  } else {
    try {
      const { subject, html, text } = buildCustomerConfirmationEmail(payload);
      await sendMail({
        to: payload.email,
        subject,
        html,
        text,
        replyTo: process.env.ADMIN_NOTIFICATION_EMAIL || COMPANY.email,
      });
      customerEmailStatus = "sent";
    } catch (err) {
      customerEmailStatus = "failed";
      console.warn(
        "[Clean24 Lead] Customer confirmation email failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // ---- 3. Internal admin notification email ---------------------------
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const adminConfigured = !!adminEmail && smtpReady;
  let adminEmailOk = false;

  if (adminConfigured) {
    try {
      const { subject, html, text } = buildLeadNotificationEmail(payload, {
        webhookStatus,
        customerEmailStatus,
      });
      await sendMail({
        to: adminEmail as string,
        subject,
        html,
        text,
        replyTo: payload.email || undefined,
      });
      adminEmailOk = true;
    } catch (err) {
      console.warn(
        "[Clean24 Lead] Admin notification email failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  // A paid Umzugsreinigung lead must not disappear silently. If Clean24 OS is
  // configured but intake fails, the admin email is the emergency fallback.
  if (intakeConfigured && !intakeOk && !adminEmailOk) {
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
    lead_id: clean24OsLeadId,
    estimated_price_min: payload.estimated_price_min,
    estimated_price_max: payload.estimated_price_max,
  });
}
