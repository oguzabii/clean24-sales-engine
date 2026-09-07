"use client";

import { useState, useMemo } from "react";
import { calculatePrice } from "@/lib/pricing";
import { APARTMENT_SIZE_LABELS, ADDON_KEYS } from "@/lib/constants";
import {
  MANUAL_REVIEW_NOTICE,
  MOVE_OUT_CATEGORY,
  SERVICE_CATEGORIES,
} from "@/lib/service-categories";
import { introFor } from "./quote-copy";
import AddOnSelector from "./AddOnSelector";
import LeadForm from "./LeadForm";

type Step = "category" | "size" | "addons" | "contact";

interface CalcState {
  /** Selected service category ("" until chosen on the first step). */
  category: string;
  apartment_size: string;
  property_type: string;
  addons: Record<string, boolean>;
  express: boolean;
}

const PROPERTY_TYPES: { key: string; label: string }[] = [
  { key: "wohnung", label: "Wohnung" },
  { key: "haus", label: "Haus" },
];

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

/* ---- Presentation primitives. Small radii, hairlines, no cards. ---- */
const HEADLINE =
  "text-[30px] sm:text-[36px] lg:text-[38px] xl:text-[42px] font-semibold tracking-[-0.025em] leading-[1.08] text-ink";
const SUBLINE = "mt-4 text-[15.5px] sm:text-[16px] leading-relaxed text-slate-600 max-w-[34rem]";
const EYELINE = "text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400";

const BTN_PRIMARY =
  "inline-flex items-center justify-center h-12 px-7 rounded-md bg-navy-900 text-white text-[15px] font-medium transition-colors duration-200 hover:bg-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2";
/** Compact option control (Objektart, Grösse) — a control, not a card. */
const OPTION_BASE =
  "h-12 px-4 rounded-md border text-[14.5px] font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2";
const OPTION_IDLE = "border-slate-300 text-ink hover:border-slate-400 hover:bg-mist";
const OPTION_ACTIVE = "border-navy-900 bg-navy-900 text-white";

export default function PriceCalculator() {
  const [step, setStep] = useState<Step>("category");
  const [state, setState] = useState<CalcState>(INITIAL_STATE);

  // Only Umzugsreinigung keeps the automatic Richtpreis flow (size → addons →
  // contact). Every other category is a short manual-review inquiry.
  const isMoveOut = state.category === MOVE_OUT_CATEGORY;

  const selectCategory = (value: string) => {
    setState((prev) => ({ ...prev, category: value }));
    setStep(value === MOVE_OUT_CATEGORY ? "size" : "contact");
  };

  const pricing = useMemo(
    () =>
      calculatePrice({
        apartment_size: state.apartment_size,
        addons: state.addons,
        express: state.express,
        property_type: state.property_type,
      }),
    [state]
  );

  const setApartmentSize = (key: string) =>
    setState((prev) => ({ ...prev, apartment_size: key }));

  const setPropertyType = (key: string) =>
    setState((prev) => ({ ...prev, property_type: key }));

  const setAddon = (key: string, value: boolean) =>
    setState((prev) => ({ ...prev, addons: { ...prev.addons, [key]: value } }));

  const setExpress = (value: boolean) =>
    setState((prev) => ({ ...prev, express: value }));

  // Non-move-out inquiries skip size/add-ons: category → contact.
  const steps: Step[] =
    state.category && !isMoveOut
      ? ["category", "contact"]
      : ["category", "size", "addons", "contact"];
  const stepIndex = steps.indexOf(step);

  // Active indicators replacing per-line CHF breakdown
  const addonsCount = Object.values(state.addons).filter(Boolean).length;

  const intro = introFor(state.category);
  const summary = [
    APARTMENT_SIZE_LABELS[state.apartment_size],
    ...(state.property_type === "haus" ? ["Haus"] : []),
    ...(addonsCount > 0
      ? [`${addonsCount} ${addonsCount === 1 ? "Zusatzleistung" : "Zusatzleistungen"}`]
      : []),
    ...(state.express ? ["Express"] : []),
  ].join(" · ");

  /** Editorial Richtpreis — a thin teal rule and type, never a banner. */
  const priceBlock = (
    <div className="mt-9 border-t-2 border-teal-500 pt-4">
      <div className={EYELINE}>Aktueller Richtpreis</div>
      <div className="mt-2 text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-ink tabular-nums leading-none">
        {pricing.display_min} – {pricing.display_max}
      </div>
      <div className="mt-2.5 text-[13px] text-slate-500">inkl. 8.1% MwSt. · unverbindlich</div>
      <div className="mt-1 text-[13px] text-slate-500">{summary}</div>
    </div>
  );

  return (
    <div id="calculator">
      {/* ---- Step meta: quiet wayfinding, never a progress dashboard ---- */}
      {stepIndex > 0 && (
        <div className="flex items-center justify-between gap-4 mb-7">
          <button
            type="button"
            onClick={() => setStep(steps[stepIndex - 1])}
            className="text-[13.5px] text-slate-500 hover:text-ink transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            ← Zurück
          </button>
          <span className="text-[12px] text-slate-400 tabular-nums">
            Schritt {stepIndex + 1} von {steps.length}
          </span>
        </div>
      )}

      {/* ---- Headline: the first useful question, then category-specific ---- */}
      <h1 className={HEADLINE}>
        {step === "category" ? "Was möchten Sie reinigen lassen?" : intro.headline}
      </h1>

      {step === "category" ? (
        <>
          <p className={SUBLINE}>
            Wählen Sie die passende Reinigung. Den Rest führen wir Schritt für Schritt mit Ihnen
            durch.
          </p>
          <p className="mt-3 text-[13.5px] text-slate-500">Kostenlos und unverbindlich.</p>
        </>
      ) : (
        <p className={SUBLINE}>{intro.sub}</p>
      )}

      {/* ---- Step 0: the hook — an editorial index of services ---- */}
      {step === "category" && (
        <ul className="mt-9 border-t border-slate-200">
          {SERVICE_CATEGORIES.map((cat) => (
            <li key={cat.value}>
              <button
                type="button"
                onClick={() => selectCategory(cat.value)}
                className="group w-full text-left flex items-center gap-5 py-4 border-b border-slate-200 transition-colors duration-200 hover:bg-mist focus:outline-none focus-visible:bg-mist focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600/40"
              >
                <span className="flex-1 min-w-0">
                  <span className="block text-[16.5px] font-medium text-ink leading-snug">
                    {cat.label}
                    {cat.value === MOVE_OUT_CATEGORY && (
                      <span className="ml-2.5 text-[12px] font-medium text-teal-600 whitespace-nowrap">
                        Richtpreis direkt
                      </span>
                    )}
                  </span>
                  <span className="block text-[13px] text-slate-500 mt-1 leading-snug">
                    {cat.description}
                  </span>
                </span>
                <svg
                  className="w-4 h-4 flex-shrink-0 text-slate-300 transition-all duration-200 group-hover:text-teal-600 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ---- Step 1: Objekt & Grösse (move-out only) ---- */}
      {step === "size" && (
        <div className="c24-step">
          <div className="mt-9">
            <div className={EYELINE}>Objektart</div>
            <div className="mt-3 flex gap-2.5">
              {PROPERTY_TYPES.map((pt) => {
                const active = state.property_type === pt.key;
                return (
                  <button
                    key={pt.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setPropertyType(pt.key)}
                    className={`${OPTION_BASE} ${active ? OPTION_ACTIVE : OPTION_IDLE} min-w-[7.5rem]`}
                  >
                    {pt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8">
            <div className={EYELINE}>Grösse</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {Object.entries(APARTMENT_SIZE_LABELS).map(([key, label]) => {
                const active = state.apartment_size === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setApartmentSize(key)}
                    className={`${OPTION_BASE} ${active ? OPTION_ACTIVE : OPTION_IDLE}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="mt-8 flex items-start gap-3.5 border-t border-slate-200 pt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={state.express}
              onChange={(e) => setExpress(e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] rounded-sm border-slate-300 accent-teal-600 flex-shrink-0"
            />
            <span className="min-w-0">
              <span className="block text-[14.5px] font-medium text-ink">
                Express-Termin gewünscht
              </span>
              <span className="block text-[13px] text-slate-500 mt-0.5">
                Ausführung innerhalb von 24–48 Stunden, nach Verfügbarkeit.
              </span>
            </span>
          </label>

          {priceBlock}

          <div className="mt-8">
            <button type="button" onClick={() => setStep("addons")} className={BTN_PRIMARY}>
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 2: Zusatzleistungen ---- */}
      {step === "addons" && (
        <div className="c24-step">
          <div className="mt-9">
            <div className={EYELINE}>Zusatzleistungen</div>
            <p className="mt-3 text-[14px] text-slate-600 leading-relaxed max-w-[34rem]">
              Standardleistungen sind bereits enthalten. Wählen Sie nur, was bei Ihnen zusätzlich
              anfällt.
            </p>
          </div>

          <AddOnSelector values={state.addons} onChange={(key, value) => setAddon(key, value)} />

          {priceBlock}

          <div className="mt-8">
            <button type="button" onClick={() => setStep("contact")} className={BTN_PRIMARY}>
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* ---- Step 3: Kontakt & Termin (move-out) ---- */}
      {step === "contact" && isMoveOut && (
        <div className="c24-step mt-10">
          <LeadForm
            serviceCategory={state.category}
            prefilledData={{
              apartment_size: state.apartment_size,
              property_type: state.property_type,
              addons: state.addons,
              express: state.express,
            }}
            estimatedMin={pricing.min}
            estimatedMax={pricing.max}
            onBack={() => setStep("addons")}
          />
        </div>
      )}

      {/* ---- Step 1 (non-move-out): inquiry details + contact ---- */}
      {step === "contact" && !isMoveOut && (
        <div className="c24-step">
          <p className="mt-7 border-l-2 border-teal-500 pl-4 text-[13.5px] text-slate-600 leading-relaxed max-w-[34rem]">
            {MANUAL_REVIEW_NOTICE}
          </p>
          <div className="mt-9">
            <LeadForm serviceCategory={state.category} onBack={() => setStep("category")} />
          </div>
        </div>
      )}
    </div>
  );
}
