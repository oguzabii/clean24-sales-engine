"use client";

import { useEffect, useState } from "react";
import { APARTMENT_SIZE_LABELS, ADDON_KEYS } from "@/lib/constants";
import {
  MANUAL_REVIEW_NOTICE,
  MOVE_OUT_CATEGORY,
  SERVICE_CATEGORIES,
} from "@/lib/service-categories";
import AddOnSelector from "./AddOnSelector";
import LeadForm from "./LeadForm";
import type { CustomerQuoteResponseBody } from "@/lib/sales-engine-contract";
import { formatRichtpreis, moveOutRichtpreis, quoteRichtpreis } from "@/lib/richtpreis";
import type { InquiryQuoteSelection } from "@/lib/inquiry-pricing-input";
import { SIDEBAR_COPY, introFor } from "./quote-copy";
import {
  CATEGORY_ICONS,
  IconArrowLeft,
  IconArrowRight,
  IconBolt,
  IconBuilding,
  IconCheck,
  IconChevronRight,
  IconHome,
  IconInfo,
} from "./icons";
import QuoteStepper from "./QuoteStepper";
import QuoteSidebar from "./QuoteSidebar";
import QuoteSummary, { type SummaryRow } from "./QuoteSummary";

type Step = "category" | "size" | "addons" | "contact";

interface CalcState {
  /** Selected service category ("" until chosen on the first step). */
  category: string;
  apartment_size: string;
  property_type: string;
  addons: Record<string, boolean>;
  express: boolean;
}

const PROPERTY_TYPES: { key: string; label: string; sub: string; icon: "home" | "building" }[] = [
  { key: "wohnung", label: "Wohnung", sub: "Apartment, Loft, etc.", icon: "building" },
  { key: "haus", label: "Haus", sub: "Einfamilienhaus, Reihenhaus, etc.", icon: "home" },
];

const STEP_LABELS: Record<Step, string> = {
  category: "Reinigung wählen",
  size: "Details angeben",
  addons: "Zusatzleistungen",
  contact: "Kontakt & Termin",
};

const initialAddons: Record<string, boolean> = ADDON_KEYS.reduce((acc, k) => {
  acc[k] = false;
  return acc;
}, {} as Record<string, boolean>);

const INITIAL_STATE: CalcState = {
  category: "",
  apartment_size: "3.5",
  property_type: "wohnung",
  addons: { ...initialAddons },
  express: false,
};

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2.5 h-[52px] px-7 rounded-lg bg-navy-900 text-white text-[15px] font-semibold transition-colors duration-200 hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2";
const BTN_BACK =
  "inline-flex items-center gap-2 h-[52px] px-4 text-[14.5px] text-slate-500 transition-colors duration-200 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded-lg";

/** Splits "2.5 Zimmer" into ["2.5", "Zimmer"] without altering the label. */
function splitSizeLabel(label: string): [string, string] {
  const m = label.match(/^(.*?)\s+(Zimmer)$/);
  return m ? [m[1], m[2]] : [label, ""];
}

export default function PriceCalculator() {
  const [step, setStep] = useState<Step>("category");
  const [state, setState] = useState<CalcState>(INITIAL_STATE);

  // Keep the approved step flow; ranges do not decide the binding OS price.
  const isMoveOut = state.category === MOVE_OUT_CATEGORY;

  const selectCategory = (value: string) => {
    setInquiryPricingInputs(value === "other_cleaning" ? { pricing_inputs: {} } : null);
    clearQuote();
    setState((prev) => ({ ...prev, category: value }));
    setStep(value === MOVE_OUT_CATEGORY ? "size" : "contact");
  };

  const [osQuote, setOsQuote] = useState<CustomerQuoteResponseBody | null>(null);
  const [quoteToken, setQuoteToken] = useState<string | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [inquiryPricingInputs, setInquiryPricingInputs] = useState<InquiryQuoteSelection | null>(null);

  const clearQuote = () => {
    setOsQuote(null);
    setQuoteToken(null);
    setQuoteError(null);
  };

  const updateInquiryPricing = (input: InquiryQuoteSelection | null) => {
    clearQuote();
    setInquiryPricingInputs(input);
  };

  useEffect(() => {
    if (!state.category || (!isMoveOut && !inquiryPricingInputs)) return;
    const controller = new AbortController();
    const serviceInput = isMoveOut ? {
      service_category: "move_out_cleaning",
      apartment_size: state.apartment_size,
      property_type: state.property_type,
      addons: state.addons,
      express: state.express,
      balcony: Boolean(state.addons.balcony),
      cellar: Boolean(state.addons.cellar),
      oven_heavy: Boolean(state.addons.oven_heavy),
      blinds: Boolean(state.addons.blinds),
      pricing_inputs: {},
    } : {
      service_category: state.category,
      ...inquiryPricingInputs,
    };
    void fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceInput),
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (controller.signal.aborted) return;
        if (!response.ok || !data.quote || !data.quote_token) {
          throw new Error(data.error ?? "Preis konnte momentan nicht berechnet werden.");
        }
        setOsQuote(data.quote as CustomerQuoteResponseBody);
        setQuoteToken(data.quote_token as string);
        setQuoteError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setOsQuote(null);
        setQuoteToken(null);
        setQuoteError(error instanceof Error ? error.message : "Preis konnte momentan nicht berechnet werden.");
      });
    return () => controller.abort();
  }, [isMoveOut, state.category, state.apartment_size, state.property_type, state.addons, state.express, inquiryPricingInputs]);

  // Synchronous approved guidance survives OS outages; submission still needs OS.
  const pricing = isMoveOut ? moveOutRichtpreis(state) : quoteRichtpreis(osQuote);

  const setApartmentSize = (key: string) => {
    if (state.apartment_size === key) return;
    clearQuote();
    setState((prev) => ({ ...prev, apartment_size: key }));
  };

  const setPropertyType = (key: string) => {
    if (state.property_type === key) return;
    clearQuote();
    setState((prev) => ({ ...prev, property_type: key }));
  };

  const setAddon = (key: string, value: boolean) => {
    if (state.addons[key] === value) return;
    clearQuote();
    setState((prev) => ({ ...prev, addons: { ...prev.addons, [key]: value } }));
  };

  const setExpress = (value: boolean) => {
    if (state.express === value) return;
    clearQuote();
    setState((prev) => ({ ...prev, express: value }));
  };

  // Non-move-out inquiries skip size/add-ons: category → contact.
  const steps: Step[] =
    state.category && !isMoveOut
      ? ["category", "contact"]
      : ["category", "size", "addons", "contact"];
  const stepIndex = steps.indexOf(step);

  // Active indicators replacing per-line CHF breakdown
  const addonsCount = Object.values(state.addons).filter(Boolean).length;

  const selectedCategory = SERVICE_CATEGORIES.find((c) => c.value === state.category) ?? null;
  const sidebarCopy = SIDEBAR_COPY[step] ?? SIDEBAR_COPY.category;
  const isFinal = step === "contact";

  /**
   * Incomplete input is not an OS manual-review decision — these four states
   * mirror the live engine exactly; only their presentation changed.
   */
  const notice =
    state.category && !pricing
      ? {
          title:
            osQuote?.pricing_mode === "manual_review"
              ? "Individuelle Offerte"
              : quoteError
                ? "Richtpreis nicht verfügbar"
                : inquiryPricingInputs
                  ? "Richtpreis wird ermittelt"
                  : "Angaben unvollständig",
          body:
            osQuote?.pricing_mode === "manual_review"
              ? MANUAL_REVIEW_NOTICE
              : quoteError
                ? "Bitte versuchen Sie es nochmals."
                : inquiryPricingInputs
                  ? "Ihre Angaben werden geprüft."
                  : "Für den Richtpreis fehlen noch Angaben zur Reinigung.",
        }
      : null;

  /** Live summary rows — all read from existing wizard state. */
  const summaryRows: SummaryRow[] = isMoveOut
    ? [
        {
          label: "Objektart",
          value: PROPERTY_TYPES.find((p) => p.key === state.property_type)?.label ?? "",
          icon: "home",
        },
        {
          label: "Wohnungsgrösse",
          value: APARTMENT_SIZE_LABELS[state.apartment_size] ?? "",
          icon: "window",
        },
        ...(step === "addons" || step === "contact"
          ? [
              {
                label: "Zusatzleistungen",
                value: addonsCount > 0 ? `${addonsCount} ausgewählt` : "Keine",
                icon: "plus" as const,
              },
            ]
          : []),
        { label: "Express-Termin", value: state.express ? "Ja" : "Nein", icon: "bolt" },
      ]
    : [];

  const summary = (
    <QuoteSummary
      categoryValue={state.category || null}
      categoryLabel={selectedCategory?.label ?? null}
      rows={summaryRows}
      price={pricing ? formatRichtpreis(pricing) : undefined}
      priceLabel={
        pricing?.amount_basis === "monthly" ? "Monatlicher Richtpreis" : "Aktueller Richtpreis"
      }
      notice={notice}
      finalStep={isFinal}
      onEdit={() => setStep(isMoveOut ? "size" : "category")}
    />
  );

  return (
    <div id="calculator">
      {/* ---- Stepper ---- */}
      <div className="mx-auto max-w-3xl px-1">
        <QuoteStepper labels={steps.map((s) => STEP_LABELS[s])} current={stepIndex} />
      </div>

      <div
        className={`mt-10 lg:mt-12 grid gap-8 xl:gap-10 ${
          isFinal
            ? "lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]"
            : "lg:grid-cols-[260px_minmax(0,1fr)_300px] xl:grid-cols-[300px_minmax(0,1fr)_320px]"
        }`}
      >
        {/* ---- Left: explanatory column (not on the final step) ---- */}
        {!isFinal && (
          <div className="hidden lg:block">
            <QuoteSidebar
              stepLabel={`Schritt ${stepIndex + 1} von ${steps.length}`}
              copy={sidebarCopy}
            />
          </div>
        )}

        {/* ---- Center: the active step ---- */}
        <div className="min-w-0">
          {/* Mobile heading (the left column is desktop-only) */}
          {!isFinal && (
            <div className="lg:hidden mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Schritt {stepIndex + 1} von {steps.length}
              </p>
              <h1 className="mt-2.5 text-[24px] sm:text-[27px] font-semibold tracking-[-0.02em] leading-[1.15] text-ink">
                {sidebarCopy.heading}
              </h1>
              <p className="mt-3 text-[14.5px] leading-relaxed text-slate-600">
                {sidebarCopy.body}
              </p>
            </div>
          )}

          {/* Live engine error surfaced inline; wording unchanged. */}
          {quoteError && (
            <p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
              {quoteError}
            </p>
          )}

          {/* Step 1: category */}
          {step === "category" && (
            <div className="c24-step grid sm:grid-cols-2 gap-3.5">
              {SERVICE_CATEGORIES.map((cat) => {
                const active = state.category === cat.value;
                const Icon = CATEGORY_ICONS[cat.value] ?? IconHome;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectCategory(cat.value)}
                    className={`group relative text-left rounded-2xl border p-5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 ${
                      active
                        ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30"
                        : "border-slate-200 bg-white hover:border-teal-400 hover:shadow-[0_2px_10px_rgba(12,29,51,0.05)]"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 text-white">
                        <IconCheck className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-600 mb-4">
                      <Icon className="w-[22px] h-[22px]" />
                    </span>
                    <span className="block text-[15.5px] font-semibold text-ink leading-snug pr-6">
                      {cat.label}
                    </span>
                    <span className="mt-1 flex items-end justify-between gap-3">
                      <span className="block text-[12.5px] text-slate-500 leading-snug">
                        {cat.description}
                      </span>
                      {!active && (
                        <IconChevronRight className="w-4 h-4 flex-shrink-0 text-slate-300 group-hover:text-teal-500 transition-colors duration-200" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Objektart + Grösse + Express (move-out only) */}
          {step === "size" && (
            <div className="c24-step rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-semibold text-ink">Objektart</h2>
                <IconInfo className="w-4 h-4 text-slate-300" />
              </div>
              <p className="mt-1 text-[13px] text-slate-500">
                Um welche Art von Objekt handelt es sich?
              </p>
              <div className="mt-4 grid sm:grid-cols-2 gap-3.5">
                {PROPERTY_TYPES.map((pt) => {
                  const active = state.property_type === pt.key;
                  const Icon = pt.icon === "home" ? IconHome : IconBuilding;
                  return (
                    <button
                      key={pt.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPropertyType(pt.key)}
                      className={`relative text-left rounded-xl border p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 ${
                        active
                          ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30"
                          : "border-slate-200 bg-white hover:border-teal-400"
                      }`}
                    >
                      {active && (
                        <span className="absolute top-3.5 right-3.5 flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white">
                          <IconCheck className="w-3 h-3" />
                        </span>
                      )}
                      <Icon className="w-6 h-6 text-teal-600" />
                      <span className="mt-3 block text-[15px] font-semibold text-ink">
                        {pt.label}
                      </span>
                      <span className="block text-[12px] text-slate-500 mt-0.5 leading-snug">
                        {pt.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <h2 className="text-[16px] font-semibold text-ink">Wohnungsgrösse</h2>
                <p className="mt-1 text-[13px] text-slate-500">
                  Wie viele Zimmer hat Ihre Wohnung?
                </p>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {Object.entries(APARTMENT_SIZE_LABELS).map(([key, label]) => {
                    const active = state.apartment_size === key;
                    const [num, unit] = splitSizeLabel(label);
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        aria-label={label}
                        onClick={() => setApartmentSize(key)}
                        className={`relative rounded-xl border py-3.5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2 ${
                          active
                            ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30"
                            : "border-slate-200 bg-white hover:border-teal-400"
                        }`}
                      >
                        {active && (
                          <span className="absolute top-2 right-2 flex items-center justify-center w-4 h-4 rounded-full bg-teal-500 text-white">
                            <IconCheck className="w-2.5 h-2.5" />
                          </span>
                        )}
                        <span className="block text-[17px] font-semibold text-ink leading-none">
                          {num}
                        </span>
                        {unit && (
                          <span className="block text-[11.5px] text-slate-500 mt-1">{unit}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="mt-7 flex items-start gap-3.5 rounded-xl border border-slate-200 p-4 cursor-pointer transition-colors duration-200 hover:border-teal-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500/40">
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 text-teal-600">
                  <IconBolt className="w-[18px] h-[18px]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold text-ink">
                    Express-Termin gewünscht (24 – 48h)
                  </span>
                  <span className="block text-[12.5px] text-slate-500 mt-0.5 leading-snug">
                    Wir prüfen die schnellstmögliche Verfügbarkeit in Ihrer Region.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={state.express}
                  onChange={(e) => setExpress(e.target.checked)}
                  className="sr-only peer"
                />
                <span
                  aria-hidden
                  className="mt-1 flex-shrink-0 w-11 h-6 rounded-full bg-slate-200 transition-colors duration-200 relative peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:after:translate-x-5"
                />
              </label>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <IconInfo className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  Der angezeigte Preis ist ein Richtpreis. Der genaue Preis wird nach Prüfung
                  Ihrer Angaben in der Offerte bestätigt.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: add-ons */}
          {step === "addons" && (
            <div className="c24-step rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
              <h2 className="text-[16px] font-semibold text-ink">
                Wählen Sie Ihre Zusatzleistungen
              </h2>
              <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
                Die Standardreinigung ist bereits in Ihrem Richtpreis enthalten. Wählen Sie hier
                nur spezielle Zusatzleistungen, falls gewünscht.
              </p>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                <IconInfo className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-500 leading-relaxed">
                  <span className="font-medium text-slate-600">
                    Die folgende Grundreinigung ist immer inklusive:
                  </span>{" "}
                  Alle Wohnräume, Küche inkl. Backofen, Bad, WC, Fenster innen inkl. Rahmen,
                  Böden, Oberflächen und weitere Standardleistungen.
                </p>
              </div>

              <AddOnSelector
                values={state.addons}
                onChange={(key, value) => setAddon(key, value)}
              />
            </div>
          )}

          {/* Step 4: Kontakt & Termin (move-out) */}
          {step === "contact" && isMoveOut && (
            <div className="c24-step">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Schritt {stepIndex + 1} von {steps.length}
              </p>
              <h1 className="mt-2.5 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-ink">
                Ihre Kontaktdaten &amp; Wunschtermin
              </h1>
              <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
                Fast geschafft! Geben Sie uns noch einige Informationen, damit wir Ihnen die
                Offerte zustellen können.
              </p>
              <div className="mt-7">
                <LeadForm
                  serviceCategory={state.category}
                  prefilledData={{
                    apartment_size: state.apartment_size,
                    property_type: state.property_type,
                    addons: state.addons,
                    express: state.express,
                  }}
                  estimatedMin={pricing?.min}
                  estimatedMax={pricing?.max}
                  quoteToken={quoteToken ?? undefined}
                  onBack={() => setStep("addons")}
                />
              </div>
            </div>
          )}

          {/* Step 2 (non-move-out): inquiry details + contact */}
          {step === "contact" && !isMoveOut && (
            <div className="c24-step">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Schritt {stepIndex + 1} von {steps.length}
              </p>
              <h1 className="mt-2.5 text-[24px] sm:text-[28px] font-semibold tracking-[-0.02em] leading-[1.15] text-ink">
                {introFor(state.category).headline}
              </h1>
              <p className="mt-2 text-[14px] text-slate-600 leading-relaxed">
                {introFor(state.category).sub}
              </p>
              <div className="mt-7">
                <LeadForm
                  serviceCategory={state.category}
                  estimatedMin={pricing?.min}
                  estimatedMax={pricing?.max}
                  amountBasis={pricing?.amount_basis}
                  quoteToken={quoteToken ?? undefined}
                  onInquiryPricingChange={updateInquiryPricing}
                  onBack={() => setStep("category")}
                />
              </div>
            </div>
          )}

          {/* ---- Step navigation (the lead form carries its own submit) ---- */}
          {step !== "contact" && (
            <div className="mt-7 flex items-center justify-end gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(steps[stepIndex - 1])}
                  className={BTN_BACK}
                >
                  <IconArrowLeft className="w-4 h-4" />
                  Zurück
                </button>
              )}
              {step === "size" && (
                <button type="button" onClick={() => setStep("addons")} className={BTN_PRIMARY}>
                  Weiter zu Zusatzleistungen
                  <IconArrowRight className="w-[18px] h-[18px]" />
                </button>
              )}
              {step === "addons" && (
                <button type="button" onClick={() => setStep("contact")} className={BTN_PRIMARY}>
                  Weiter zu Kontakt &amp; Termin
                  <IconArrowRight className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---- Right: live summary ---- */}
        <div className={`min-w-0 ${state.category ? "" : "hidden lg:block"}`}>{summary}</div>
      </div>
    </div>
  );
}
