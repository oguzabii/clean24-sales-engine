/**
 * Presentation-only copy for the quotation experience.
 *
 * Keyed by the EXISTING `SERVICE_CATEGORIES` values (lib/service-categories.ts).
 * This map only decides which headline is shown once a category has been
 * selected — it never influences category state, routing, pricing or the
 * payload. Adding a key here has no effect on business logic.
 */
export interface CategoryIntro {
  /** Editorial headline shown after the category is chosen. */
  headline: string;
  /** One quiet supporting line beneath it. */
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

/** Fallback keeps unknown/legacy categories rendering sensibly. */
export const CATEGORY_INTRO_FALLBACK: CategoryIntro = {
  headline: "Ihre Anfrage.",
  sub: "Wir prüfen Ihre Angaben und melden uns mit einer passenden Offerte.",
};

export function introFor(category: string): CategoryIntro {
  return CATEGORY_INTRO[category] ?? CATEGORY_INTRO_FALLBACK;
}
