const WITH_CLEAN24 = [
  { title: "Klare Offerte", desc: "Richtpreis sofort, Fixpreis nach Prüfung." },
  { title: "Abgabegarantie", desc: "Reinigungsbezogene Beanstandungen werden direkt geklärt." },
  { title: "Begleitung bei der Abgabe", desc: "Vor-Ort-Begleitung beim Übergabetermin." },
  { title: "Professionelle Endreinigung", desc: "Systematisch nach Schweizer Standard." },
  { title: "Strukturierte Kommunikation", desc: "Sofortige Eingangsbestätigung, klarer Ablauf." },
];

const WITHOUT = [
  { title: "Unklare Zeitplanung", desc: "Reinigung wird zwischen Umzug und Übergabe gequetscht." },
  { title: "Risiko bei Beanstandungen", desc: "Keine strukturierte Nachbesserung am Übergabetermin." },
  { title: "Hoher Eigenaufwand", desc: "Geräte, Reinigungsmittel, Zeit, Stress." },
  { title: "Ungewissheit beim Übergabetermin", desc: "Niemand vor Ort, der reinigungsbezogene Punkte klärt." },
  { title: "Kein verbindlicher Ablauf", desc: "Improvisation statt klarer Prozess." },
];

export default function ComparisonSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div data-reveal className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-gray-900 text-white rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            Direktvergleich
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Der Unterschied zeigt sich bei der Abgabe.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Eine Wohnungsabgabe ist kein Experiment. Wer den Übergabetermin sauber besteht, spart
            sich Beanstandungen, Stress und potenzielle Kosten.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          {/* Premium side – Clean24 */}
          <div
            data-reveal
            className="relative bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white rounded-3xl p-8 lg:p-10 shadow-[0_24px_60px_-15px_rgba(30,64,175,0.5)] overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none c24-glow" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-3 py-1 text-emerald-300 text-[11px] font-semibold uppercase tracking-wider mb-5">
                <span className="c24-live-dot" />
                Mit Clean24
              </div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-2">
                Strukturiert. Begleitet. Verbindlich.
              </h3>
              <p className="text-sm text-blue-100/70 mb-7 leading-relaxed">
                Ein professioneller Ablauf von der Anfrage bis zur erfolgreichen Übergabe.
              </p>
              <ul className="space-y-4">
                {WITH_CLEAN24.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mt-0.5">
                      <svg className="w-3.5 h-3.5 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-blue-100/70 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Passive side – ohne */}
          <div
            data-reveal
            className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-gray-200/80 shadow-sm"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-500 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Ohne strukturierte Endreinigung
            </div>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-700 tracking-tight mb-2">
              Improvisiert. Riskant. Unklar.
            </h3>
            <p className="text-sm text-gray-500 mb-7 leading-relaxed">
              Alles selbst organisieren – ohne Begleitung beim Übergabetermin.
            </p>
            <ul className="space-y-4">
              {WITHOUT.map((item) => (
                <li key={item.title} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mt-0.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-gray-700">{item.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
