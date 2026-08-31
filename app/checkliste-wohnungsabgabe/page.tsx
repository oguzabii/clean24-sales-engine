import type { Metadata } from "next";
import { OfferScrollLink } from "@/components/OfferScrollLink";
import ChecklistMagnet, { type ChecklistSection } from "@/components/ChecklistMagnet";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Gratis Checkliste Wohnungsabgabe Schweiz",
  description:
    "Kostenlose Checkliste für Ihre Wohnungsabgabe in der Schweiz. Alle Punkte, die Ihr Vermieter prüft. Jetzt per E-Mail anfordern.",
  alternates: { canonical: "https://www.clean-24.ch/checkliste-wohnungsabgabe" },
};

const CHECKLIST_SECTIONS: ChecklistSection[] = [
  {
    title: "Küche",
    items: [
      "Backofen innen und aussen gereinigt",
      "Herdplatten entfettet",
      "Abzugshaube und Filter gereinigt",
      "Kühlschrank innen ausgewischt und abgetaut",
      "Schränke innen und aussen abgewischt",
      "Arbeitsfläche gereinigt",
      "Spüle und Wasserhahn entkalkt und poliert",
      "Kacheln entfettet",
    ],
  },
  {
    title: "Bad & WC",
    items: [
      "Dusche / Badewanne entkalkt und gereinigt",
      "Armaturen poliert",
      "Spiegel streifenfrei gereinigt",
      "WC innen und aussen desinfiziert",
      "Kacheln und Fugen gereinigt",
      "Schränke innen und aussen abgewischt",
      "Boden geschrubbt",
    ],
  },
  {
    title: "Alle Zimmer",
    items: [
      "Böden gesaugt und gewischt",
      "Wände auf augenfällige Flecken geprüft",
      "Fenster innen mit Rahmen und Bretter geputzt",
      "Türen, Zargen und Griffe abgewischt",
      "Steckdosen und Lichtschalter abgewischt",
      "Lampen und Deckenleuchten abgestaubt",
      "Heizungskörper gereinigt",
      "Einbauschränke innen und aussen gereinigt",
    ],
  },
  {
    title: "Diele & Allgemein",
    items: [
      "Eingang und Diele gekehrt und gewischt",
      "Briefkasten geleert",
      "Klingelschilder entfernt",
      "Kellerabteil geräumt und gekehrt (falls vorhanden)",
      "Balkon / Terrasse gekehrt (falls vorhanden)",
      "Schlüssel vollständig vorhanden",
    ],
  },
  {
    title: "Abgabe-Termin Vorbereitung",
    items: [
      "Einzugsprotokoll bereit",
      "Alle Schlüssel gesammelt",
      "Eigene Gegenstände vollständig entfernt",
      "Zählerstände (Strom, Gas, Wasser) notiert",
      "Adressänderung bei Post und Behörden eingereicht",
    ],
  },
];

export default function ChecklistePage() {
  return (
    <>
      <ChecklistMagnet sections={CHECKLIST_SECTIONS} />

      {/* Cross-sell back to the main offer */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
            Reinigung lieber den Profis überlassen?
          </h2>
          <p className="text-gray-500 mb-8">
            Clean24 übernimmt Ihre Umzugsreinigung komplett – mit Abgabegarantie und Begleitung beim
            Übergabetermin. Starten Sie jetzt eine unverbindliche Anfrage.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <OfferScrollLink
              href="/#offer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
            >
              Kostenlose Offerte erhalten
            </OfferScrollLink>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 border-2 border-blue-600 text-blue-700 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {COMPANY.phoneDisplay}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
