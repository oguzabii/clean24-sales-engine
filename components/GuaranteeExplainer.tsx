const STEPS = [
  {
    title: "Reinigung vor der Abgabe",
    desc: "Wir führen die Umzugsreinigung nach Schweizer Standard durch – mit interner Abschlusskontrolle, bevor die Verwaltung die Wohnung sieht.",
  },
  {
    title: "Begleitung bei der Wohnungsabgabe",
    desc: "Clean24 begleitet die Wohnungsabgabe vor Ort. So werden reinigungsbezogene Punkte direkt mit Verwaltung oder Vermieter geklärt, statt schriftliche Beanstandungen abzuwarten.",
  },
  {
    title: "Direkte Nachbesserung bei reinigungsbezogenen Punkten",
    desc: "Werden Reinigungspunkte beanstandet, beheben wir sie unmittelbar vor Ort – oder im Rahmen einer kostenlosen Nachreinigung. Ohne zusätzliche Reinigungskosten.",
  },
];

export default function GuaranteeExplainer() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Abgabegarantie
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Abgabegarantie – einfach erklärt
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Wir betrachten die Wohnungsabgabe als Teil unserer Leistung – nicht als nachgelagerten
            Reklamationsfall. Wir begleiten den Übergabetermin vor Ort und kümmern uns sofort
            um reinigungsbezogene Punkte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              data-reveal
              className="relative bg-gradient-to-br from-white to-blue-50/40 border border-gray-100 rounded-2xl p-7 hover:shadow-[0_12px_32px_rgba(30,64,175,0.08)] hover:border-blue-100 transition-all"
            >
              <div className="absolute top-5 right-5 text-6xl font-bold text-blue-50 select-none leading-none">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="relative">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-semibold mb-5 shadow-md shadow-blue-900/10">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-base leading-snug">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div data-reveal className="mt-10 max-w-3xl mx-auto bg-gray-50 border border-gray-100 rounded-2xl p-5">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Wichtiger Hinweis:</strong> Die Abgabegarantie bezieht
            sich ausschliesslich auf reinigungsbezogene Punkte unserer Leistung. Nicht abgedeckt
            sind Renovationen, bauliche Mängel, Schäden, Schlüsselübergabe, Malerarbeiten oder
            andere Mieterpflichten.
          </p>
        </div>
      </div>
    </section>
  );
}
