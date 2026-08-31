interface Category {
  title: string;
  items: string[];
  icon: React.ReactNode;
}

const CATEGORIES: Category[] = [
  {
    title: "Küche",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6M9 10h6M9 14h6" />
      </svg>
    ),
    items: [
      "Herd, Backofen, Dunstabzug",
      "Schränke innen und aussen",
      "Arbeitsflächen, Spüle, Armaturen",
      "Fliesen und Fugen sichtbar",
    ],
  },
  {
    title: "Bad / WC",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2.25M15 3v2.25M3 9.75h18M5.25 9.75v8.25a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V9.75" />
      </svg>
    ),
    items: [
      "Dusche, Badewanne, WC",
      "Lavabo, Armaturen, Spiegel",
      "Normale Kalkreinigung",
      "Fliesen und sichtbare Fugen",
    ],
  },
  {
    title: "Wohnräume",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    items: [
      "Böden gründlich gereinigt",
      "Türen, Türrahmen, Zargen",
      "Schalter, Steckdosen, Heizkörper",
      "Sichtbare Oberflächen und Sockelleisten",
    ],
  },
  {
    title: "Fenster / Storen",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4zM4 12h16M12 4v16" />
      </svg>
    ),
    items: [
      "Fenster innen inkl. Rahmen",
      "Fensterbretter und Zargen",
      "Normale Storen / Lamellen",
      "Sichtbare Beschläge",
    ],
  },
  {
    title: "Balkon / Keller",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16M4 10h16M4 10l8-7 8 7M6 10v11M18 10v11M10 21v-5h4v5" />
      </svg>
    ),
    items: [
      "Balkon / Loggia in normalem Zustand",
      "Kehren, Geländer, Bodenbelag",
      "Keller / Estrich in normaler Grösse",
      "Sichtbare Oberflächen",
    ],
  },
  {
    title: "Abgabebegleitung",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.068 12.124C.068 18.403 5.082 23.5 12 23.5s11.932-5.097 11.932-11.376A11.955 11.955 0 0120.402 6 11.959 11.959 0 0112 2.714z" />
      </svg>
    ),
    items: [
      "Interne Abschlusskontrolle vor der Abgabe",
      "Vor-Ort-Begleitung beim Übergabetermin",
      "Direkte Klärung reinigungsbezogener Punkte",
      "Kostenlose Nachbesserung im Garantieumfang",
    ],
    highlight: true,
  } as Category & { highlight?: boolean },
];

export default function IncludedServices() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            Standardleistung
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Was ist in der Umzugsreinigung enthalten?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Unsere Standard-Umzugsreinigung deckt alle Bereiche ab, die Verwaltungen bei der Abgabe
            typischerweise prüfen – inklusive Begleitung bis zur erfolgreichen Übergabe.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATEGORIES.map((cat) => {
            const highlight = (cat as Category & { highlight?: boolean }).highlight;
            return (
              <div
                key={cat.title}
                data-reveal
                className={
                  highlight
                    ? "relative bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-7 shadow-[0_20px_50px_-12px_rgba(30,64,175,0.4)] overflow-hidden"
                    : "group relative bg-white rounded-2xl p-7 border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.08)] hover:border-blue-100 transition-all"
                }
              >
                {highlight && (
                  <div className="absolute -top-24 -right-24 w-56 h-56 bg-blue-400/30 rounded-full blur-3xl pointer-events-none c24-glow" />
                )}
                <div className="relative">
                  <div
                    className={
                      highlight
                        ? "w-11 h-11 rounded-xl bg-white/15 border border-white/20 text-white flex items-center justify-center mb-5"
                        : "w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors"
                    }
                  >
                    {cat.icon}
                  </div>
                  <h3
                    className={
                      highlight
                        ? "font-semibold text-white mb-3 text-base"
                        : "font-semibold text-gray-900 mb-3 text-base"
                    }
                  >
                    {cat.title}
                  </h3>
                  <ul className="space-y-2">
                    {cat.items.map((item) => (
                      <li
                        key={item}
                        className={
                          highlight
                            ? "flex items-start gap-2.5 text-sm text-blue-50/95"
                            : "flex items-start gap-2.5 text-sm text-gray-700"
                        }
                      >
                        <svg
                          className={
                            highlight
                              ? "w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5"
                              : "w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                          }
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
