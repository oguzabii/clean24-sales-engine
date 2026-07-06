import Link from "next/link";
import PriceCalculator from "./PriceCalculator";
import LeadForm from "./LeadForm";
import FAQ from "./FAQ";
import CTASection from "./CTASection";
import TrustBadges from "./TrustBadges";
import { COMPANY } from "@/lib/constants";

interface LocalSeoPageProps {
  city: string;
  slug: string;
  headline: string;
  intro: string;
}

export default function LocalSeoPage({ city, slug, headline, intro }: LocalSeoPageProps) {
  const cityFaqs = [
    {
      question: `Wie schnell können Sie in ${city} eine Umzugsreinigung durchführen?`,
      answer: `Für ${city} und Umgebung bieten wir Termine oft innerhalb von 2–3 Werktagen an. Bei Express-Bedarf (Aufpreis +15%) versuchen wir einen Termin am nächsten Werktag zu organisieren.`,
    },
    {
      question: `Was kostet eine Umzugsreinigung in ${city}?`,
      answer: `Der Preis hängt von der Wohnungsgrösse und den gewünschten Zusatzleistungen ab. Startpreise: 1–1.5 Zimmer ab CHF 750, 2.5 Zimmer ab CHF 880, 3.5 Zimmer ab CHF 1'150, 4.5 Zimmer ab CHF 1'290. Alle Preise inkl. 8.1% MwSt. Berechnen Sie Ihren Richtpreis in 60 Sekunden.`,
    },
    {
      question: "Gilt die Abgabegarantie auch wenn der Vermieter streng ist?",
      answer: "Ja. Wenn die Abnahme scheitert und der Grund in unserer Reinigungsleistung liegt, kommen wir kostenlos zurück und beheben die beanstandeten Punkte. Das gilt unabhängig davon, wie streng der Vermieter oder die Hausverwaltung ist.",
    },
    {
      question: "Muss ich bei der Reinigung anwesend sein?",
      answer: "Nein. Sie müssen nur beim Start kurz zugegen sein (Schlüsselübergabe) und am Ende zur Abschlussbegehung. Danach übernehmen wir den Rest.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-blue-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              {city} – Mit Abgabegarantie
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6 tracking-tight">
              {headline}
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed mb-8 max-w-2xl">{intro}</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#calculator"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                Richtpreis berechnen
              </a>
              <a
                href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center justify-center gap-2 border border-white/40 text-white hover:bg-white/10 font-semibold px-8 py-4 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {COMPANY.phoneDisplay}
              </a>
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Calculator */}
      <section id="calculator" className="py-16 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Richtpreis für {city} berechnen
            </h2>
            <p className="text-gray-500">
              Geben Sie Ihre Wohnungsgrösse an und erhalten Sie sofort einen Richtpreis.
            </p>
          </div>
          <PriceCalculator />
        </div>
      </section>

      {/* Lead form */}
      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Direkte Anfrage für {city}
            </h2>
            <p className="text-gray-500">
              Kein Kalkulator nötig – füllen Sie direkt das Formular aus. Wir antworten innerhalb von 10 Minuten.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <LeadForm pagePath={`/${slug}`} />
          </div>
        </div>
      </section>

      <FAQ items={cityFaqs} title={`Fragen zur Umzugsreinigung in ${city}`} />

      <CTASection
        title={`Ihre stressfreie Wohnungsabgabe in ${city}`}
        subtitle="Clean24 übernimmt die Reinigung professionell – damit Sie sich um den Umzug kümmern können."
      />

      {/* Internal links */}
      <section className="py-10 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 mb-4">Weitere Standorte</p>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              { label: "Umzugsreinigung Zürich", href: "/umzugsreinigung-zuerich" },
              { label: "Umzugsreinigung Dietikon", href: "/umzugsreinigung-dietikon" },
              { label: "Umzugsreinigung Schlieren", href: "/umzugsreinigung-schlieren" },
              { label: "Umzugsreinigung Limmattal", href: "/umzugsreinigung-limmattal" },
            ]
              .filter((l) => !l.href.includes(slug))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="bg-gray-50 hover:bg-blue-50 border border-gray-200 text-gray-600 hover:text-blue-700 text-sm font-medium px-4 py-2 rounded-full transition-colors"
                >
                  {link.label}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
