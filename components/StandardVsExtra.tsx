const STANDARD = [
  "Normale Fenster, Rahmen und Storen/Lamellen",
  "Normale Küche inkl. Backofen, Dunstabzug, Schränke",
  "Normales Bad und WC inkl. normaler Kalkreinigung",
  "Normaler Balkon / Loggia",
  "Keller/Estrich in normaler Grösse",
  "Türen, Schalter, sichtbare Oberflächen, Böden",
];

const OPTIONAL = [
  "Hochdruckreinigung Aussenbereich",
  "Starke Kalkablagerungen / Spezial-Entkalkung",
  "Raucherwohnung / Nikotinrückstände",
  "Tierhaare / Geruchsbehandlung",
  "Wintergarten / sehr viele Glasflächen",
  "Grosser Hobbyraum oder zusätzliche Nebenräume",
  "Teppich-/Spannteppichreinigung",
];

export default function StandardVsExtra() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Standardleistung vs. Zusatzleistung
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Damit es keine Überraschungen gibt: hier sehen Sie, was in der Standard-Umzugsreinigung
            enthalten ist – und wann eine Zusatzleistung sinnvoll ist.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div
            data-reveal
            className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <h3 className="text-lg font-semibold text-blue-900">In der Standard-Umzugsreinigung enthalten</h3>
            </div>
            <p className="text-xs text-blue-700/70 mb-5">Bereits im Festpreis Ihrer Wohnungsgrösse.</p>
            <ul className="space-y-2.5">
              {STANDARD.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-800">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            data-reveal
            className="bg-gray-50 border border-gray-200 rounded-2xl p-6 lg:p-8"
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Optional bei besonderem Aufwand</h3>
            </div>
            <p className="text-xs text-gray-500 mb-5">Wählbar im Richtpreis-Rechner unter „Zusatzleistungen“.</p>
            <ul className="space-y-2.5">
              {OPTIONAL.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-gray-400 mt-2" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
