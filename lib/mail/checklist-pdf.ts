/**
 * Server-side PDF generation for the Wohnungsabgabe-Checkliste.
 *
 * Uses `pdf-lib` (pure JS, embedded standard fonts) so it runs reliably in the
 * Node serverless runtime — no external font files, no fs reads, no browser.
 * Returns a Buffer that nodemailer attaches to the checklist email.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { COMPANY } from "@/lib/constants";
import { CHECKLIST_SECTIONS } from "./checklist-data";

// A4 in PostScript points.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 50;

const INK = rgb(0.06, 0.09, 0.16); // slate-900-ish
const GRAY = rgb(0.42, 0.45, 0.5);
const BRAND = rgb(0.15, 0.39, 0.92); // blue-600
const LINE = rgb(0.86, 0.88, 0.92);

/**
 * Helvetica (WinAnsi) cannot encode some Unicode punctuation. German umlauts
 * are fine; this just maps the few typographic characters we might emit to safe
 * equivalents so a stray glyph can never crash PDF generation.
 */
function safe(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/•/g, "-")
    .replace(/ /g, " ");
}

export async function generateChecklistPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle("Wohnungsabgabe-Checkliste");
  doc.setAuthor(COMPANY.name);
  doc.setSubject("Checkliste für die Wohnungsabgabe in der Schweiz");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_W - MARGIN * 2;
  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = PAGE_H - MARGIN;
  };
  const ensure = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  const wrap = (text: string, f: PDFFont, size: number, maxWidth: number): string[] => {
    const words = safe(text).split(/\s+/);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const test = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(test, size) > maxWidth && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [""];
  };

  const drawLine = (text: string, opts: { font: PDFFont; size: number; color: ReturnType<typeof rgb>; x?: number }) => {
    page.drawText(safe(text), {
      x: opts.x ?? MARGIN,
      y: y - opts.size,
      size: opts.size,
      font: opts.font,
      color: opts.color,
    });
    y -= opts.size + 5;
  };

  // ---- Header ---------------------------------------------------------------
  drawLine(COMPANY.name, { font: bold, size: 16, color: INK });
  y += 1;
  drawLine("Umzugsreinigung mit Abgabegarantie", { font, size: 10, color: BRAND });
  drawLine(
    `${COMPANY.address}, ${COMPANY.city}  ·  ${COMPANY.email}  ·  ${COMPANY.phoneDisplay}`,
    { font, size: 9, color: GRAY },
  );
  y -= 6;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 1, color: LINE });
  y -= 22;

  // ---- Title ----------------------------------------------------------------
  drawLine("Wohnungsabgabe-Checkliste", { font: bold, size: 20, color: INK });
  y -= 2;
  for (const ln of wrap(
    "Alle Punkte, die Verwaltungen bei der Übergabe prüfen — zum Ausdrucken und Abhaken.",
    font,
    10.5,
    contentWidth,
  )) {
    drawLine(ln, { font, size: 10.5, color: GRAY });
  }
  y -= 12;

  // ---- Sections -------------------------------------------------------------
  const itemSize = 10.5;
  const itemLineH = 15;
  const boxSize = 9;
  const textX = MARGIN + 16;
  const itemMaxWidth = PAGE_W - MARGIN - textX;

  CHECKLIST_SECTIONS.forEach((section, idx) => {
    ensure(40);
    y -= 4;
    drawLine(`${idx + 1}. ${section.title}`, { font: bold, size: 12.5, color: INK });
    y -= 2;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: LINE });
    y -= 10;

    for (const item of section.items) {
      const lines = wrap(item, font, itemSize, itemMaxWidth);
      ensure(lines.length * itemLineH + 2);
      // Checkbox aligned to the first line.
      page.drawRectangle({
        x: MARGIN,
        y: y - boxSize - 1,
        width: boxSize,
        height: boxSize,
        borderColor: BRAND,
        borderWidth: 1,
      });
      for (const ln of lines) {
        page.drawText(ln, {
          x: textX,
          y: y - itemSize,
          size: itemSize,
          font,
          color: rgb(0.22, 0.25, 0.32),
        });
        y -= itemLineH;
      }
      y -= 2;
    }
    y -= 8;
  });

  // ---- CTA ------------------------------------------------------------------
  ensure(70);
  y -= 4;
  page.drawRectangle({
    x: MARGIN,
    y: y - 56,
    width: contentWidth,
    height: 56,
    color: rgb(0.93, 0.96, 1),
    borderColor: rgb(0.86, 0.91, 0.99),
    borderWidth: 1,
  });
  page.drawText(safe("Umzugsreinigung mit Abgabegarantie anfragen"), {
    x: MARGIN + 14,
    y: y - 24,
    size: 13,
    font: bold,
    color: INK,
  });
  page.drawText(
    safe(`Kostenlose Offerte: ${COMPANY.website}  ·  Telefon: ${COMPANY.phoneDisplay}  ·  ${COMPANY.email}`),
    { x: MARGIN + 14, y: y - 42, size: 10, font, color: rgb(0.28, 0.34, 0.46) },
  );
  y -= 72;

  // ---- Footer contact -------------------------------------------------------
  ensure(60);
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: LINE });
  y -= 16;
  drawLine(COMPANY.name, { font: bold, size: 10, color: INK });
  drawLine(`${COMPANY.address}, ${COMPANY.city}`, { font, size: 9.5, color: GRAY });
  drawLine(`${COMPANY.email}  ·  ${COMPANY.phoneDisplay}`, { font, size: 9.5, color: GRAY });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
