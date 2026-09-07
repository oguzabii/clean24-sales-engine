import Image from "next/image";
import PriceCalculator from "./PriceCalculator";

/**
 * The quotation stage — this is the page, not a section of it.
 *
 * Two planes, no cards: an owned Clean24 photograph bleeding to the left
 * viewport edge (lg and up, sticky while the form scrolls) and the quotation
 * itself on white. Below lg the photograph is dropped entirely so the first
 * question and the service choices own the opening viewport.
 */
export default function OfferStart() {
  return (
    <section id="offer" className="scroll-mt-20 lg:grid lg:grid-cols-12">
      {/* ---- Visual plane (lg+). Sized via `sizes` so small screens fetch a
              negligible candidate for an image they never display. ---- */}
      <div className="hidden lg:block lg:col-span-5 xl:col-span-5 relative bg-navy-950">
        <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] relative overflow-hidden">
          <Image
            src="/clean24-hero.png"
            alt="Clean24 Mitarbeiter bei der Reinigung einer Eingangshalle."
            fill
            priority
            sizes="(min-width: 1024px) 42vw, 1px"
            className="object-cover"
            style={{ objectPosition: "62% 50%" }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-navy-950 via-navy-950/60 to-transparent"
          />
          <p className="absolute bottom-9 left-9 right-9 text-white text-[22px] xl:text-[26px] font-semibold tracking-[-0.02em] leading-snug">
            Sauberkeit mit System.
          </p>
        </div>
      </div>

      {/* ---- Quotation plane ---- */}
      <div className="lg:col-span-7 xl:col-span-7 bg-white">
        <div className="px-5 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-10 lg:py-14 max-w-[44rem]">
          <PriceCalculator />
        </div>
      </div>
    </section>
  );
}
