/**
 * Presentation-only copy for the quotation experience.
 *
 * Keyed by the EXISTING `SERVICE_CATEGORIES` values (lib/service-categories.ts)
 * and by wizard step. Nothing here influences category state, routing,
 * pricing or the payload — adding a key has no effect on business logic.
 */

/* ---- Category-specific context shown once a category is chosen ---- */

export interface CategoryIntro {
  headline: string;
  sub: string;
}

export const CATEGORY_INTRO: Record<string, CategoryIntro> = {
  move_out_cleaning: {
    headline: "Wohnung abgeben? Wir kümmern uns um die Reinigung.",
    sub: "Mit Abgabegarantie · Richtpreis direkt berechnen",
  },
  private_cleaning: {
    headline: "Regelmässige Reinigung für Ihr Zuhause.",
    sub: "Wir prüfen Ihre Angaben und melden uns mit einer passenden Offerte.",
  },
  office_cleaning: {
    headline: "Saubere Räume für Ihr Unternehmen.",
    sub: "Büro, Praxis oder Ladenfläche – wir prüfen Ihre Anfrage individuell.",
  },
  construction_cleaning: {
    headline: "Nach dem Bau wieder bezugsbereit.",
    sub: "Umbau, Neubau oder Renovation – wir prüfen Ihre Anfrage individuell.",
  },
  window_cleaning: {
    headline: "Klare Sicht, sauber gerahmt.",
    sub: "Fenster, Rahmen und Storen – wir prüfen Ihre Anfrage individuell.",
  },
  deep_cleaning: {
    headline: "Wenn die normale Reinigung nicht mehr reicht.",
    sub: "Intensive Reinigung stark beanspruchter Bereiche – individuell geprüft.",
  },
  facility_staircase_cleaning: {
    headline: "Gepflegte Eingänge und Treppenhäuser.",
    sub: "Regelmässige Reinigung von Allgemeinflächen – individuell geprüft.",
  },
  clearance_disposal: {
    headline: "Räumen, abtransportieren, entsorgen.",
    sub: "Wir prüfen Umfang und Aufwand und melden uns mit einer Offerte.",
  },
  special_cleaning: {
    headline: "Spezielle Aufgaben klären wir vorab.",
    sub: "Wir prüfen Ihre Anfrage und melden uns für die weitere Abklärung.",
  },
  other_cleaning: {
    headline: "Erzählen Sie uns, worum es geht.",
    sub: "Wir prüfen Ihre Anfrage individuell und melden uns mit einer Offerte.",
  },
};

export const CATEGORY_INTRO_FALLBACK: CategoryIntro = {
  headline: "Ihre Anfrage.",
  sub: "Wir prüfen Ihre Angaben und melden uns mit einer passenden Offerte.",
};

export function introFor(category: string): CategoryIntro {
  return CATEGORY_INTRO[category] ?? CATEGORY_INTRO_FALLBACK;
}

/* ---- Left explanatory column, per wizard step ---- */

export interface SidebarBullet {
  icon: "check" | "clock" | "heart" | "lock" | "plus" | "eye" | "shield";
  title: string;
  body: string;
}

export interface SidebarCopy {
  heading: string;
  body: string;
  bullets: SidebarBullet[];
  script?: string;
}

export const SIDEBAR_COPY: Record<string, SidebarCopy> = {
  category: {
    heading: "Was möchten Sie reinigen lassen?",
    body: "Wählen Sie die passende Reinigung. Den Rest führen wir Schritt für Schritt mit Ihnen durch.",
    bullets: [
      {
        icon: "check",
        title: "Kostenlos und unverbindlich",
        body: "In wenigen Minuten zur Offerte",
      },
      { icon: "clock", title: "Schnell & einfach", body: "Online anfragen – wir kümmern uns" },
      {
        icon: "heart",
        title: "Professionell & zuverlässig",
        body: "Sauberkeit mit System.",
      },
    ],
    script: "Vielen Dank\nfür Ihr Vertrauen!",
  },
  size: {
    heading: "Erzählen Sie uns etwas über Ihr Objekt",
    body: "Geben Sie die wichtigsten Details an, damit wir den Preis für Ihre Umzugsreinigung verlässlich einschätzen können.",
    bullets: [
      { icon: "clock", title: "In wenigen Minuten", body: "Einfach und schnell zum Richtpreis." },
      { icon: "heart", title: "100% unverbindlich", body: "Sie gehen keine Verpflichtung ein." },
      { icon: "lock", title: "Ihre Daten sind sicher", body: "Wir behandeln Ihre Angaben vertraulich." },
    ],
    script: "Sauber geplant.\nStressfrei umziehen!",
  },
  addons: {
    heading: "Machen Sie Ihr Angebot noch individueller",
    body: "Wählen Sie hier optionale Zusatzleistungen aus, falls diese für Ihre Umzugsreinigung relevant sind. So erhalten Sie einen noch genaueren Richtpreis.",
    bullets: [
      { icon: "plus", title: "Optional und flexibel", body: "Wählen Sie nur, was Sie wirklich benötigen." },
      { icon: "eye", title: "Transparente Preise", body: "Alle Zusatzleistungen sind klar ausgewiesen." },
      {
        icon: "shield",
        title: "Genauerer Richtpreis",
        body: "Ihre Angaben helfen uns, den Preis noch präziser zu berechnen.",
      },
    ],
    script: "Sauber geplant.\nStressfrei umziehen!",
  },
};

/** Trust list shown in the right-hand summary panel. */
export const SUMMARY_TRUST = [
  "Abgabegarantie",
  "Richtpreis direkt",
  "Professionelles Team",
  "Schweizweit im Einsatz",
];

/** Trust list for manual-review categories — no Richtpreis promise. */
export const SUMMARY_TRUST_MANUAL = [
  "Individuelle Offerte",
  "Persönliche Prüfung",
  "Professionelles Team",
  "Schweizweit im Einsatz",
];

/** "Gut zu wissen" notes on the final step. */
export const GOOD_TO_KNOW: { icon: "note" | "chat" | "phone"; body: string }[] = [
  { icon: "note", body: "Ihre Anfrage ist kostenlos und unverbindlich." },
  { icon: "chat", body: "Wir prüfen Ihre Angaben und melden uns mit einer Rückmeldung." },
  { icon: "phone", body: "Bei Fragen sind wir jederzeit persönlich für Sie da." },
];
