/**
 * Canonical Wohnungsabgabe checklist content.
 *
 * Single source of truth shared by the customer email body (`emails.ts`) and
 * the attached PDF (`checklist-pdf.ts`) so the two can never drift apart. Pure
 * data — no dependencies.
 */

export interface ChecklistSection {
  title: string;
  items: string[];
}

export const CHECKLIST_PDF_FILENAME = "Clean24_Wohnungsabgabe_Checkliste.pdf";

export const CHECKLIST_SECTIONS: ChecklistSection[] = [
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
  {
    title: "Küche & Backofen",
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
    title: "Bad & WC",
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
    title: "Fenster, Rahmen & Storen",
    items: [
      "Fenster innen und aussen streifenfrei geputzt",
      "Rahmen und Falze ausgewischt",
      "Fenstersimse und -bretter gereinigt",
      "Rollläden, Storen und Lamellen abgestaubt und abgewischt",
    ],
  },
  {
    title: "Böden, Türen & Schalter",
    items: [
      "Alle Böden gesaugt und feucht aufgenommen",
      "Hartnäckige Flecken und Randzonen behandelt",
      "Türen, Zargen und Griffe abgewischt",
      "Lichtschalter und Steckdosen gereinigt",
      "Heizkörper inkl. Rippen entstaubt",
    ],
  },
  {
    title: "Balkon & Keller",
    items: [
      "Balkon / Terrasse gewischt, Geländer abgewischt",
      "Abläufe von Laub und Schmutz befreit",
      "Kellerabteil ausgeräumt und gekehrt",
      "Spinnweben in Ecken und Nebenräumen entfernt",
    ],
  },
  {
    title: "Übergabetermin / Abgabe",
    items: [
      "Termin mit der Verwaltung frühzeitig vereinbaren",
      "Wohnung besenrein und vollständig geräumt übergeben",
      "Gemeinsamer Rundgang mit Abnahmeprotokoll",
      "Mängel mit Fotos dokumentieren und Fristen beachten",
      "Schlüsselübergabe quittieren lassen",
    ],
  },
];
