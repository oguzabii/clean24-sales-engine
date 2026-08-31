import PriceCalculator from "./PriceCalculator";

const FLOW = [
  {
    title: "Leistung",
    desc: "Wählen Sie die Reinigung, die Sie benötigen.",
  },
  {
    title: "Objekt",
    desc: "Erfassen Sie die wichtigsten Angaben zum Einsatz.",
  },
  {
    title: "System",
    desc: "Ihre Anfrage läuft strukturiert weiter.",
  },
  {
    title: "Offerte",
    desc: "Sie erhalten einen klaren nächsten Schritt.",
  },
];

export default function OfferStart() {
  return (
    <section
      id="offer"
      className="relative scroll-mt-24 bg-[#eef5f7] py-16 lg:py-24"
    >
      <div className="container-page">
        <div data-reveal className="mx-auto mb-10 max-w-3xl text-center">
          <div className="c24-eyebrow mb-4 justify-center">
            Clean24 System · Schritt 01
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-[#0b1f33] md:text-5xl">
            Anfrage starten.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Wenige Angaben. Klarer nächster Schritt. Das Formular ist der Einstieg in das
            Clean24 System.
          </p>
        </div>

        <div
          data-reveal
          className="mx-auto mb-10 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FLOW.map((step, i) => (
            <div
              key={step.title}
              className="relative border-l border-[#b8d5d8] bg-white/58 p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center bg-[#0b1f33] text-xs font-semibold text-white">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="text-sm font-semibold leading-snug text-[#0b1f33]">{step.title}</div>
              </div>
              <p className="pl-12 text-xs leading-relaxed text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>

        <div data-reveal className="mx-auto max-w-4xl">
          <PriceCalculator />
          <p className="mx-auto mt-5 max-w-lg text-center text-xs leading-relaxed text-slate-500">
            Unverbindlich · keine Vorauszahlung · Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
          </p>
        </div>
      </div>
    </section>
  );
}
