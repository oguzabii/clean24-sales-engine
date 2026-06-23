/**
 * Email content builders (HTML + plain text).
 *
 * Pure functions — no SMTP / IO here. Each builder returns `{ subject, html,
 * text }` which is handed to `sendMail` in `lib/mail/smtp.ts`. All user-provided
 * values are HTML-escaped before being placed in markup.
 */
import { COMPANY, ADDONS_BY_KEY, APARTMENT_SIZE_LABELS } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
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
    <div style="color:#93c5fd;font-size:12px;margin-top:2px;">Umzugsreinigung mit Abgabegarantie</div>
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

  const sizeLabel =
    APARTMENT_SIZE_LABELS[payload.apartment_size] ?? payload.apartment_size;

  const addonLabels = payload.addons
    .filter((key) => key !== "express")
    .map((key) => ADDONS_BY_KEY[key]?.label ?? key);

  const address = payload.address;

  // [label, value] rows; null/empty values are skipped.
  const rows: [string, string | null | undefined][] = [
    ["Name", payload.customer_name],
    ["E-Mail", payload.email],
    ["Telefon", payload.phone],
    ["Ort", payload.city],
    ["PLZ", payload.zip],
    ["Adresse", address],
    ["Wohnungsgrösse", sizeLabel],
    ["Fläche (m²)", payload.square_meters],
    ["Anzahl Fenster", payload.windows_count],
    ["Reinigungsdatum", formatDate(payload.cleaning_date)],
    ["Abgabetermin", formatDate(payload.handover_date)],
    ["Zusatzleistungen", addonLabels.length ? addonLabels.join(", ") : "–"],
    ["Express", payload.express ? "Ja (+15%)" : "Nein"],
    ["Bemerkungen", payload.notes],
    [
      "Richtpreis",
      `CHF ${payload.estimated_price_min} – CHF ${payload.estimated_price_max}`,
    ],
    ["Quelle", payload.source],
    ["Seite", payload.page_path],
    ["Eingegangen", formatDateTime(payload.created_at)],
  ];

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
      Über das Website-Formular ist eine neue Umzugsreinigungs-Anfrage eingegangen.
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
      previewText: `Neue Anfrage von ${payload.customer_name} (${sizeLabel})`,
      heading: "Neue Website-Anfrage",
      bodyHtml,
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
  const whatsappUrl = buildWhatsAppUrl();

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
        Oder direkt per
        <a href="${whatsappUrl}" style="color:#2563eb;text-decoration:none;">WhatsApp</a>
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
    `WhatsApp: ${whatsappUrl}`,
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
  const subject = "Ihre Anfrage bei Clean24 – Richtpreis erhalten";

  const sizeLabel =
    APARTMENT_SIZE_LABELS[payload.apartment_size] ?? payload.apartment_size;
  const addonLabels = payload.addons
    .filter((key) => key !== "express")
    .map((key) => ADDONS_BY_KEY[key]?.label ?? key);

  const greeting = payload.customer_name
    ? `Guten Tag ${payload.customer_name},`
    : "Guten Tag,";
  const priceText = `CHF ${payload.estimated_price_min} – CHF ${payload.estimated_price_max}`;
  const whatsappUrl = buildWhatsAppUrl(
    "Guten Tag, ich sende Ihnen gerne Fotos meiner Wohnung für die Umzugsreinigung."
  );

  const rows: [string, string | null | undefined][] = [
    ["Wohnung / Zimmer", sizeLabel],
    ["Adresse", payload.address],
    ["Ort / PLZ", [payload.zip, payload.city].filter(Boolean).join(" ")],
    ["Reinigungsdatum", formatDate(payload.cleaning_date)],
    ["Abgabetermin", formatDate(payload.handover_date)],
    ["Zusatzleistungen", addonLabels.length ? addonLabels.join(", ") : null],
    ["Express", payload.express ? "Ja (+15%)" : null],
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
      <div style="font-size:22px;font-weight:700;color:#0f172a;margin-top:4px;">${escapeHtml(
        priceText
      )}</div>
    </div>
    <p style="margin:0 0 18px;color:#475569;font-size:13px;line-height:1.6;">
      Der Richtpreis ist unverbindlich. Nach Prüfung Ihrer Angaben erhalten Sie eine klare
      Rückmeldung mit Fixpreis und Terminvorschlag.
    </p>
    <div style="padding:18px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;">
      <p style="margin:0 0 8px;color:#166534;font-size:14px;font-weight:600;">Schneller zum Fixpreis</p>
      <p style="margin:0 0 14px;color:#374151;font-size:13px;">
        Für eine schnellere Prüfung können Sie uns 3–5 Fotos der Wohnung per WhatsApp senden.
      </p>
      <a href="${whatsappUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:11px 22px;border-radius:10px;">
        Fotos per WhatsApp senden
      </a>
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
    "",
    "Der Richtpreis ist unverbindlich. Nach Prüfung Ihrer Angaben erhalten Sie eine",
    "klare Rückmeldung mit Fixpreis und Terminvorschlag.",
    "",
    "Für eine schnellere Prüfung können Sie uns 3-5 Fotos der Wohnung per WhatsApp senden:",
    whatsappUrl,
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
