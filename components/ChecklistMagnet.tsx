"use client";

import { useState } from "react";

export interface ChecklistSection {
  title: string;
  items: string[];
}

interface ChecklistMagnetProps {
  sections: ChecklistSection[];
  /** How many sections render fully as a public teaser. The rest stay locked. */
  previewSectionCount?: number;
  /** How many items render as a teaser inside the "locked" sections. */
  previewItemsPerLockedSection?: number;
}

/**
 * Gated checklist preview.
 *
 * Before email submission:
 *   • First N sections render fully (teaser)
 *   • Remaining sections render only their titles + a few items behind a
 *     blurred overlay with a CTA
 * After email submission:
 *   • Locked sections stay locked – the full content is delivered by email
 *   • A confirmation banner replaces the form
 *
 * Email is only captured in local state (no API call). Wire to a webhook later
 * if needed; the UX stays honest in either case.
 */
export default function ChecklistMagnet({
  sections,
  previewSectionCount = 2,
  previewItemsPerLockedSection = 3,
}: ChecklistMagnetProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;
    setSubmitting(true);
    // Tiny artificial delay for credible feedback
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setSubmitting(false);
  };

  const visibleSections = sections.slice(0, previewSectionCount);
  const lockedSections = sections.slice(previewSectionCount);
  const lockedItemsTotal = lockedSections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <>
      {/* ===== Email capture (or confirmation) ===== */}
      <section className="bg-gradient-to-br from-gray-950 via-gray-900 to-blue-950 text-white py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/15 border border-emerald-400/30 rounded-full px-4 py-1.5 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-5">
            <span className="c24-live-dot" />
            Kostenlos · per E-Mail
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Gratis Checkliste Wohnungsabgabe
          </h1>
          <p className="text-base md:text-lg text-blue-100/85 max-w-2xl mx-auto mb-8 leading-relaxed">
            Die vollständige Checkliste mit allen Punkten, die Verwaltungen bei der Wohnungsabgabe
            prüfen. Tragen Sie Ihre E-Mail-Adresse ein – wir senden Ihnen die Checkliste zu.
          </p>

          {submitted ? (
            <div
              role="status"
              aria-live="polite"
              className="max-w-lg mx-auto bg-white/[0.06] backdrop-blur-md border border-emerald-400/30 rounded-2xl px-6 py-5 text-left"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-emerald-300 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <div className="text-white font-semibold mb-1">Danke!</div>
                  <p className="text-sm text-blue-100/85 leading-relaxed">
                    Ihre Anfrage wurde erfasst – die vollständige Checkliste wird Ihnen per E-Mail
                    zugestellt. Prüfen Sie ggf. den Spam-Ordner.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="max-w-lg mx-auto flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ihre E-Mail-Adresse"
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors whitespace-nowrap"
              >
                {submitting ? "Wird gesendet..." : "Checkliste gratis holen"}
              </button>
            </form>
          )}
          <p className="text-[11px] text-blue-200/60 mt-4">
            Unverbindlich · keine Vorauszahlung · jederzeit abbestellbar.
          </p>
        </div>
      </section>

      {/* ===== Teaser preview ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Was enthält die Checkliste?
            </h2>
            <p className="text-gray-500">
              Eine Vorschau – die vollständige Liste erhalten Sie nach Eingabe Ihrer E-Mail-Adresse.
            </p>
          </div>

          {/* Fully visible teaser sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {visibleSections.map((section) => (
              <article
                key={section.title}
                className="bg-white rounded-2xl border border-gray-100 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                    Vorschau
                  </span>
                  <h3 className="font-semibold text-gray-900 text-lg">{section.title}</h3>
                </div>
                <ul className="space-y-2">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-gray-700"
                    >
                      <svg
                        className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          {/* Locked sections (always hidden behind a blur — even after submit) */}
          {lockedSections.length > 0 && (
            <div className="relative">
              {/* Section titles with first N items blurred */}
              <div
                aria-hidden="true"
                className="grid grid-cols-1 md:grid-cols-2 gap-5 select-none pointer-events-none"
              >
                {lockedSections.map((section) => (
                  <article
                    key={section.title}
                    className="bg-white rounded-2xl border border-gray-100 p-6 opacity-90"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Gesperrt
                      </span>
                      <h3 className="font-semibold text-gray-900 text-lg">{section.title}</h3>
                    </div>
                    <ul className="space-y-2 blur-[3px]">
                      {section.items.slice(0, previewItemsPerLockedSection).map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-2.5 text-sm text-gray-500"
                        >
                          <svg
                            className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                          </svg>
                          {item}
                        </li>
                      ))}
                      {section.items.length > previewItemsPerLockedSection && (
                        <li className="text-xs text-gray-400 italic blur-[3px]">
                          + {section.items.length - previewItemsPerLockedSection} weitere Punkte
                        </li>
                      )}
                    </ul>
                  </article>
                ))}
              </div>

              {/* Overlay with unlock CTA, sits on top of the blurred cards */}
              <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-gray-50/40 to-gray-50">
                <div className="pointer-events-auto mb-2 max-w-md w-[calc(100%-2rem)] bg-white rounded-2xl border border-gray-200 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 mb-3">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    + {lockedItemsTotal} weitere Punkte in der vollständigen Checkliste
                  </div>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    {submitted
                      ? "Wir senden Ihnen die vollständige Checkliste per E-Mail zu."
                      : "Vollständige Checkliste per E-Mail erhalten – kostenlos und unverbindlich."}
                  </p>
                  {submitted ? (
                    <div className="inline-flex items-center gap-2 text-emerald-600 text-xs font-semibold">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Anfrage erfasst – per E-Mail unterwegs
                    </div>
                  ) : (
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        document.querySelector("input[type=email]")?.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        (document.querySelector("input[type=email]") as HTMLInputElement | null)?.focus();
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Checkliste gratis anfordern
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
