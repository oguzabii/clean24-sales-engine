/**
 * Clean24 service categories — single source of truth for the category-based
 * inquiry flow. Only `move_out_cleaning` keeps the automatic Richtpreis range
 * (lib/pricing.ts); every other category is a manual-review inquiry without
 * any price calculation. Values are stable internal identifiers that travel
 * in the lead payload (`service_category`).
 */

export type PricingMode = "automatic_range" | "manual_review";

export interface ServiceCategory {
  value: string;
  label: string;
  description: string;
}

export const MOVE_OUT_CATEGORY = "move_out_cleaning";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    value: "move_out_cleaning",
    label: "Umzugsreinigung mit Abgabegarantie",
    description: "Endreinigung vor Wohnungsabgabe inkl. Abgabegarantie.",
  },
  {
    value: "private_cleaning",
    label: "Wiederkehrende Reinigung Privat",
    description: "Regelmässige oder einmalige Reinigung für private Haushalte.",
  },
  {
    value: "office_cleaning",
    label: "Büroreinigung / Gewerbereinigung",
    description: "Reinigung für Büros, Praxen, Läden und gewerbliche Flächen.",
  },
  {
    value: "construction_cleaning",
    label: "Baureinigung",
    description: "Reinigung nach Umbau, Neubau oder Renovation.",
  },
  {
    value: "window_cleaning",
    label: "Fensterreinigung",
    description: "Fenster, Rahmen, Storen und Glasflächen.",
  },
  {
    value: "deep_cleaning",
    label: "Grundreinigung",
    description: "Intensive Reinigung stark beanspruchter Bereiche.",
  },
  {
    value: "facility_staircase_cleaning",
    label: "Hauswartung / Treppenhausreinigung",
    description: "Regelmässige Reinigung von Treppenhaus und Allgemeinflächen.",
  },
  {
    value: "clearance_disposal",
    label: "Räumung / Entsorgung",
    description: "Räumung, Abtransport und Entsorgung nach Absprache.",
  },
  {
    value: "special_cleaning",
    label: "Spezialreinigung",
    description: "Spezielle Reinigungsarbeiten nach Besichtigung oder Abklärung.",
  },
  {
    value: "other_cleaning",
    label: "Andere Reinigung",
    description: "Wenn Ihre Anfrage nicht in eine Kategorie passt.",
  },
];

export const SERVICE_CATEGORY_BY_VALUE: Record<string, ServiceCategory> =
  Object.fromEntries(SERVICE_CATEGORIES.map((c) => [c.value, c]));

/** Unknown/missing category → move_out_cleaning (legacy payloads without a category). */
export function resolveServiceCategory(value: string | undefined | null): ServiceCategory {
  return SERVICE_CATEGORY_BY_VALUE[(value ?? "").trim()] ?? SERVICE_CATEGORY_BY_VALUE[MOVE_OUT_CATEGORY];
}

export function pricingModeFor(category: string): PricingMode {
  return category === MOVE_OUT_CATEGORY ? "automatic_range" : "manual_review";
}

export const PRICING_MODE_LABELS: Record<PricingMode, string> = {
  automatic_range: "Automatische Richtpreis-Spanne",
  manual_review: "Individuelle Prüfung",
};

/** Neutral notice shown instead of a CHF range for manual-review categories. */
export const MANUAL_REVIEW_NOTICE =
  "Für diese Kategorie prüfen wir Ihre Anfrage individuell und melden uns mit einer passenden Offerte.";

/* ---- Inquiry fields for non-move-out categories ---- */

export const OBJECT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "wohnung", label: "Wohnung" },
  { value: "haus", label: "Haus" },
  { value: "buero_gewerbe", label: "Büro / Gewerbe" },
  { value: "baustelle", label: "Baustelle" },
  { value: "treppenhaus_liegenschaft", label: "Treppenhaus / Liegenschaft" },
  { value: "andere", label: "Andere" },
];

export const OBJECT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  OBJECT_TYPE_OPTIONS.map((o) => [o.value, o.label]),
);

export const INQUIRY_RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "once", label: "Einmalig" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Alle 2 Wochen" },
  { value: "monthly", label: "Monatlich" },
  { value: "by_agreement", label: "Nach Vereinbarung" },
];

/**
 * Conditional "how many times" detail for a recurrence rhythm (non-move-out
 * inquiries only). Only weekly / biweekly / monthly offer a count select;
 * `once` and `by_agreement` never do. Manual-review inquiries capture the raw
 * rhythm as-is — these combinations are NOT normalized into another cadence.
 */
export interface RecurrenceCountConfig {
  /** Stored in the payload as `recurrence_unit`. */
  unit: string;
  /** Select label. */
  label: string;
  /** Count options offered: 1..max. */
  max: number;
  /** Human-readable option/summary, e.g. "2x pro Woche". */
  optionLabel: (count: number) => string;
}

export const RECURRENCE_COUNT_CONFIG: Record<string, RecurrenceCountConfig> = {
  weekly: {
    unit: "week",
    label: "Wie oft pro Woche?",
    max: 6,
    optionLabel: (n) => `${n}x pro Woche`,
  },
  biweekly: {
    unit: "two_weeks",
    label: "Wie oft alle 2 Wochen?",
    max: 6,
    optionLabel: (n) => `${n}x alle 2 Wochen`,
  },
  monthly: {
    unit: "month",
    label: "Wie oft pro Monat?",
    max: 8,
    optionLabel: (n) => `${n}x pro Monat`,
  },
};

/** Base summary for a recurrence value without a count (or before one is picked). */
const RECURRENCE_MAIN_LABEL: Record<string, string> = {
  once: "Einmalig",
  weekly: "Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "Monatlich",
  by_agreement: "Nach Vereinbarung",
};

/**
 * Human-readable summary of the selected rhythm for the lead payload
 * (`recurrence_summary`). With a count on weekly/biweekly/monthly it reads
 * e.g. "2x pro Woche"; otherwise the plain main label ("Einmalig",
 * "Nach Vereinbarung", …). Empty/unknown recurrence → undefined.
 */
export function buildRecurrenceSummary(
  recurrence: string | undefined | null,
  count?: number | null,
): string | undefined {
  const key = (recurrence ?? "").trim();
  if (!key) return undefined;
  const cfg = RECURRENCE_COUNT_CONFIG[key];
  if (cfg && typeof count === "number" && count >= 1) return cfg.optionLabel(count);
  return RECURRENCE_MAIN_LABEL[key];
}
