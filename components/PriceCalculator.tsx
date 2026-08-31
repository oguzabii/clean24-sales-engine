"use client";

import { useState, useMemo } from "react";
import { calculatePrice } from "@/lib/pricing";
import { APARTMENT_SIZE_LABELS, ADDON_KEYS } from "@/lib/constants";
import {
  MANUAL_REVIEW_NOTICE,
  MOVE_OUT_CATEGORY,
  SERVICE_CATEGORIES,
} from "@/lib/service-categories";
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

const MOVE_OUT_STEP_LABELS: Record<Step, string> = {
  category: "Leistung",
  size: "Objekt",
  addons: "Angaben",
  contact: "Kontakt",
};

const MANUAL_STEP_LABELS: Record<Step, string> = {
  category: "Leistung",
  size: "Objekt",
  addons: "Angaben",
  contact: "Kontakt",
};

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
  const stepLabels = isMoveOut ? MOVE_OUT_STEP_LABELS : MANUAL_STEP_LABELS;

  // Active indicators replacing per-line CHF breakdown
  const addonsCount = Object.values(state.addons).filter(Boolean).length;

  return (
    <div id="calculator" className="overflow-hidden rounded-md border border-navy-100 bg-white shadow-[0_28px_70px_-52px_rgba(6,16,29,0.8)]">
      {/* Progress */}
      <div className="border-b border-navy-100 bg-mist px-5 py-5 sm:px-7">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-teal-700">
            Clean24 System
          </span>
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-navy-400">
            Schritt {String(stepIndex + 1).padStart(2, "0")}
          </span>
        </div>
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <div
              key={s}
              className={`border-t pt-2 transition-colors ${
                i <= stepIndex ? "border-teal-500 text-navy-950" : "border-navy-100 text-navy-300"
              }`}
            >
              <div className="text-[0.62rem] font-semibold uppercase tracking-[0.14em]">
                {String(i + 1).padStart(2, "0")} {stepLabels[s]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Neutral notice for manual-review categories — no CHF range. */}
      {state.category && !isMoveOut && (
        <div className="bg-navy-950 px-5 py-5 text-white sm:px-7">
          <div className="mb-1 text-xs uppercase tracking-wider text-teal-200">
            Klarer nächster Schritt
          </div>
          <p className="text-sm leading-relaxed text-slate-100">{MANUAL_REVIEW_NOTICE}</p>
        </div>
      )}

      {/* Richtpreis range — move-out only. No per-line CHF itemisation.
          Selections still adjust the range; final price is confirmed after
          review. */}
      {isMoveOut && (
      <div className="bg-navy-950 px-5 py-5 text-white sm:px-7">
        <div className="mb-1 text-xs uppercase tracking-wider text-teal-200">
          Ihr Richtpreis (unverbindlich)
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
          {pricing.display_min} – {pricing.display_max}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />
            {APARTMENT_SIZE_LABELS[state.apartment_size]}
          </span>
          {state.property_type === "haus" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />
              Haus
            </span>
          )}
          {addonsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />
              {addonsCount} {addonsCount === 1 ? "Zusatzleistung" : "Zusatzleistungen"} berücksichtigt
            </span>
          )}
          {state.express && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-200" />
              Express berücksichtigt
            </span>
          )}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-300">
          Richtpreis, unverbindlich. Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
          Alle Preise inkl. 8.1% MwSt.
        </p>
      </div>
      )}

      <div className="p-5 sm:p-7">
        {/* Step 0: Category */}
        {step === "category" && (
          <div>
            <div className="c24-eyebrow mb-3">01 Leistung</div>
            <h3 className="mb-1 text-xl font-bold text-[#0b1f33]">
              Welche Reinigung benötigen Sie?
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-slate-500">
              Wählen Sie die passende Kategorie aus. Bei Umzugsreinigungen erhalten Sie direkt
              eine Richtpreis-Spanne, andere Anfragen prüfen wir individuell.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => selectCategory(cat.value)}
                  className={`c24-choice min-h-24 p-4 text-left ${
                    state.category === cat.value
                      ? "c24-choice-active"
                      : ""
                  }`}
                >
                  <div
                    className={`font-semibold text-sm ${
                      state.category === cat.value ? "text-[#0f766e]" : "text-[#0b1f33]"
                    }`}
                  >
                    {cat.label}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-slate-500">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Size (move-out only) */}
        {step === "size" && (
          <div>
            <div className="c24-eyebrow mb-3">02 Objekt</div>
            <h3 className="mb-1 text-xl font-bold text-[#0b1f33]">
              Wie gross ist Ihre Wohnung?
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              Anfrage starten · Objekt einordnen
            </p>

            <div className="mb-5">
              <div className="text-sm font-semibold text-[#0b1f33] mb-2">Objektart</div>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.key}
                    type="button"
                    onClick={() => setPropertyType(pt.key)}
                    className={`c24-choice min-h-20 p-4 text-left ${
                      state.property_type === pt.key
                        ? "c24-choice-active"
                        : ""
                    }`}
                  >
                    <div className={`font-semibold text-sm ${state.property_type === pt.key ? "text-[#0f766e]" : "text-[#0b1f33]"}`}>
                      {pt.label}
                    </div>
                    <div className={`text-[11px] mt-1 uppercase tracking-wider ${state.property_type === pt.key ? "text-[#1f7f78]" : "text-slate-400"}`}>
                      {state.property_type === pt.key ? "Ausgewählt" : "Auswählen"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {Object.entries(APARTMENT_SIZE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setApartmentSize(key)}
                  className={`c24-choice min-h-20 p-4 text-left ${
                    state.apartment_size === key
                      ? "c24-choice-active"
                      : ""
                  }`}
                >
                  <div className={`font-semibold text-sm ${state.apartment_size === key ? "text-[#0f766e]" : "text-[#0b1f33]"}`}>
                    {label}
                  </div>
                  <div className={`text-[11px] mt-1 uppercase tracking-wider ${state.apartment_size === key ? "text-[#1f7f78]" : "text-slate-400"}`}>
                    {state.apartment_size === key ? "Ausgewählt" : "Auswählen"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#dbe6ea] bg-[#f7fafb] p-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={state.express}
                  onChange={(e) => setExpress(e.target.checked)}
                  className="h-5 w-5 rounded text-[#1f9b8f]"
                />
                <span>Express-Termin gewünscht (24–48h)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("category")}
                className="c24-button-secondary flex-1"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep("addons")}
                className="c24-button-primary flex-grow"
              >
                Weiter: Zusatzleistungen
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add-ons */}
        {step === "addons" && (
          <div>
            <div className="c24-eyebrow mb-3">03 Angaben</div>
            <h3 className="mb-1 text-xl font-bold text-[#0b1f33]">
              Welche Zusatzleistungen benötigen Sie?
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-slate-500">
              Standardleistungen wie Küche inkl. Backofen, Bad, normale
              Fenster/Storen, Balkon und normaler Keller sind bereits enthalten. Wählen Sie hier nur
              besondere Zusatzleistungen.
            </p>
            <AddOnSelector
              values={state.addons}
              onChange={(key, value) => setAddon(key, value)}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("size")}
                className="c24-button-secondary flex-1"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep("contact")}
                className="c24-button-primary flex-grow"
              >
                Weiter: Kontakt & Termin
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact / Lead Form */}
        {step === "contact" && isMoveOut && (
          <div>
            <div className="c24-eyebrow mb-3">04 Kontakt</div>
            <h3 className="mb-1 text-xl font-bold text-[#0b1f33]">
              Ihre Kontaktdaten & Wunschtermin
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              Anfrage absenden. Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
            </p>
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

        {/* Step 2 (non-move-out): inquiry details + contact */}
        {step === "contact" && !isMoveOut && (
          <div>
            <div className="c24-eyebrow mb-3">02 Kontakt</div>
            <h3 className="mb-1 text-xl font-bold text-[#0b1f33]">
              Ihre Angaben & Kontaktdaten
            </h3>
            <p className="mb-5 text-sm text-slate-500">
              Anfrage absenden. Clean24 übernimmt den weiteren Ablauf.
            </p>
            <LeadForm
              serviceCategory={state.category}
              onBack={() => setStep("category")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
