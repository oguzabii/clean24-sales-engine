"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items?: FAQItem[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_FAQ: FAQItem[] = [
  {
    question: "Welche Reinigungen bietet Clean24 an?",
    answer:
      "Umzugsreinigung mit Abgabegarantie, Privat- / Wohnungsreinigung, Büro- / Gewerbereinigung, Baureinigung, Fensterreinigung, Grundreinigung, Hauswartung / Treppenhausreinigung, Räumung / Entsorgung und Spezialreinigungen. Wählen Sie im Anfrageformular einfach die passende Kategorie.",
  },
  {
    question: "Erhalte ich für jede Reinigung sofort einen Preis?",
    answer:
      "Bei Umzugsreinigungen erhalten Sie direkt eine unverbindliche Richtpreis-Spanne im Online-Rechner. Alle anderen Kategorien prüfen wir individuell – Sie senden uns Ihre Angaben, und wir melden uns mit einer passenden Offerte.",
  },
  {
    question: "Was bedeutet Abgabegarantie?",
    answer:
      "Die Abgabegarantie gilt für unsere Umzugsreinigungen: Wenn die Wohnung beim Abgabetermin nicht abgenommen wird und der Grund in unserer Reinigungsleistung liegt, kommen wir kostenlos zurück und beheben die beanstandeten Punkte. Ihre Kaution ist damit geschützt. Für andere Reinigungsarten gilt die Abgabegarantie nicht.",
  },
  {
    question: "Ist der Richtpreis verbindlich?",
    answer:
      "Nein, der Richtpreis bei Umzugsreinigungen ist ein unverbindlicher Schätzwert basierend auf Ihren Angaben. Nach Prüfung der Details erhalten Sie von uns einen verbindlichen Fixpreis. Dieser kann leicht vom Richtpreis abweichen – in der Regel bleibt er aber im angezeigten Bereich.",
  },
  {
    question: "Kann ich Fotos zu meiner Anfrage hochladen?",
    answer:
      "Ja, Sie können Ihrer Anfrage optional Fotos oder ein PDF beilegen. Das hilft uns, den Aufwand realistisch einzuschätzen. Nach Prüfung Ihrer Angaben meldet sich Clean24 mit einer strukturierten Rückmeldung bei Ihnen.",
  },
  {
    question: "Wie schnell können Sie bei mir reinigen?",
    answer:
      "Wir versuchen, innerhalb von 2–3 Werktagen einen Termin anzubieten. Bei Express-Anfragen (Aufpreis +15%) können wir oft bereits am nächsten Tag erscheinen – abhängig von Verfügbarkeit.",
  },
  {
    question: "Bringen Sie eigene Reinigungsmittel mit?",
    answer:
      "Ja, wir bringen alle nötigen Reinigungsmittel und Geräte selbst mit. Sie müssen nichts vorbereiten ausser dem Zugang zur Wohnung.",
  },
  {
    question: "In welchen Gebieten sind Sie tätig?",
    answer:
      "Unser Einsatzgebiet umfasst Zürich Stadt, das gesamte Limmattal (Dietikon, Schlieren, Urdorf, Spreitenbach, Weiningen) und die weitere Umgebung. Bei Fragen zu Ihrem Standort erreichen Sie uns telefonisch unter 044 516 19 23 oder per E-Mail an info@clean-24.ch.",
  },
  {
    question: "Was ist in der Umzugsreinigung enthalten?",
    answer:
      "Enthalten sind alle Zimmer, Küche inkl. Backofen-Grundreinigung, Bad und WC, Diele, Fenster innen inkl. Rahmen und Bretter, Bodenreinigung und Wände auf augenfällige Verschmutzungen. Zusatzleistungen wie Balkon, Keller, Lamellen oder Backofen-Tiefenreinigung sind optional zubuchbar.",
  },
  {
    question: "Wie bezahle ich?",
    answer:
      "Nach der Reinigung erhalten Sie eine Rechnung per E-Mail. Bezahlung per Banküberweisung oder Twint. Vorauszahlung ist nicht erforderlich.",
  },
];

export default function FAQ({
  items = DEFAULT_FAQ,
  title = "Häufige Fragen",
  subtitle = "Antworten auf die häufigsten Fragen zu unseren Reinigungsleistungen.",
}: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] gap-10 lg:gap-16">
          <div>
            <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-semibold tracking-[-0.025em] leading-[1.1] text-ink">
              {title}
            </h2>
            <p className="mt-4 text-[15px] text-slate-600 leading-relaxed max-w-sm">{subtitle}</p>
          </div>

          <div className="border-t border-slate-200">
            {items.map((item, index) => (
              <div key={index} className="border-b border-slate-200">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  aria-expanded={openIndex === index}
                  className="w-full flex items-start justify-between gap-6 py-5 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                >
                  <span className="text-[16px] text-ink leading-snug group-hover:text-teal-700 transition-colors duration-200">
                    {item.question}
                  </span>
                  <span
                    aria-hidden
                    className={`mt-1.5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
                      openIndex === index ? "rotate-45" : ""
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" d="M8 2v12M2 8h12" />
                    </svg>
                  </span>
                </button>
                {openIndex === index && (
                  <p className="pb-6 pr-10 text-[14.5px] text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
