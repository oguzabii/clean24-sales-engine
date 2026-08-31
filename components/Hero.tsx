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
    <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white overflow-hidden c24-bg-drift">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
            <span className="c24-live-dot" />
            Mit Abgabegarantie
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            {headline}
          </h1>

          <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
            {subheadline}
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            {showCalculatorCTA && (
              <Link
                href="/umzugsreinigung#calculator"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/25 text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Richtpreis in 60 Sekunden berechnen
              </Link>
            )}
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-lg hover:shadow-green-600/25 text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Jetzt anrufen: {COMPANY.phoneDisplay}
            </a>
          </div>

          <div className="flex flex-wrap gap-6 mt-10 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Abgabegarantie
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Faire Festpreise
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Schweizweit im Einsatz
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Schnelle Antwort
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
