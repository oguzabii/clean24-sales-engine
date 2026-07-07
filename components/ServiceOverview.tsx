import { OfferScrollLink } from "@/components/OfferScrollLink";
import { MOVE_OUT_CATEGORY, SERVICE_CATEGORIES } from "@/lib/service-categories";

/**
 * Compact overview of all Clean24 service categories. Labels and one-line
 * descriptions come from lib/service-categories.ts (single source of truth);
 * "other_cleaning" is a form-only fallback and not shown here.
 */
const OVERVIEW_CATEGORIES = SERVICE_CATEGORIES.filter(
  (cat) => cat.value !== "other_cleaning",
);

export default function ServiceOverview() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div data-reveal className="text-center mb-14 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs font-semibold mb-4 uppercase tracking-wider">
            Unsere Leistungen
          </div>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Eine Anfrage – die passende Reinigung.
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Für Umzug, Privat, Büro, Bau, Fenster und Spezialreinigungen. Wählen Sie die passende
            Reinigung und senden Sie uns Ihre Anfrage online.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {OVERVIEW_CATEGORIES.map((cat) => {
            const isMoveOut = cat.value === MOVE_OUT_CATEGORY;
            return (
              <div
                key={cat.value}
                data-reveal
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_12px_32px_rgba(30,64,175,0.08)] hover:-translate-y-0.5 hover:border-blue-100 transition-all duration-300"
              >
                <h3 className="font-semibold text-gray-900 mb-2 text-base leading-snug">
                  {cat.label}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{cat.description}</p>
                {isMoveOut ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Abgabegarantie · Richtpreis sofort
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-[11px] font-semibold uppercase tracking-wider rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    Individuelle Offerte
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div data-reveal className="mt-10 text-center max-w-2xl mx-auto">
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Bei Umzugsreinigungen erhalten Sie eine Richtpreis-Spanne; andere Reinigungen prüfen
            wir individuell.
          </p>
          <OfferScrollLink
            href="#offer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
          >
            Kategorie wählen und Anfrage senden
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </OfferScrollLink>
        </div>
      </div>
    </section>
  );
}
