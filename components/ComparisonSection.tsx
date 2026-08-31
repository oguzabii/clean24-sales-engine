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
    <section className="relative c24-section overflow-hidden bg-white">
      <div className="container-page relative">
        <div data-reveal className="mx-auto mb-12 max-w-3xl text-center">
          <div className="c24-eyebrow mb-4">
            Direktvergleich
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#0b1f33] md:text-4xl">
            Der Unterschied zeigt sich bei der Abgabe.
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-slate-600">
            Eine Wohnungsabgabe ist kein Experiment. Wer den Übergabetermin sauber besteht, spart
            sich Beanstandungen, Stress und potenzielle Kosten.
          </p>
        </div>

        <div className="grid items-stretch gap-5 md:grid-cols-2 lg:gap-6">
          {/* Premium side – Clean24 */}
          <div
            data-reveal
            className="relative overflow-hidden rounded-lg bg-[#0b1f33] p-8 text-white lg:p-10"
          >
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal-200">
                <span className="c24-live-dot" />
                Mit Clean24
              </div>
              <h3 className="text-xl lg:text-2xl font-bold tracking-tight mb-2">
                Strukturiert. Begleitet. Verbindlich.
              </h3>
              <p className="mb-7 text-sm leading-relaxed text-slate-300">
                Ein professioneller Ablauf von der Anfrage bis zur erfolgreichen Übergabe.
              </p>
              <ul className="space-y-4">
                {WITH_CLEAN24.map((item) => (
                  <li key={item.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                      <svg className="h-3.5 w-3.5 text-teal-200" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-slate-300">{item.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Passive side – ohne */}
          <div
            data-reveal
            className="relative rounded-lg border border-[#dbe6ea] bg-[#f7fafb] p-8 lg:p-10"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Ohne strukturierte Endreinigung
            </div>
            <h3 className="mb-2 text-xl font-bold tracking-tight text-[#0b1f33] lg:text-2xl">
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
