import { OfferScrollLink } from "@/components/OfferScrollLink";
import Image from "next/image";
import OfferStart from "@/components/OfferStart";
import FAQ from "@/components/FAQ";
import CTASection from "@/components/CTASection";
import GuaranteeExplainer from "@/components/GuaranteeExplainer";
import IncludedServices from "@/components/IncludedServices";
import StickyMobileCTA from "@/components/StickyMobileCTA";
import RevealOnScroll from "@/components/RevealOnScroll";

type PageVariant = "umzugsreinigung" | "home";

/**
 * Copy that differs between the generalized homepage ("home": Clean24 as
 * Reinigungsservice für alle Kategorien) and the dedicated Umzugsreinigung
 * sales/SEO page ("umzugsreinigung": unchanged, conversion-specific).
 * Abgabegarantie is only ever claimed for Umzugsreinigung.
 */
const VARIANT_COPY = {
  umzugsreinigung: {
    badge: "Clean24 System · Umzugsreinigung",
    heroLead: "Sauberkeit mit System.",
    heroGradient: "Von Anfang an.",
    heroTail: "",
    heroP1:
      "Sie geben uns die wichtigsten Angaben. Clean24 übernimmt den weiteren Ablauf.",
    heroP2:
      "Für Umzugsreinigungen erhalten Sie direkt einen Richtpreis. Die Abgabegarantie gilt ausschliesslich für Umzugsreinigungen.",
    primaryCta: "Anfrage starten",
    secondaryCta: "Richtpreis erhalten",
    ctaMicrocopy:
      "Wenige Angaben. Klarer nächster Schritt. Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.",
    cardHeading: (
      <>
        Ihre Wohnungsabgabe –<br />stressfrei vorbereitet.
      </>
    ),
    cardBullets: [
      { title: "Richtpreis nach Angaben", sub: "Sofort sichtbar im Online-Rechner." },
      { title: "Abgabegarantie", sub: "Direkte Klärung reinigungsbezogener Punkte." },
      { title: "Termin nach Verfügbarkeit", sub: "Express 24–48h auf Anfrage." },
      { title: "Offerte nach Prüfung", sub: "Kostenlos und unverbindlich." },
      { title: "Erreichbar per Telefon & E-Mail", sub: "044 516 19 23 · info@clean-24.ch" },
    ],
    cardMiniList: [
      "Richtpreis nach Angaben",
      "Offerte nach Prüfung",
      "Sofortige Eingangsbestätigung",
      "Strukturierte Rückmeldung",
    ],
    ctaSectionTitle: "Bereit für Ihre stressfreie Wohnungsabgabe?",
    ctaSectionSubtitle:
      "Starten Sie Ihre Anfrage. Clean24 übernimmt den weiteren Ablauf.",
    ctaSectionCalculatorLabel: "Richtpreis berechnen",
  },
  home: {
    badge: "Clean24 System · Reinigungsanfrage",
    heroLead: "Ihre Reinigung.",
    heroGradient: "Unser System.",
    heroTail: "",
    heroP1:
      "Sie geben uns die wichtigsten Angaben. Clean24 übernimmt den weiteren Ablauf.",
    heroP2:
      "Umzugsreinigungen mit Richtpreis und Abgabegarantie. Andere Reinigungen prüfen wir individuell.",
    primaryCta: "Anfrage starten",
    secondaryCta: "Richtpreis erhalten",
    ctaMicrocopy:
      "Wenige Angaben. Klarer nächster Schritt. Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.",
    cardHeading: (
      <>
        Ihre Reinigungsanfrage –<br />strukturiert erledigt.
      </>
    ),
    cardBullets: [
      { title: "Richtpreis bei Umzugsreinigung", sub: "Sofort sichtbar im Online-Rechner." },
      { title: "Abgabegarantie bei Umzugsreinigung", sub: "Direkte Klärung reinigungsbezogener Punkte." },
      { title: "Individuelle Offerte", sub: "Für Privat-, Büro-, Bau- und Spezialreinigungen." },
      { title: "Termin nach Verfügbarkeit", sub: "Express 24–48h auf Anfrage." },
      { title: "Erreichbar per Telefon & E-Mail", sub: "044 516 19 23 · info@clean-24.ch" },
    ],
    cardMiniList: [
      "Richtpreis oder individuelle Offerte",
      "Fotos optional hochladen",
      "Sofortige Eingangsbestätigung",
      "Strukturierte Rückmeldung",
    ],
    ctaSectionTitle: "Bereit für Ihre Reinigungsanfrage?",
    ctaSectionSubtitle:
      "Starten Sie Ihre Anfrage. Clean24 übernimmt den weiteren Ablauf.",
    ctaSectionCalculatorLabel: "Reinigung anfragen",
  },
} as const;

function SystemSignature() {
  const stages = ["ANFRAGE", "SYSTEM", "OFFERTE", "ENTSCHEIDUNG"];

  return (
    <div className="relative">
      <div className="rounded-md border border-navy-100 bg-white p-5 shadow-[0_28px_80px_-58px_rgba(6,16,29,0.9)] sm:p-7">
        <div className="mb-7 flex items-center justify-between gap-4 border-b border-navy-100 pb-5">
          <div>
            <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-teal-700">
              Clean24 System
            </div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-navy-950">
              Sauberkeit mit System.
            </div>
          </div>
          <div className="h-10 w-10 border border-navy-100 bg-mist" aria-hidden />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] sm:items-center">
          {stages.map((stage, index) => (
            <div key={stage} className="contents">
              <div
                className={`relative min-h-24 border p-4 ${
                  stage === "SYSTEM"
                    ? "border-navy-900 bg-navy-950 text-white"
                    : "border-navy-100 bg-mist text-navy-950"
                }`}
              >
                <div className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-4 text-sm font-semibold uppercase tracking-[0.12em]">
                  {stage}
                </div>
                {stage === "SYSTEM" ? (
                  <div className="absolute inset-x-4 bottom-4 h-px bg-gradient-to-r from-transparent via-teal-300 to-transparent" />
                ) : null}
              </div>
              {index < stages.length - 1 ? (
                <div className="hidden h-px w-8 bg-navy-200 sm:block" aria-hidden />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <div className="h-px bg-navy-100" />
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-navy-400">
            klar weiter
          </span>
          <div className="h-px bg-navy-100" />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-md border border-white shadow-[0_20px_60px_-48px_rgba(6,16,29,0.8)]">
        <Image
          src="/clean24-editorial-cleaning.png"
          alt="Clean24 Reinigung in einer hellen Wohnung"
          width={1536}
          height={864}
          priority
          className="aspect-[16/7] w-full object-cover"
        />
      </div>
    </div>
  );
}

/**
 * Shared body of the premium Clean24 sales page.
 * Rendered by both `/` (homepage, variant "home": generalized Reinigungsservice
 * copy + service overview) and `/umzugsreinigung` (variant "umzugsreinigung":
 * the unchanged Umzugsreinigung sales page) without duplicating JSX.
 */
export default function UmzugsreinigungPageContent({
  variant = "umzugsreinigung",
}: {
  variant?: PageVariant;
}) {
  const copy = VARIANT_COPY[variant];

  return (
    <>
      <RevealOnScroll />

      {/* ===== Clean24 System hero ===== */}
      <section className="relative overflow-hidden bg-mist pt-18 md:pt-20">
        <div className="absolute inset-x-0 top-0 h-40 bg-white" aria-hidden />
        <div className="container-page relative py-10 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:gap-16">
            <div data-reveal>
              <div className="c24-eyebrow mb-5">
                {copy.badge}
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-navy-950 sm:text-5xl lg:text-[4.6rem]">
                {copy.heroLead}
                <br />
                <span className="text-teal-700">{copy.heroGradient}</span>
              </h1>
              <div className="mt-6 max-w-2xl space-y-3 text-base leading-7 text-slate-600 sm:text-lg">
                <p>{copy.heroP1}</p>
                <p className="text-sm leading-6 text-slate-500 sm:text-base">{copy.heroP2}</p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <OfferScrollLink href="#offer" className="c24-button-primary">
                  {copy.primaryCta}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </OfferScrollLink>
                <OfferScrollLink href="#offer" className="c24-button-secondary">
                  {copy.secondaryCta}
                </OfferScrollLink>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                {copy.ctaMicrocopy}
              </p>
            </div>

            <div data-reveal>
              <SystemSignature />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Entry point into the Clean24 System ===== */}
      <OfferStart />

      <section className="bg-white py-14">
        <div className="container-page">
          <div className="mx-auto max-w-3xl border-y border-navy-100 py-8 text-center">
            <div className="c24-eyebrow mb-3 justify-center">Clean24 System</div>
            <p className="text-2xl font-semibold leading-tight tracking-tight text-navy-950 md:text-3xl">
              Sie senden die Anfrage. Clean24 übernimmt den weiteren Ablauf.
            </p>
          </div>
        </div>
      </section>

      <GuaranteeExplainer />

      <IncludedServices />

      <FAQ />

      <CTASection
        title={copy.ctaSectionTitle}
        subtitle={copy.ctaSectionSubtitle}
        calculatorLabel={copy.ctaSectionCalculatorLabel}
        calculatorHref="#offer"
      />

      <StickyMobileCTA />
    </>
  );
}
