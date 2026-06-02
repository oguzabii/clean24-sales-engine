import PriceCalculator from "./PriceCalculator";

const FLOW = [
  {
    title: "Angaben erfassen",
    desc: "Wohnungsgrösse, allfällige Zusatzleistungen und Wunschtermin angeben.",
  },
  {
    title: "Richtpreis erhalten",
    desc: "Transparenter Preisbereich – sofort sichtbar, unverbindlich.",
  },
  {
    title: "Anfrage absenden",
    desc: "Kostenlose, unverbindliche Anfrage – ohne Vorauszahlung, ohne Verpflichtung.",
  },
  {
    title: "Clean24 prüft & meldet sich zurück",
    desc: "Sofortige Eingangsbestätigung. Anschliessend strukturierte Rückmeldung mit Fixpreis und Terminvorschlag.",
  },
];

export default function OfferStart() {
  return (
    <section
      id="offer"
      className="relative py-20 lg:py-24 bg-gradient-to-b from-white via-blue-50/30 to-white scroll-mt-24"
    >
      {/* Subtle top accent border */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-12 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-full px-4 py-1.5 text-xs font-bold mb-5 uppercase tracking-wider shadow-md shadow-blue-900/20">
            <span className="c24-live-dot" />
            Offerte starten
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Kostenlose, unverbindliche Anfrage in 60 Sekunden.
          </h2>
          <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            Sie starten hier eine kostenlose, unverbindliche Anfrage – keine Buchung, keine
            Vorauszahlung. Nach Prüfung Ihrer Angaben meldet sich Clean24 strukturiert mit Fixpreis
            und Terminvorschlag.
          </p>
        </div>

        {/* 4-step flow preview */}
        <div
          data-reveal
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12"
        >
          {FLOW.map((step, i) => (
            <div
              key={step.title}
              className="relative bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <div className="text-sm font-semibold text-gray-900 leading-snug">{step.title}</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed pl-12">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Calculator — wrapped so the section feels like the primary offer hub */}
        <div data-reveal className="max-w-2xl mx-auto relative">
          {/* Soft halo behind the calculator to mark it as the primary action */}
          <div
            aria-hidden
            className="absolute -inset-4 bg-gradient-to-br from-blue-300/30 via-blue-200/20 to-emerald-200/20 rounded-3xl blur-2xl pointer-events-none"
          />
          <div className="relative">
            <PriceCalculator />
          </div>
          <p className="text-xs text-gray-500 text-center mt-5 max-w-md mx-auto leading-relaxed">
            Unverbindlich · keine Vorauszahlung · sofortige Eingangsbestätigung nach Absenden ·
            Fixpreis nach Prüfung Ihrer Angaben.
          </p>
        </div>
      </div>
    </section>
  );
}
