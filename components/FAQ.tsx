"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items?: FAQItem[];
  title?: string;
}

const DEFAULT_FAQ: FAQItem[] = [
  {
    question: "Was bedeutet Abgabegarantie?",
    answer:
      "Wenn die Wohnung beim Abgabetermin nicht abgenommen wird und der Grund in unserer Reinigungsleistung liegt, kommen wir kostenlos zurück und beheben die beanstandeten Punkte. Ihre Kaution ist damit geschützt.",
  },
  {
    question: "Ist der Richtpreis verbindlich?",
    answer:
      "Nein, der Richtpreis ist ein unverbindlicher Schätzwert basierend auf Ihren Angaben. Nach Prüfung der Details erhalten Sie von uns einen verbindlichen Fixpreis. Dieser kann leicht vom Richtpreis abweichen – in der Regel bleibt er aber im angezeigten Bereich.",
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
      "Unser Einsatzgebiet umfasst Zürich Stadt, das gesamte Limmattal (Dietikon, Schlieren, Urdorf, Spreitenbach, Weiningen) und die weitere Umgebung. Bei Fragen zu Ihrem Standort kontaktieren Sie uns kurz via WhatsApp.",
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

export default function FAQ({ items = DEFAULT_FAQ, title = "Häufige Fragen" }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-500">Antworten auf die häufigsten Fragen zur Umzugsreinigung.</p>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left"
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                <svg
                  className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
