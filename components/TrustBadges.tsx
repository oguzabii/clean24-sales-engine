const badges = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.955 11.955 0 01.068 12.124C.068 18.403 5.082 23.5 12 23.5s11.932-5.097 11.932-11.376A11.955 11.955 0 0120.402 6 11.959 11.959 0 0112 2.714z" />
      </svg>
    ),
    title: "Abgabegarantie bei Umzugsreinigung",
    desc: "Bei Umzugsreinigungen begleiten wir die Wohnungsabgabe und klären reinigungsbezogene Beanstandungen direkt – falls nötig auch im Rahmen einer kostenlosen Nachbesserung.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Richtpreis in 60 Sekunden",
    desc: "Bei Umzugsreinigungen sofortige Richtpreis-Spanne, andere Reinigungen prüfen wir individuell. Fixpreis bzw. Offerte nach Prüfung Ihrer Angaben.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: "Schweizweit im Einsatz",
    desc: "Unser Team operiert von Dietikon aus und ist in der ganzen Schweiz für Reinigungseinsätze unterwegs – Verfügbarkeit je nach Region und Termin.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: "Geprüfte Qualität",
    desc: "Systematische Reinigung nach Schweizer Standard – bei Umzugsreinigungen mit Abschlussbegehung.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Sofortige Bestätigung",
    desc: "Anfragen werden automatisch erfasst – Sie erhalten unmittelbar eine Eingangsbestätigung, gefolgt von einer strukturierten Rückmeldung.",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
      </svg>
    ),
    title: "MwSt.-konforme Rechnung",
    desc: "Saubere Rechnung mit MwSt.-Ausweis. CHE-260.909.323 · Clean24 Memis GmbH.",
  },
];

interface TrustBadgesProps {
  title?: string;
  subtitle?: string;
}

export default function TrustBadges({
  title = "Sechs Gründe, die bei der Abgabe zählen.",
  subtitle = "Wir sind auf Umzugsreinigungen spezialisiert – mit klaren Prozessen, sofortiger Bestätigung und Begleitung bis zur erfolgreichen Wohnungsabgabe.",
}: TrustBadgesProps) {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-14 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            Warum Clean24
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
            {title}
          </h2>
          <p className="text-gray-500 leading-relaxed">{subtitle}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {badges.map((badge) => (
            <div
              key={badge.title}
              data-reveal
              className="group relative bg-white rounded-2xl p-6 lg:p-7 border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.08)] hover:-translate-y-0.5 hover:border-blue-100 transition-all duration-300"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-[80%] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center mb-5 shadow-md shadow-blue-900/10">
                  {badge.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-base">{badge.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
