import PriceCalculator from "./PriceCalculator";

/**
 * The quotation workspace — this is the page, not a section of it.
 *
 * A single light canvas holding the stepper and the three-column layout
 * (explanation · active step · live summary). No photography.
 */
export default function OfferStart() {
  return (
    <section id="offer" className="scroll-mt-24 bg-[#eef4f8] border-b border-slate-200">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10 py-10 lg:py-14">
        <PriceCalculator />
      </div>
    </section>
  );
}
