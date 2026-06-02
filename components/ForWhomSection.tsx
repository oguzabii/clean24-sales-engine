const CARDS = [
  {
    problem: "Sie ziehen bald aus",
    solution: "Wir planen die Endreinigung passend zwischen Umzug und Übergabetermin – ohne Lücken.",
  },
  {
    problem: "Die Wohnungsabgabe steht bevor",
    solution: "Reinigung nach Schweizer Standard plus Vor-Ort-Begleitung beim offiziellen Übergabetermin.",
  },
  {
    problem: "Sie möchten Beanstandungen vermeiden",
    solution: "Mit Abgabegarantie auf reinigungsbezogene Punkte – inklusive direkter Nachbesserung.",
  },
  {
    problem: "Sie brauchen kurzfristig einen Termin",
    solution: "Express-Termin innerhalb 24–48h möglich, je nach Verfügbarkeit der Teams.",
  },
  {
    problem: "Sie möchten Klarheit statt Unsicherheit",
    solution: "Richtpreis in 60 Sekunden. Fixpreis nach Prüfung. Strukturierter Ablauf bis zur Abgabe.",
  },
  {
    problem: "Sie möchten bequem per WhatsApp anfragen",
    solution: "Senden Sie 3–5 Fotos – wir liefern eine schnelle Ersteinschätzung mit Richtpreis.",
  },
];

export default function ForWhomSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            Passt das zu Ihnen?
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Für wen unsere Umzugsreinigung wirklich gemacht ist.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Wenn eines dieser Themen auf Sie zutrifft, profitieren Sie überdurchschnittlich von einer
            strukturierten Umzugsreinigung mit Abgabegarantie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CARDS.map((card, i) => (
            <div
              key={card.problem}
              data-reveal
              className="group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.08)] hover:border-blue-100 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute -top-px -left-px h-1 w-12 bg-gradient-to-r from-blue-600 to-blue-400 rounded-tl-2xl" />
              <div className="text-[11px] uppercase tracking-wider text-blue-600 font-semibold mb-2">
                Situation {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-semibold text-gray-900 mb-3 text-base leading-snug">
                {card.problem}
              </h3>
              <div className="flex items-start gap-2.5 pt-3 border-t border-gray-100">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-600 leading-relaxed">{card.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
