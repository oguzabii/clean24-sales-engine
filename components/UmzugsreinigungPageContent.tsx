import { OfferScrollLink } from "@/components/OfferScrollLink";
import OfferStart from "@/components/OfferStart";
import FAQ from "@/components/FAQ";
import ProcessSteps from "@/components/ProcessSteps";
import CTASection from "@/components/CTASection";
import TrustBadges from "@/components/TrustBadges";
import WhatsAppButton from "@/components/WhatsAppButton";
import LiveOperations from "@/components/LiveOperations";
import ActivityTicker from "@/components/ActivityTicker";
import WhatsAppPhotoOffer from "@/components/WhatsAppPhotoOffer";
import GuaranteeExplainer from "@/components/GuaranteeExplainer";
import ComparisonSection from "@/components/ComparisonSection";
import ForWhomSection from "@/components/ForWhomSection";
import ServiceAreaChips from "@/components/ServiceAreaChips";
import StandardVsExtra from "@/components/StandardVsExtra";
import IncludedServices from "@/components/IncludedServices";
import ChecklistLeadMagnet from "@/components/ChecklistLeadMagnet";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import RevealOnScroll from "@/components/RevealOnScroll";

/**
 * Shared body of the premium Clean24 sales page.
 * Rendered by both `/` (homepage) and `/umzugsreinigung` so the new design is
 * the main public experience without duplicating JSX.
 */
export default function UmzugsreinigungPageContent() {
  return (
    <>
      <RevealOnScroll />

      {/* ===== Premium Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white">
        <div className="absolute inset-0 c24-bg-drift bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="pointer-events-none absolute -top-32 -right-20 w-[36rem] h-[36rem] rounded-full bg-blue-500/15 blur-3xl c24-glow" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/10 blur-3xl c24-glow" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
            {/* Left: messaging */}
            <div data-reveal>
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-blue-200 text-xs font-medium mb-6">
                <span className="c24-live-dot" />
                Mit Abgabegarantie · Heute aktiv
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight mb-5">
                Umzugsreinigung mit{" "}
                <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-emerald-300 bg-clip-text text-transparent">
                  Abgabegarantie
                </span>{" "}
                in der Schweiz.
              </h1>
              <p className="text-base sm:text-lg text-blue-100/85 leading-relaxed mb-3 max-w-xl">
                Wir reinigen Ihre Wohnung nach Schweizer Standard und begleiten den Übergabetermin
                vor Ort. Reinigungsbezogene Punkte klären wir direkt mit Verwaltung oder Vermieter.
              </p>
              <p className="text-sm text-blue-200/70 mb-8 max-w-xl">
                Einsätze in der ganzen Schweiz nach Verfügbarkeit. Zürich, Bern, Basel, Luzern,
                St. Gallen und weitere Regionen auf Anfrage.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                <OfferScrollLink
                  href="#offer"
                  className="group inline-flex items-center justify-center gap-3 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-bold text-base md:text-lg px-9 py-5 rounded-2xl transition-all shadow-[0_18px_40px_-12px_rgba(37,99,235,0.55)] hover:shadow-[0_22px_48px_-12px_rgba(59,130,246,0.7)] hover:-translate-y-0.5 ring-1 ring-white/15"
                >
                  Kostenlose Offerte erhalten
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </OfferScrollLink>
                <OfferScrollLink
                  href="#offer"
                  className="inline-flex items-center justify-center gap-2 text-blue-200 hover:text-white font-medium text-sm transition-colors underline decoration-blue-400/50 underline-offset-4 hover:decoration-white"
                >
                  Richtpreis in 60 Sekunden berechnen
                </OfferScrollLink>
              </div>
              <p className="text-xs text-blue-200/70 mb-8 max-w-md leading-relaxed">
                In 60 Sekunden Anfrage starten · Richtpreis berechnen und Offerte anfragen ·
                Ihre Angaben werden geprüft – anschliessend erhalten Sie eine klare Rückmeldung.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-blue-200/80">
                <WhatsAppButton variant="primary" label="Per WhatsApp anfragen" />
                <a href="tel:+41445161923" className="hover:text-white inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +41 44 516 19 23
                </a>
              </div>
            </div>

            {/* Right: advantage card — no public price; conversion/trust signals instead. */}
            <div data-reveal className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-blue-500/25 to-emerald-500/15 rounded-3xl blur-2xl pointer-events-none" />
              <div className="relative bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] uppercase tracking-widest text-blue-300/80 font-semibold">
                    Ihr Vorteil bei Clean24
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-tight mb-6">
                  Ihre Wohnungsabgabe –<br />stressfrei vorbereitet.
                </h2>

                <ul className="space-y-3.5 mb-6">
                  {[
                    { title: "Richtpreis nach Angaben", sub: "Sofort sichtbar im Online-Rechner." },
                    { title: "Abgabegarantie", sub: "Direkte Klärung reinigungsbezogener Punkte." },
                    { title: "Termin nach Verfügbarkeit", sub: "Express 24–48h auf Anfrage." },
                    { title: "Offerte nach Prüfung", sub: "Kostenlos und unverbindlich." },
                    { title: "WhatsApp-Fotoanfrage möglich", sub: "Schnelle Ersteinschätzung." },
                  ].map((bullet) => (
                    <li key={bullet.title} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white leading-snug">{bullet.title}</div>
                        <div className="text-xs text-blue-100/70 mt-0.5 leading-relaxed">{bullet.sub}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Replaces the old "Startpreis ab CHF 590" tile. Trust + conversion signals, no public price. */}
                <div className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 mb-4">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald-300 font-semibold">
                      <span className="c24-live-dot" />
                      Unverbindliche Anfrage
                    </div>
                    <OfferScrollLink
                      href="#offer"
                      className="text-xs font-semibold text-blue-300 hover:text-white whitespace-nowrap inline-flex items-center gap-1"
                    >
                      Jetzt starten
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </OfferScrollLink>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-blue-100/85">
                    {[
                      "Richtpreis nach Angaben",
                      "Offerte nach Prüfung",
                      "Sofortige Eingangsbestätigung",
                      "Strukturierte Rückmeldung",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[11px] text-blue-200/60 leading-relaxed">
                  Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Live operations + activity feed (unified dark) ===== */}
      <section className="py-12 lg:py-16 bg-gradient-to-b from-gray-950 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div data-reveal className="text-center mb-8 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-3">
              Live-Operations
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
              Aktiv. Organisiert. Verfügbar.
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed">
              Ein kurzer Einblick in unseren Betrieb – damit Sie wissen, was heute bei Clean24 läuft.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-5 items-stretch">
            <LiveOperations />
            <div data-reveal className="flex">
              <ActivityTicker />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Trust badges (Warum Clean24) ===== */}
      <TrustBadges />

      {/* ===== Region chips ===== */}
      <ServiceAreaChips />

      {/* ===== Abgabegarantie einfach erklärt ===== */}
      <GuaranteeExplainer />

      {/* ===== Mit / Ohne Clean24 ===== */}
      <ComparisonSection />

      {/* ===== Für wen? ===== */}
      <ForWhomSection />

      {/* ===== Was ist enthalten (grouped categories) ===== */}
      <IncludedServices />

      {/* ===== Standard vs Extra ===== */}
      <StandardVsExtra />

      {/* ===== Offer start (prominent CTA + calculator) ===== */}
      <OfferStart />

      {/* ===== WhatsApp photo offer ===== */}
      <WhatsAppPhotoOffer />

      {/* ===== Process steps ===== */}
      <ProcessSteps />

      {/* ===== Checklist lead magnet ===== */}
      <ChecklistLeadMagnet />

      {/* ===== FAQ ===== */}
      <FAQ />

      <CTASection />

      <StickyMobileCTA />
    </>
  );
}
