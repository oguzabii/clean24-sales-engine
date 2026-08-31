import Link from "next/link";

const BULLETS = [
  "Vorbereitung vor der Abgabe",
  "Typische Fehler vermeiden",
  "Wichtige Reinigungsbereiche prüfen",
  "Ideal für Mieterinnen und Mieter vor dem Umzug",
];

export default function ChecklistLeadMagnet() {
  return (
    <section className="py-16 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-12"
        >
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/30 rounded-full blur-3xl pointer-events-none c24-glow" />
          <div className="relative grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-400/30 rounded-full px-3 py-1 text-blue-200 text-xs font-semibold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Kostenlos &amp; per E-Mail
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Kostenlose Wohnungsabgabe-Checkliste
              </h2>
              <p className="text-blue-100/90 leading-relaxed mb-6 max-w-xl">
                Erhalten Sie die wichtigsten Punkte, die Verwaltungen bei der Wohnungsabgabe häufig
                prüfen – direkt per E-Mail.
              </p>
              <ul className="grid sm:grid-cols-2 gap-2.5 mb-7">
                {BULLETS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-blue-100">
                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href="/checkliste-wohnungsabgabe"
                className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg hover:shadow-xl"
              >
                Checkliste kostenlos erhalten
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="hidden lg:block">
              <div className="relative bg-white text-gray-900 rounded-2xl shadow-2xl p-5 rotate-1">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <div className="text-sm font-semibold">Wohnungsabgabe-Checkliste</div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">PDF · Gratis</span>
                </div>
                <ul className="space-y-2 text-xs text-gray-700">
                  {["Küche & Backofen", "Bad & WC inkl. Silikonfugen", "Fenster, Rahmen & Storen", "Böden, Türen, Schalter", "Balkon & Keller"].map((row) => (
                    <li key={row} className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded border border-gray-300 flex items-center justify-center text-blue-600">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      {row}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
