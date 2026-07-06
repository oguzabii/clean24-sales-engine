import { OfferScrollLink } from "@/components/OfferScrollLink";
import { COMPANY } from "@/lib/constants";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  showEmail?: boolean;
  showCalculator?: boolean;
  showPhone?: boolean;
  dark?: boolean;
}

export default function CTASection({
  title = "Bereit für Ihre stressfreie Wohnungsabgabe?",
  subtitle = "Berechnen Sie jetzt Ihren Richtpreis oder kontaktieren Sie uns direkt.",
  showEmail = true,
  showCalculator = true,
  showPhone = true,
  dark = true,
}: CTASectionProps) {
  return (
    <section className={`py-16 ${dark ? "bg-gray-900 text-white" : "bg-blue-600 text-white"}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
        <p className={`mb-8 max-w-2xl mx-auto ${dark ? "text-gray-400" : "text-blue-100"}`}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {showCalculator && (
            <OfferScrollLink
              href="/umzugsreinigung#offer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Richtpreis berechnen
            </OfferScrollLink>
          )}
          {showEmail && (
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors w-full sm:w-auto justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              E-Mail schreiben
            </a>
          )}
          {showPhone && (
            <a
              href={`tel:${COMPANY.phone}`}
              className={`inline-flex items-center gap-2 font-semibold px-8 py-4 rounded-xl transition-colors w-full sm:w-auto justify-center border ${
                dark ? "border-gray-600 text-gray-300 hover:text-white hover:border-gray-400" : "border-blue-200 text-white hover:bg-blue-700"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {COMPANY.phoneDisplay}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
