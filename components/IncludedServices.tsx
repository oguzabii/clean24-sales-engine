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
    <section className="c24-section bg-white">
      <div className="container-page">
        <div data-reveal className="mx-auto mb-12 max-w-3xl text-center">
          <div className="c24-eyebrow mb-4">
            Standardleistung
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#0b1f33] md:text-4xl">
            Was ist in der Umzugsreinigung enthalten?
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-slate-600">
            Unsere Standard-Umzugsreinigung deckt alle Bereiche ab, die Verwaltungen bei der Abgabe
            typischerweise prüfen – inklusive Begleitung bis zur erfolgreichen Übergabe.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const highlight = (cat as Category & { highlight?: boolean }).highlight;
            return (
              <div
                key={cat.title}
                data-reveal
                className={
                  highlight
                    ? "relative overflow-hidden rounded-lg bg-[#0b1f33] p-7 text-white"
                    : "group relative rounded-lg border border-[#dbe6ea] bg-white p-7 transition-colors hover:border-[#9ac7c7]"
                }
              >
                <div className="relative">
                  <div
                    className={
                      highlight
                        ? "mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-white/20 bg-white/12 text-white"
                        : "mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#eefbf8] text-[#0f766e] transition-colors"
                    }
                  >
                    {cat.icon}
                  </div>
                  <h3
                    className={
                      highlight
                        ? "mb-3 text-base font-bold text-white"
                        : "mb-3 text-base font-bold text-[#0b1f33]"
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
                            ? "flex items-start gap-2.5 text-sm text-slate-100"
                            : "flex items-start gap-2.5 text-sm text-slate-700"
                        }
                      >
                        <svg
                          className={
                            highlight
                              ? "mt-0.5 h-4 w-4 flex-shrink-0 text-teal-200"
                              : "mt-0.5 h-4 w-4 flex-shrink-0 text-[#1f9b8f]"
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
