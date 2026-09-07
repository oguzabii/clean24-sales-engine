import OfferStart from "@/components/OfferStart";
import FAQ from "@/components/FAQ";

type PageVariant = "umzugsreinigung" | "home";

/** Three factual principles. No icons in circles, no cards. */
const PRINCIPLES: { title: string; body: string }[] = [
  {
    title: "Klare Abläufe",
    body: "Sie senden Ihre Angaben, wir prüfen sie und melden uns mit Fixpreis bzw. Offerte und Terminvorschlag zurück.",
  },
  {
    title: "Persönlich erreichbar",
    body: "Fragen zu Ihrer Anfrage klären Sie direkt mit uns – telefonisch unter 044 516 19 23 oder per E-Mail.",
  },
  {
    title: "Abgabegarantie bei Umzugsreinigungen",
    body: "Wird die Wohnung wegen unserer Reinigungsleistung nicht abgenommen, kommen wir kostenlos zurück und beheben die beanstandeten Punkte.",
  },
];

const PROCESS = ["Anfrage", "Prüfung", "Offerte", "Reinigung"];

/**
 * FAQ focused on the objections a visitor has *before* sending an inquiry.
 * All copy is taken unchanged from the existing FAQ catalogue.
 */
const PRE_INQUIRY_FAQ = [
  {
    question: "Ist der Richtpreis verbindlich?",
    answer:
      "Nein, der Richtpreis bei Umzugsreinigungen ist ein unverbindlicher Schätzwert basierend auf Ihren Angaben. Nach Prüfung der Details erhalten Sie von uns einen verbindlichen Fixpreis. Dieser kann leicht vom Richtpreis abweichen – in der Regel bleibt er aber im angezeigten Bereich.",
  },
  {
    question: "Erhalte ich für jede Reinigung sofort einen Preis?",
    answer:
      "Bei Umzugsreinigungen erhalten Sie direkt eine unverbindliche Richtpreis-Spanne im Online-Rechner. Alle anderen Kategorien prüfen wir individuell – Sie senden uns Ihre Angaben, und wir melden uns mit einer passenden Offerte.",
  },
  {
    question: "Was bedeutet Abgabegarantie?",
    answer:
      "Die Abgabegarantie gilt für unsere Umzugsreinigungen: Wenn die Wohnung beim Abgabetermin nicht abgenommen wird und der Grund in unserer Reinigungsleistung liegt, kommen wir kostenlos zurück und beheben die beanstandeten Punkte. Ihre Kaution ist damit geschützt. Für andere Reinigungsarten gilt die Abgabegarantie nicht.",
  },
  {
    question: "Wie bezahle ich?",
    answer:
      "Nach der Reinigung erhalten Sie eine Rechnung per E-Mail. Bezahlung per Banküberweisung oder Twint. Vorauszahlung ist nicht erforderlich.",
  },
  {
    question: "Kann ich Fotos zu meiner Anfrage hochladen?",
    answer:
      "Ja, Sie können Ihrer Anfrage optional Fotos oder ein PDF beilegen. Das hilft uns, den Aufwand realistisch einzuschätzen. Nach Prüfung Ihrer Angaben meldet sich Clean24 mit einer strukturierten Rückmeldung bei Ihnen.",
  },
  {
    question: "In welchen Gebieten sind Sie tätig?",
    answer:
      "Unser Einsatzgebiet umfasst Zürich Stadt, das gesamte Limmattal (Dietikon, Schlieren, Urdorf, Spreitenbach, Weiningen) und die weitere Umgebung. Bei Fragen zu Ihrem Standort erreichen Sie uns telefonisch unter 044 516 19 23 oder per E-Mail an info@clean-24.ch.",
  },
];

/** One short paragraph of context, kept deliberately subordinate. */
const CLOSING_TEXT: Record<PageVariant, string> = {
  home: "Clean24 Memis GmbH ist eine Reinigungsfirma aus Dietikon. Wir übernehmen Umzugsreinigungen mit Abgabegarantie sowie Privat-, Büro-, Bau-, Fenster- und Spezialreinigungen in Zürich, im Limmattal und in der weiteren Umgebung.",
  umzugsreinigung:
    "Clean24 Memis GmbH ist eine Reinigungsfirma aus Dietikon. Wir reinigen Wohnungen vor der Abgabe nach Schweizer Standard, begleiten den Übergabetermin und klären reinigungsbezogene Punkte direkt mit Verwaltung oder Vermieter – in Zürich, im Limmattal und in der weiteren Umgebung.",
};

/**
 * The public quotation experience.
 *
 * The quotation itself opens the page; everything below exists only to reduce
 * purchase anxiety and is deliberately short. The marketing sections that used
 * to sit between the visitor and the form (LiveOperations, ActivityTicker,
 * ComparisonSection, ForWhomSection, StandardVsExtra, ChecklistLeadMagnet,
 * GuaranteeExplainer, TrustBadges, ServiceOverview, ServiceAreaChips,
 * IncludedServices, ProcessSteps, CTASection, StickyMobileCTA) are no longer
 * part of this composition. Those components remain in the repository.
 */
export default function UmzugsreinigungPageContent({
  variant = "umzugsreinigung",
}: {
  variant?: PageVariant;
}) {
  return (
    <>
      {/* ===== The quotation experience ===== */}
      <OfferStart />

      {/* ===== Was Sie von Clean24 erwarten können ===== */}
      <section className="bg-mist border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-20 lg:py-28">
          <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-semibold tracking-[-0.025em] leading-[1.1] text-ink max-w-xl">
            Was Sie von Clean24 erwarten können
          </h2>

          <div className="mt-12 lg:mt-16 grid gap-10 sm:gap-12 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="border-t border-slate-300 pt-5">
                <h3 className="text-[17px] font-medium text-ink leading-snug">{p.title}</h3>
                <p className="mt-3 text-[14.5px] text-slate-600 leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>

          {/* Compact process — a single line, not four cards. */}
          <div className="mt-16 lg:mt-20 border-t border-slate-300 pt-5">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
              Ablauf
            </div>
            <ol className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] text-ink">
              {PROCESS.map((label, i) => (
                <li key={label} className="flex items-center gap-3">
                  {i > 0 && (
                    <span aria-hidden className="text-slate-300">
                      →
                    </span>
                  )}
                  <span>{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ===== Compact FAQ — pre-inquiry objections only ===== */}
      <FAQ
        items={PRE_INQUIRY_FAQ}
        title="Bevor Sie anfragen"
        subtitle="Die Fragen, die vor einer Anfrage am häufigsten gestellt werden."
      />

      {/* ===== Short closing context ===== */}
      <section className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-12">
          <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-3xl">
            {CLOSING_TEXT[variant]}
          </p>
        </div>
      </section>
    </>
  );
}
