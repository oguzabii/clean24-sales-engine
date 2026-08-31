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
    <section className="c24-section bg-[#f7fafb]">
      <div className="container-page">
        <div data-reveal className="mx-auto mb-12 max-w-3xl text-center">
          <div className="c24-eyebrow mb-4">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Abgabegarantie
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#0b1f33] md:text-4xl">
            Abgabegarantie – einfach erklärt
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-slate-600">
            Wir betrachten die Wohnungsabgabe als Teil unserer Leistung – nicht als nachgelagerten
            Reklamationsfall. Wir begleiten den Übergabetermin vor Ort und kümmern uns sofort
            um reinigungsbezogene Punkte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-lg border border-[#dbe6ea] bg-white md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              data-reveal
              className="relative border-b border-[#dbe6ea] p-7 md:border-b-0 md:border-r md:last:border-r-0"
            >
              <div className="absolute right-5 top-5 select-none text-6xl font-bold leading-none text-[#eef5f7]">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="relative">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-[#0b1f33] font-semibold text-white">
                  {i + 1}
                </div>
                <h3 className="mb-2 text-base font-bold leading-snug text-[#0b1f33]">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div data-reveal className="mx-auto mt-10 max-w-3xl rounded-lg border border-[#dbe6ea] bg-white p-5">
          <p className="text-xs leading-relaxed text-slate-500">
            <strong className="text-[#0b1f33]">Wichtiger Hinweis:</strong> Die Abgabegarantie bezieht
            sich ausschliesslich auf reinigungsbezogene Punkte unserer Leistung. Nicht abgedeckt
            sind Renovationen, bauliche Mängel, Schäden, Schlüsselübergabe, Malerarbeiten oder
            andere Mieterpflichten.
          </p>
        </div>
      </div>
    </section>
  );
}
