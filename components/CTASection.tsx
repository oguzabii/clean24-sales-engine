import { OfferScrollLink } from "@/components/OfferScrollLink";
import { COMPANY } from "@/lib/constants";

interface CTASectionProps {
  title?: string;
  subtitle?: string;
  /** Label of the calculator button; keep "Richtpreis berechnen" where the CTA leads to move-out pricing. */
  calculatorLabel?: string;
  calculatorHref?: string;
  showEmail?: boolean;
  showCalculator?: boolean;
  showPhone?: boolean;
  dark?: boolean;
}

export default function CTASection({
  title = "Bereit für Ihre stressfreie Wohnungsabgabe?",
  subtitle = "Berechnen Sie jetzt Ihren Richtpreis oder kontaktieren Sie uns direkt.",
  calculatorLabel = "Richtpreis berechnen",
  calculatorHref = "/umzugsreinigung#offer",
  showEmail = true,
  showCalculator = true,
  showPhone = true,
  dark = true,
}: CTASectionProps) {
  return (
    <section className={`py-16 ${dark ? "bg-[#0b1f33] text-white" : "bg-[#eef5f7] text-[#0b1f33]"}`}>
      <div className="container-page max-w-4xl text-center">
        <h2 className="mb-4 text-2xl font-bold md:text-3xl">{title}</h2>
        <p className={`mx-auto mb-8 max-w-2xl ${dark ? "text-slate-300" : "text-slate-600"}`}>
          {subtitle}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {showCalculator && (
            <OfferScrollLink
              href={calculatorHref}
              className="c24-button-primary w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {calculatorLabel}
            </OfferScrollLink>
          )}
          {showEmail && (
            <a
              href={`mailto:${COMPANY.email}`}
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-lg bg-[#1f9b8f] px-8 py-4 font-semibold text-white transition-colors hover:bg-[#0f766e] sm:w-auto"
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
              className={`inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-lg border px-8 py-4 font-semibold transition-colors sm:w-auto ${
                dark ? "border-white/25 text-slate-200 hover:border-white/45 hover:text-white" : "border-[#b8d5d8] text-[#0b1f33] hover:bg-white"
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
