import Image from "next/image";
import Link from "next/link";
import { COMPANY } from "@/lib/constants";

interface HeroProps {
  headline?: string;
  subheadline?: string;
  showCalculatorCTA?: boolean;
}

export default function Hero({
  headline = "Umzugsreinigung mit Abgabegarantie in der Schweiz",
  subheadline = "Einsätze in der ganzen Schweiz nach Verfügbarkeit. Wir reinigen vor der Abgabe und begleiten den Übergabetermin, damit reinigungsbezogene Punkte direkt geklärt werden.",
  showCalculatorCTA = true,
}: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#f7fafb] pt-24">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-22">
        <div>
          <div className="c24-eyebrow mb-5">Clean24 Anfrage</div>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.05] text-[#0b1f33] md:text-6xl">
            {headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{subheadline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {showCalculatorCTA && (
              <Link href="/umzugsreinigung#calculator" className="c24-button-primary">
                Richtpreis in 60 Sekunden berechnen
              </Link>
            )}
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="c24-button-secondary">
              {COMPANY.phoneDisplay}
            </a>
          </div>
        </div>
        <div className="overflow-hidden rounded-lg border border-white shadow-[0_24px_70px_-42px_rgba(11,31,51,0.7)]">
          <Image
            src="/clean24-editorial-cleaning.png"
            alt="Clean24 Reinigung in einer hellen Wohnung"
            width={1536}
            height={864}
            priority
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
