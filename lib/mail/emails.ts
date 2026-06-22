/**
 * Email content builders (HTML + plain text).
 *
 * Pure functions — no SMTP / IO here. Each builder returns `{ subject, html,
 * text }` which is handed to `sendMail` in `lib/mail/smtp.ts`. All user-provided
 * values are HTML-escaped before being placed in markup.
 */
import { COMPANY, ADDONS_BY_KEY, APARTMENT_SIZE_LABELS } from "@/lib/constants";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { LeadPayload } from "@/lib/lead-payload";

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
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

export function buildLeadNotificationEmail(payload: LeadPayload): EmailContent {
  const subject = "Neue Anfrage über clean-24.ch";

  const sizeLabel =
    APARTMENT_SIZE_LABELS[payload.apartment_size] ?? payload.apartment_size;

  const addonLabels = payload.addons
    .filter((key) => key !== "express")
    .map((key) => ADDONS_BY_KEY[key]?.label ?? key);

  const address = (payload as { address?: string }).address;

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

interface ChecklistSection {
  title: string;
  items: string[];
}

/** Wohnungsabgabe checklist content delivered to the customer by email. */
const CHECKLIST: ChecklistSection[] = [
  {
    title: "Küche / Backofen",
    items: [
      "Backofen innen inkl. Bleche und Roste entfettet",
      "Herd, Glaskeramik und Dampfabzug gereinigt",
      "Kühl- und Gefrierschrank abgetaut, innen und aussen ausgewischt",
      "Schränke innen und aussen, Griffe und Sockel gereinigt",
      "Spüle und Armatur entkalkt und poliert",
      "Wandplättchen und Spritzschutz entfettet",
    ],
  },
  {
    title: "Bad / WC",
    items: [
      "Dusche, Badewanne und Armaturen entkalkt",
      "WC innen und aussen gründlich gereinigt und desinfiziert",
      "Spiegel und Glasflächen streifenfrei geputzt",
      "Plättchen und Fugen gereinigt",
      "Lüftung / Ventilator entstaubt",
      "Abläufe frei und sauber",
    ],
  },
  {
    title: "Fenster / Rahmen / Storen",
    items: [
      "Fenster innen und aussen streifenfrei geputzt",
      "Rahmen und Falze ausgewischt",
      "Fenstersimse und -bretter gereinigt",
      "Rollläden, Storen und Lamellen abgestaubt und abgewischt",
    ],
  },
  {
    title: "Böden / Türen / Schalter",
    items: [
      "Alle Böden gesaugt und feucht aufgenommen",
      "Hartnäckige Flecken und Randzonen behandelt",
      "Türen, Zargen und Griffe abgewischt",
      "Lichtschalter und Steckdosen gereinigt",
      "Heizkörper inkl. Rippen entstaubt",
    ],
  },
  {
    title: "Balkon / Keller",
    items: [
      "Balkon / Terrasse gewischt, Geländer abgewischt",
      "Abläufe von Laub und Schmutz befreit",
      "Kellerabteil ausgeräumt und gekehrt",
      "Spinnweben in Ecken und Nebenräumen entfernt",
    ],
  },
  {
    title: "Vorbereitung vor der Abgabe",
    items: [
      "Persönliche Gegenstände vollständig entfernt",
      "Sämtliche Schlüssel bereitlegen (inkl. Briefkasten und Keller)",
      "Zählerstände (Strom, Wasser, ggf. Gas) notieren",
      "Übergabeprotokoll und Mietvertrag bereithalten",
      "Adressänderung bei Post und Ämtern einrichten",
      "Bohrlöcher gemäss Mietvertrag fachgerecht verschliessen",
    ],
  },
];

export function buildChecklistEmail(): EmailContent {
  const subject = "Ihre Wohnungsabgabe-Checkliste von Clean24";
  const offerUrl = `${SITE_URL}/#offer`;
  const whatsappUrl = buildWhatsAppUrl();

  const sectionsHtml = CHECKLIST.map(
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
    ...CHECKLIST.flatMap((section) => [
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
/* 3. Optional internal notification for a checklist request          */
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
