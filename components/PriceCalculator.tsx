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

  return (
    <div id="calculator" className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Progress */}
      <div className="bg-gray-50 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-gray-500">
            Schritt {stepIndex + 1} von {steps.length}
          </span>
        </div>
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Neutral notice for manual-review categories — no CHF range. */}
      {state.category && !isMoveOut && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
            Individuelle Offerte
          </div>
          <p className="text-sm text-blue-50 leading-relaxed">{MANUAL_REVIEW_NOTICE}</p>
        </div>
      )}

      {/* Richtpreis range — move-out only. No per-line CHF itemisation.
          Selections still adjust the range; final price is confirmed after
          review. */}
      {isMoveOut && (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
        <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
          Ihr Richtpreis (unverbindlich)
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
          {pricing.display_min} – {pricing.display_max}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-blue-100/85 mt-2">
          <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            {APARTMENT_SIZE_LABELS[state.apartment_size]}
          </span>
          {state.property_type === "haus" && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Haus
            </span>
          )}
          {addonsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {addonsCount} {addonsCount === 1 ? "Zusatzleistung" : "Zusatzleistungen"} berücksichtigt
            </span>
          )}
          {state.express && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Express berücksichtigt
            </span>
          )}
        </div>
        <p className="text-xs text-blue-200/90 mt-3 leading-relaxed">
          Richtpreis, unverbindlich. Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
          Alle Preise inkl. 8.1% MwSt.
        </p>
      </div>
      )}

      <div className="p-6">
        {/* Step 0: Category */}
        {step === "category" && (
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Welche Reinigung benötigen Sie?
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Wählen Sie die passende Kategorie aus. Bei Umzugsreinigungen erhalten Sie direkt
              eine Richtpreis-Spanne, andere Anfragen prüfen wir individuell.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICE_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => selectCategory(cat.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    state.category === cat.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div
                    className={`font-semibold text-sm ${
                      state.category === cat.value ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    {cat.label}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{cat.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Size (move-out only) */}
        {step === "size" && (
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Wie gross ist Ihre Wohnung?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Schritt 2 von 4 · Angaben erfassen
            </p>

            <div className="mb-5">
              <div className="text-sm font-medium text-gray-700 mb-2">Objektart</div>
              <div className="grid grid-cols-2 gap-3">
                {PROPERTY_TYPES.map((pt) => (
                  <button
                    key={pt.key}
                    type="button"
                    onClick={() => setPropertyType(pt.key)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      state.property_type === pt.key
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className={`font-semibold text-sm ${state.property_type === pt.key ? "text-blue-700" : "text-gray-900"}`}>
                      {pt.label}
                    </div>
                    <div className={`text-[11px] mt-1 uppercase tracking-wider ${state.property_type === pt.key ? "text-blue-500" : "text-gray-400"}`}>
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
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    state.apartment_size === key
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className={`font-semibold text-sm ${state.apartment_size === key ? "text-blue-700" : "text-gray-900"}`}>
                    {label}
                  </div>
                  <div className={`text-[11px] mt-1 uppercase tracking-wider ${state.apartment_size === key ? "text-blue-500" : "text-gray-400"}`}>
                    {state.apartment_size === key ? "Ausgewählt" : "Auswählen"}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.express}
                  onChange={(e) => setExpress(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span>Express-Termin gewünscht (24–48h)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep("category")}
                className="flex-1 border border-gray-200 text-gray-600 hover:text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep("addons")}
                className="flex-2 flex-grow bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Weiter: Zusatzleistungen
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add-ons */}
        {step === "addons" && (
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Welche Zusatzleistungen benötigen Sie?
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Schritt 3 von 4 · Standardleistungen wie Küche inkl. Backofen, Bad, normale
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
                className="flex-1 border border-gray-200 text-gray-600 hover:text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Zurück
              </button>
              <button
                onClick={() => setStep("contact")}
                className="flex-2 flex-grow bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Weiter: Kontakt & Termin
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact / Lead Form */}
        {step === "contact" && isMoveOut && (
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Ihre Kontaktdaten & Wunschtermin
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Schritt 4 von 4 · Anfrage absenden. Wir prüfen Ihre Angaben und melden uns mit
              Fixpreis und Terminvorschlag.
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
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Ihre Angaben & Kontaktdaten
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              Schritt 2 von 2 · Anfrage absenden. Wir prüfen Ihre Angaben individuell und melden
              uns mit einer passenden Offerte.
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
