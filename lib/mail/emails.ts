/**
 * Email content builders (HTML + plain text).
 *
 * Pure functions — no SMTP / IO here. Each builder returns `{ subject, html,
 * text }` which is handed to `sendMail` in `lib/mail/smtp.ts`. All user-provided
 * values are HTML-escaped before being placed in markup.
 */
import {
  COMPANY,
  ADDONS_BY_KEY,
  APARTMENT_SIZE_LABELS,
} from "@/lib/constants";
import { OBJECT_TYPE_LABELS, PRICING_MODE_LABELS } from "@/lib/service-categories";
import { CHECKLIST_SECTIONS, CHECKLIST_PDF_FILENAME } from "./checklist-data";
import type { LeadPayload } from "@/lib/lead-payload";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/** Delivery status of the outbound Lead Autopilot webhook (for the admin email). */
export type WebhookDeliveryStatus = "delivered" | "failed" | "not_configured";

/** Delivery status of the customer confirmation email (for the admin email). */
export type CustomerEmailDeliveryStatus =
  | "sent"
  | "failed"
  | "not_configured"
  | "no_email";

function webhookStatusLabel(status: WebhookDeliveryStatus): string {
  switch (status) {
    case "delivered":
      return "erfolgreich übermittelt";
    case "failed":
      return "Fehler beim Senden";
    case "not_configured":
      return "nicht konfiguriert";
  }
}

function customerEmailStatusLabel(status: CustomerEmailDeliveryStatus): string {
  switch (status) {
    case "sent":
      return "gesendet";
    case "failed":
      return "Fehler beim Senden";
    case "not_configured":
      return "nicht konfiguriert";
    case "no_email":
      return "keine E-Mail-Adresse";
  }
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${COMPANY.website}`;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Format a "YYYY-MM-DD" input value as "DD.MM.YYYY" without timezone drift. */
function formatDate(value?: string): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const [, y, m, d] = match;
  return `${d}.${m}.${y}`;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("de-CH", { timeZone: "Europe/Zurich" });
  } catch {
    return iso;
  }
}

/**
 * Abgabezeit row value. Only rendered when an Abgabetermin exists; a missing
 * time then reads "Wird noch vereinbart". Without a date the row is skipped.
 */
function formatHandoverTime(payload: LeadPayload): string | null {
  if (!payload.handover_date) return null;
  const time = (payload.handover_time ?? "").trim();
  return time ? `${time} Uhr` : "Wird noch vereinbart";
}

/** Objektart row for customer-facing email summaries. */
function propertyTypeLabel(payload: LeadPayload): string | null {
  if (payload.property_type === "haus") return "Haus";
  if (payload.property_type === "wohnung") return "Wohnung";
  return null;
}

/** Explicit Ja/Nein — the field is boolean and defaults to true (Ja). */
function guaranteeLabel(payload: LeadPayload): string | null {
  if (payload.handover_guarantee_requested == null) return null;
  return payload.handover_guarantee_requested ? "Ja" : "Nein";
}

const RECURRENCE_LABELS: Record<string, string> = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
  other: "Andere",
  // Category-flow inquiry options (non-move-out).
  once: "Einmalig",
  by_agreement: "Nach Vereinbarung",
};

/** Manual-review inquiry (every category except move_out_cleaning)? */
function isManualReview(payload: LeadPayload): boolean {
  return payload.pricing_mode === "manual_review";
}

/** Human-readable Objektart for non-move-out inquiries. */
function objectTypeLabel(payload: LeadPayload): string | null {
  if (!payload.object_type) return null;
  return OBJECT_TYPE_LABELS[payload.object_type] ?? payload.object_type;
}

const DIRTINESS_LABELS: Record<string, string> = {
  low: "Wenig schmutzig",
  medium: "Mittel schmutzig",
  high: "Sehr schmutzig",
};

function mappedLabel(
  value: string | undefined,
  labels: Record<string, string>
): string | null {
  if (!value) return null;
  return labels[value] ?? value;
}

/**
 * Wiederholung row value. Non-move-out inquiries carry a human-readable rhythm
 * summary ("2x pro Woche", "Nach Vereinbarung") — prefer it; otherwise fall
 * back to the mapped recurrence code.
 */
function recurrenceLabel(payload: LeadPayload): string | null {
  const summary = payload.recurrence_summary?.trim();
  if (summary) return summary;
  return mappedLabel(payload.recurrence, RECURRENCE_LABELS);
}

/**
 * Safe attachment summary — count only. Storage paths or links to the
 * uploaded files never appear in any email.
 */
function attachmentsCountLabel(payload: LeadPayload): string | null {
  const count = payload.attachments?.length ?? 0;
  return count > 0 ? `${count} Datei(en) hochgeladen` : null;
}

/** Discount info for the emails — null when no valid Rabattcode was applied. */
function discountSummary(
  payload: LeadPayload
): { code: string; label: string; original: string | null } | null {
  if (
    !payload.discount_code ||
    (payload.discount_type !== "percent" && payload.discount_type !== "fixed_chf") ||
    payload.discount_value == null
  ) {
    return null;
  }
  const label =
    payload.discount_type === "percent"
      ? `${payload.discount_value}%`
      : `CHF ${payload.discount_value}`;
  const original =
    payload.price_min_original != null && payload.price_max_original != null
      ? `CHF ${payload.price_min_original} – CHF ${payload.price_max_original}`
      : null;
  return { code: payload.discount_code, label, original };
}

function contactBlockHtml(): string {
  return `
    <div style="font-weight:600;color:#374151;">${escapeHtml(COMPANY.name)}</div>
    <div>${escapeHtml(COMPANY.address)}, ${escapeHtml(COMPANY.city)}</div>
    <div>
      <a href="mailto:${COMPANY.email}" style="color:#2563eb;text-decoration:none;">${escapeHtml(
        COMPANY.email
      )}</a>
      &nbsp;·&nbsp;
      <a href="tel:${COMPANY.phone.replace(/\s/g, "")}" style="color:#2563eb;text-decoration:none;">${escapeHtml(
        COMPANY.phoneDisplay
      )}</a>
    </div>`;
}

function contactBlockText(): string {
  return [
    COMPANY.name,
    `${COMPANY.address}, ${COMPANY.city}`,
    COMPANY.email,
    COMPANY.phoneDisplay,
  ].join("\n");
}

function wrapHtml(opts: {
  previewText: string;
  heading: string;
  bodyHtml: string;
  /** Header tagline — default keeps the Umzugsreinigung branding. */
  tagline?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(opts.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;line-height:1.5;">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    opts.previewText
  )}</span>
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
  <div style="background:#0f172a;border-radius:16px 16px 0 0;padding:24px 28px;">
    <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.01em;">${escapeHtml(
      COMPANY.name
    )}</div>
    <div style="color:#93c5fd;font-size:12px;margin-top:2px;">${escapeHtml(
      opts.tagline ?? "Umzugsreinigung mit Abgabegarantie"
    )}</div>
  </div>
  <div style="background:#ffffff;padding:28px;">
    <h1 style="margin:0 0 18px;font-size:20px;font-weight:700;color:#0f172a;letter-spacing:-0.01em;">${escapeHtml(
      opts.heading
    )}</h1>
    ${opts.bodyHtml}
  </div>
  <div style="background:#ffffff;border-radius:0 0 16px 16px;border-top:1px solid #e5e7eb;padding:20px 28px;color:#6b7280;font-size:12px;">
    ${contactBlockHtml()}
  </div>
</div>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* 1. Admin notification for a website lead                           */
/* ------------------------------------------------------------------ */

export function buildLeadNotificationEmail(
  payload: LeadPayload,
  meta?: {
    webhookStatus: WebhookDeliveryStatus;
    customerEmailStatus?: CustomerEmailDeliveryStatus;
  }
): EmailContent {
  const subject = "Neue Anfrage über clean-24.ch";
  const manualReview = isManualReview(payload);

  const sizeLabel = payload.apartment_size
    ? APARTMENT_SIZE_LABELS[payload.apartment_size] ?? payload.apartment_size
    : null;

  const addonLabels = payload.addons
    .filter((key) => key !== "express")
    .map((key) => ADDONS_BY_KEY[key]?.label ?? key);

  const address = payload.address;

  // [label, value] rows; null/empty values are skipped. Move-out-only rows
  // (Zusatzleistungen, Express, Richtpreis, Abgabe-Felder) never render for
  // manual-review inquiries.
  const rows: [string, string | null | undefined][] = [
    ["Kategorie", payload.service_category_label],
    ["Preis-Modus", PRICING_MODE_LABELS[payload.pricing_mode]],
    ["Name", payload.customer_name],
    ["E-Mail", payload.email],
    ["Telefon", payload.phone],
    ["Ort", payload.city],
    ["PLZ", payload.zip],
    ["Adresse", address],
    ["Wohnungsgrösse", sizeLabel],
    ["Objektart", manualReview ? objectTypeLabel(payload) : propertyTypeLabel(payload)],
    [manualReview ? "Fläche (m²)" : "Bodenfläche (m²)", payload.floor_area_m2 ?? payload.square_meters],
    ["Anzahl Fenster", payload.windows_count],
    manualReview
      ? ["Gewünschter Termin", formatDate(payload.preferred_date ?? payload.cleaning_date)]
      : ["Reinigungsdatum", formatDate(payload.cleaning_date)],
    ["Abgabetermin", formatDate(payload.handover_date)],
    ["Abgabezeit", formatHandoverTime(payload)],
    ["Abgabegarantie gewünscht", guaranteeLabel(payload)],
    ["Wiederholung", recurrenceLabel(payload)],
    ["Verschmutzungsgrad", mappedLabel(payload.dirtiness_level, DIRTINESS_LABELS)],
    ["Zusatzleistungen", manualReview ? null : addonLabels.length ? addonLabels.join(", ") : "–"],
    ["Express", manualReview ? null : payload.express ? "Ja (+15%)" : "Nein"],
    [manualReview ? "Beschreibung / Bemerkungen" : "Bemerkungen", payload.notes],
    ["Fotos", attachmentsCountLabel(payload)],
    [
      "Richtpreis",
      payload.estimated_price_min != null && payload.estimated_price_max != null
        ? `CHF ${payload.estimated_price_min} – CHF ${payload.estimated_price_max}`
        : null,
    ],
    ["Quelle", payload.source],
    ["Seite", payload.page_path],
    ["Eingegangen", formatDateTime(payload.created_at)],
  ];

  const discount = discountSummary(payload);
  if (discount) {
    rows.push(["Rabattcode", `${discount.code} (−${discount.label})`]);
    if (discount.original) rows.push(["Richtpreis ohne Rabatt", discount.original]);
  }

  // Delivery status of the outbound channels (only when the route passes it).
  if (meta) {
    rows.push(["Lead Autopilot", webhookStatusLabel(meta.webhookStatus)]);
    if (meta.customerEmailStatus) {
      rows.push([
        "Kundenbestätigung",
        customerEmailStatusLabel(meta.customerEmailStatus),
      ]);
    }
  }

  const presentRows = rows.filter(
    (r): r is [string, string] => r[1] != null && String(r[1]).trim() !== ""
  );

  const rowsHtml = presentRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#6b7280;font-size:13px;vertical-align:top;white-space:nowrap;">${escapeHtml(
          label
        )}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(
          String(value)
        )}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      ${
        manualReview
          ? `Über das Website-Formular ist eine neue Anfrage eingegangen (Kategorie: ${escapeHtml(
              payload.service_category_label
            )}).`
          : "Über das Website-Formular ist eine neue Umzugsreinigungs-Anfrage eingegangen."
      }
    </p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:8px;overflow:hidden;">
      <tbody>${rowsHtml}</tbody>
    </table>
    <p style="margin:18px 0 0;color:#6b7280;font-size:12px;">
      Antworten auf diese E-Mail gehen direkt an die Kundin / den Kunden${
        payload.email ? ` (${escapeHtml(payload.email)})` : ""
      }.
    </p>`;

  const text = [
    "Neue Anfrage über clean-24.ch",
    "",
    ...presentRows.map(([label, value]) => `${label}: ${value}`),
  ].join("\n");

  return {
    subject,
    html: wrapHtml({
      previewText: `Neue Anfrage von ${payload.customer_name} (${
        manualReview ? payload.service_category_label : sizeLabel ?? "–"
      })`,
      heading: "Neue Website-Anfrage",
      bodyHtml,
      tagline: manualReview ? "Ihr Reinigungsprofi" : undefined,
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 2. Checklist email to the customer                                 */
/* ------------------------------------------------------------------ */

export function buildChecklistEmail(): EmailContent {
  const subject = "Ihre Wohnungsabgabe-Checkliste von Clean24";
  const offerUrl = `${SITE_URL}/#offer`;

  const sectionsHtml = CHECKLIST_SECTIONS.map(
    (section) => `
    <div style="margin:0 0 20px;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 8px;">${escapeHtml(
        section.title
      )}</div>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          ${section.items
            .map(
              (item) => `
            <tr>
              <td style="padding:4px 8px 4px 0;vertical-align:top;color:#2563eb;font-size:14px;">☐</td>
              <td style="padding:4px 0;color:#374151;font-size:14px;">${escapeHtml(
                item
              )}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>`
  ).join("");

  const bodyHtml = `
    <p style="margin:0 0 16px;color:#374151;font-size:14px;">
      Guten Tag,<br /><br />
      vielen Dank für Ihr Interesse. Mit dieser Checkliste gehen Sie Ihre Wohnungsabgabe
      strukturiert an – Punkt für Punkt, so wie es Verwaltungen bei der Übergabe prüfen.
    </p>
    <p style="margin:0 0 16px;color:#475569;font-size:13px;">
      Die vollständige Checkliste ist dieser E-Mail auch als PDF angehängt
      (<strong>${escapeHtml(CHECKLIST_PDF_FILENAME)}</strong>) – zum Ausdrucken und Abhaken.
    </p>
    ${sectionsHtml}
    <div style="margin:24px 0 8px;padding:20px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;text-align:center;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin:0 0 6px;">Lieber den Profis überlassen?</div>
      <p style="margin:0 0 14px;color:#475569;font-size:13px;">
        Clean24 übernimmt Ihre Umzugsreinigung komplett – inkl. Abgabegarantie und Begleitung
        beim Übergabetermin.
      </p>
      <a href="${offerUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;">
        Kostenlose Offerte anfordern
      </a>
      <div style="margin-top:12px;font-size:12px;color:#64748b;">
        Oder telefonisch unter
        <a href="tel:${COMPANY.phone.replace(/\s/g, "")}" style="color:#2563eb;text-decoration:none;">044 516 19 23</a>
        · per E-Mail an
        <a href="mailto:${COMPANY.email}" style="color:#2563eb;text-decoration:none;">${escapeHtml(COMPANY.email)}</a>
      </div>
    </div>`;

  const text = [
    "Ihre Wohnungsabgabe-Checkliste von Clean24",
    "",
    "Guten Tag,",
    "",
    "vielen Dank für Ihr Interesse. Mit dieser Checkliste gehen Sie Ihre",
    "Wohnungsabgabe strukturiert an – so wie es Verwaltungen bei der Übergabe prüfen.",
    "",
    `Die vollständige Checkliste ist auch als PDF angehängt (${CHECKLIST_PDF_FILENAME}).`,
    "",
    ...CHECKLIST_SECTIONS.flatMap((section) => [
      `${section.title.toUpperCase()}`,
      ...section.items.map((item) => `  [ ] ${item}`),
      "",
    ]),
    "Lieber den Profis überlassen? Clean24 übernimmt Ihre Umzugsreinigung komplett",
    "– inkl. Abgabegarantie und Begleitung beim Übergabetermin.",
    `Kostenlose Offerte: ${offerUrl}`,
    `Telefon: 044 516 19 23 · E-Mail: ${COMPANY.email}`,
    "",
    contactBlockText(),
  ].join("\n");

  return {
    subject,
    html: wrapHtml({
      previewText:
        "Ihre vollständige Checkliste für eine reibungslose Wohnungsabgabe.",
      heading: "Ihre Wohnungsabgabe-Checkliste",
      bodyHtml,
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 3. Customer confirmation email (after main form submission)        */
/* ------------------------------------------------------------------ */

export function buildCustomerConfirmationEmail(payload: LeadPayload): EmailContent {
  // Manual-review categories get their own neutral confirmation — no
  // Richtpreis, no Umzugsreinigung/Abgabegarantie wording.
  if (isManualReview(payload)) {
    return buildManualReviewConfirmationEmail(payload);
  }

  const subject = "Ihre Anfrage bei Clean24 – Richtpreis erhalten";

  const sizeLabel = payload.apartment_size
    ? APARTMENT_SIZE_LABELS[payload.apartment_size] ?? payload.apartment_size
    : null;
  const addonLabels = payload.addons
    .filter((key) => key !== "express")
    .map((key) => ADDONS_BY_KEY[key]?.label ?? key);

  const greeting = payload.customer_name
    ? `Guten Tag ${payload.customer_name},`
    : "Guten Tag,";
  const priceText = `CHF ${payload.estimated_price_min ?? 0} – CHF ${payload.estimated_price_max ?? 0}`;
  const discount = discountSummary(payload);

  const rows: [string, string | null | undefined][] = [
    ["Kategorie", payload.service_category_label],
    ["Wohnung / Zimmer", sizeLabel],
    ["Objektart", propertyTypeLabel(payload)],
    ["Adresse", payload.address],
    ["Ort / PLZ", [payload.zip, payload.city].filter(Boolean).join(" ")],
    ["Bodenfläche (m²)", payload.floor_area_m2 ?? payload.square_meters],
    ["Reinigungsdatum", formatDate(payload.cleaning_date)],
    ["Abgabetermin", formatDate(payload.handover_date)],
    ["Abgabezeit", formatHandoverTime(payload)],
    ["Abgabegarantie gewünscht", guaranteeLabel(payload)],
    ["Wiederholung", recurrenceLabel(payload)],
    ["Verschmutzungsgrad", mappedLabel(payload.dirtiness_level, DIRTINESS_LABELS)],
    ["Zusatzleistungen", addonLabels.length ? addonLabels.join(", ") : null],
    ["Express", payload.express ? "Ja (+15%)" : null],
    ["Fotos", attachmentsCountLabel(payload)],
    ["Rabattcode", discount ? `${discount.code} (−${discount.label})` : null],
  ];
  const presentRows = rows.filter(
    (r): r is [string, string] => r[1] != null && String(r[1]).trim() !== ""
  );
  const rowsHtml = presentRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#6b7280;font-size:13px;white-space:nowrap;">${escapeHtml(
          label
        )}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(
          String(value)
        )}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#374151;font-size:14px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">
      vielen Dank für Ihre Anfrage über clean-24.ch. Wir haben Ihre Angaben erhalten und
      melden uns nach kurzer Prüfung persönlich bei Ihnen.
    </p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:8px;overflow:hidden;">
      <tbody>${rowsHtml}</tbody>
    </table>
    <div style="margin:18px 0;padding:18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;text-align:center;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#2563eb;font-weight:600;">Ihr Richtpreis</div>
      ${
        discount && discount.original
          ? `<div style="font-size:13px;color:#94a3b8;text-decoration:line-through;margin-top:2px;">${escapeHtml(
              discount.original
            )}</div>`
          : ""
      }
      <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(
        priceText
      )}</div>
      ${
        discount
          ? `<div style="margin-top:6px;font-size:12px;font-weight:600;color:#16a34a;">Rabatt ${escapeHtml(
              discount.code
            )} (−${escapeHtml(discount.label)}) angewendet</div>`
          : ""
      }
    </div>
    <p style="margin:0 0 18px;color:#475569;font-size:13px;line-height:1.6;">
      Der Richtpreis ist unverbindlich. Nach Prüfung Ihrer Angaben erhalten Sie eine klare
      Rückmeldung mit Fixpreis und Terminvorschlag.
    </p>
    <div style="padding:18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;">
      <p style="margin:0 0 8px;color:#1e40af;font-size:14px;font-weight:600;">Fragen zu Ihrer Anfrage?</p>
      <p style="margin:0;color:#374151;font-size:13px;">
        Bei Fragen erreichen Sie uns telefonisch unter
        <a href="tel:${COMPANY.phone.replace(/\s/g, "")}" style="color:#2563eb;text-decoration:none;font-weight:600;">044 516 19 23</a>
        oder per E-Mail an
        <a href="mailto:${COMPANY.email}" style="color:#2563eb;text-decoration:none;font-weight:600;">${escapeHtml(COMPANY.email)}</a>.
      </p>
    </div>`;

  const text = [
    "Ihre Anfrage bei Clean24 – Richtpreis erhalten",
    "",
    greeting,
    "",
    "vielen Dank für Ihre Anfrage über clean-24.ch. Wir haben Ihre Angaben erhalten",
    "und melden uns nach kurzer Prüfung persönlich bei Ihnen.",
    "",
    ...presentRows.map(([label, value]) => `${label}: ${value}`),
    "",
    `Ihr Richtpreis: ${priceText}`,
    ...(discount
      ? [
          ...(discount.original ? [`(statt ${discount.original})`] : []),
          `Rabatt ${discount.code} (−${discount.label}) angewendet.`,
        ]
      : []),
    "",
    "Der Richtpreis ist unverbindlich. Nach Prüfung Ihrer Angaben erhalten Sie eine",
    "klare Rückmeldung mit Fixpreis und Terminvorschlag.",
    "",
    "Bei Fragen erreichen Sie uns telefonisch unter 044 516 19 23",
    `oder per E-Mail an ${COMPANY.email}.`,
    "",
    contactBlockText(),
  ].join("\n");

  return {
    subject,
    html: wrapHtml({
      previewText: `Ihr Richtpreis: ${priceText} – wir prüfen Ihre Angaben und melden uns mit Fixpreis und Termin.`,
      heading: "Ihre Anfrage ist eingegangen",
      bodyHtml,
    }),
    text,
  };
}

/**
 * Customer confirmation for manual-review categories (everything except
 * move_out_cleaning): neutral wording, no Richtpreis, no Abgabegarantie.
 */
function buildManualReviewConfirmationEmail(payload: LeadPayload): EmailContent {
  const subject = "Ihre Anfrage bei Clean24 – Eingang bestätigt";
  const greeting = payload.customer_name
    ? `Guten Tag ${payload.customer_name},`
    : "Guten Tag,";

  const rows: [string, string | null | undefined][] = [
    ["Kategorie", payload.service_category_label],
    ["Objektart", objectTypeLabel(payload)],
    ["Adresse", payload.address],
    ["Ort / PLZ", [payload.zip, payload.city].filter(Boolean).join(" ")],
    ["Fläche (m²)", payload.floor_area_m2 ?? payload.square_meters],
    ["Gewünschter Termin", formatDate(payload.preferred_date ?? payload.cleaning_date)],
    ["Wiederholung", recurrenceLabel(payload)],
    ["Beschreibung / Bemerkungen", payload.notes],
    ["Fotos", attachmentsCountLabel(payload)],
  ];
  const presentRows = rows.filter(
    (r): r is [string, string] => r[1] != null && String(r[1]).trim() !== ""
  );
  const rowsHtml = presentRows
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#6b7280;font-size:13px;white-space:nowrap;">${escapeHtml(
          label
        )}</td>
        <td style="padding:7px 12px;border-bottom:1px solid #f1f5f9;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(
          String(value)
        )}</td>
      </tr>`
    )
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 14px;color:#374151;font-size:14px;">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 18px;color:#374151;font-size:14px;">
      vielen Dank für Ihre Anfrage über clean-24.ch. Wir prüfen die Angaben und melden uns
      mit einer passenden Offerte.
    </p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:8px;overflow:hidden;">
      <tbody>${rowsHtml}</tbody>
    </table>
    <div style="margin:18px 0;padding:18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;text-align:center;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#2563eb;font-weight:600;">Individuelle Prüfung</div>
      <p style="margin:6px 0 0;color:#374151;font-size:14px;">
        Für diese Kategorie prüfen wir Ihre Anfrage individuell und melden uns mit einer
        passenden Offerte.
      </p>
    </div>
    <div style="padding:18px;background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;">
      <p style="margin:0 0 8px;color:#1e40af;font-size:14px;font-weight:600;">Fragen zu Ihrer Anfrage?</p>
      <p style="margin:0;color:#374151;font-size:13px;">
        Bei Fragen erreichen Sie uns telefonisch unter
        <a href="tel:${COMPANY.phone.replace(/\s/g, "")}" style="color:#2563eb;text-decoration:none;font-weight:600;">044 516 19 23</a>
        oder per E-Mail an
        <a href="mailto:${COMPANY.email}" style="color:#2563eb;text-decoration:none;font-weight:600;">${escapeHtml(COMPANY.email)}</a>.
      </p>
    </div>`;

  const text = [
    "Ihre Anfrage bei Clean24 – Eingang bestätigt",
    "",
    greeting,
    "",
    "vielen Dank für Ihre Anfrage über clean-24.ch. Wir prüfen die Angaben und melden",
    "uns mit einer passenden Offerte.",
    "",
    ...presentRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Bei Fragen erreichen Sie uns telefonisch unter 044 516 19 23",
    `oder per E-Mail an ${COMPANY.email}.`,
    "",
    contactBlockText(),
  ].join("\n");

  return {
    subject,
    html: wrapHtml({
      previewText:
        "Wir haben Ihre Anfrage erhalten und melden uns mit einer passenden Offerte.",
      heading: "Ihre Anfrage ist eingegangen",
      bodyHtml,
      tagline: "Ihr Reinigungsprofi",
    }),
    text,
  };
}

/* ------------------------------------------------------------------ */
/* 4. Optional internal notification for a checklist request          */
/* ------------------------------------------------------------------ */

export function buildChecklistAdminNotification(
  email: string,
  pagePath?: string
): EmailContent {
  const subject = "Neue Checkliste-Anforderung über clean-24.ch";

  const bodyHtml = `
    <p style="margin:0 0 12px;color:#374151;font-size:14px;">
      Es wurde die Wohnungsabgabe-Checkliste angefordert.
    </p>
    <table style="width:100%;border-collapse:collapse;border:1px solid #f1f5f9;border-radius:8px;overflow:hidden;">
      <tbody>
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#6b7280;font-size:13px;">E-Mail</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(
            email
          )}</td>
        </tr>
        ${
          pagePath
            ? `<tr>
          <td style="padding:8px 12px;color:#6b7280;font-size:13px;">Seite</td>
          <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:500;">${escapeHtml(
            pagePath
          )}</td>
        </tr>`
            : ""
        }
      </tbody>
    </table>`;

  const text = [
    "Neue Checkliste-Anforderung über clean-24.ch",
    "",
    `E-Mail: ${email}`,
    ...(pagePath ? [`Seite: ${pagePath}`] : []),
  ].join("\n");

  return {
    subject,
    html: wrapHtml({
      previewText: `Checkliste angefordert: ${email}`,
      heading: "Checkliste angefordert",
      bodyHtml,
    }),
    text,
  };
}
