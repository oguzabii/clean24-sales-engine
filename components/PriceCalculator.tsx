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

      {/* Incomplete input is not an OS manual-review decision. */}
      {state.category && !pricing && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
          <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
            {osQuote?.pricing_mode === "manual_review" ? "Individuelle Offerte" : quoteError ? "Richtpreis nicht verfügbar" : inquiryPricingInputs ? "Richtpreis wird ermittelt" : "Angaben unvollständig"}
          </div>
          <p className="text-sm text-blue-50 leading-relaxed" role="status">
            {osQuote?.pricing_mode === "manual_review" ? MANUAL_REVIEW_NOTICE : quoteError ? "Bitte versuchen Sie es nochmals." : inquiryPricingInputs ? "Ihre Angaben werden geprüft." : "Für den Richtpreis fehlen noch Angaben zur Reinigung."}
          </p>
        </div>
      )}

      {/* Display guidance only. Binding prices remain in the OS offer. */}
      {pricing && (
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-5">
        <div className="text-blue-200 text-xs uppercase tracking-wider mb-1">
          {pricing.amount_basis === "monthly" ? "Ihr monatlicher Richtpreis (unverbindlich)" : "Ihr Richtpreis (unverbindlich)"}
        </div>
        <div className="text-2xl sm:text-3xl font-bold tracking-tight tabular-nums">
          {formatRichtpreis(pricing)}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-blue-100/85 mt-2">
          {isMoveOut && <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            {APARTMENT_SIZE_LABELS[state.apartment_size]}
          </span>}
          {isMoveOut && state.property_type === "haus" && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Haus
            </span>
          )}
          {isMoveOut && addonsCount > 0 && (
            <span className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              {addonsCount} {addonsCount === 1 ? "Zusatzleistung" : "Zusatzleistungen"} berücksichtigt
            </span>
          )}
          {isMoveOut && state.express && (
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

      {quoteError && (
        <div className="bg-red-50 border border-red-100 px-6 py-3 text-sm text-red-700">{quoteError}</div>
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
              estimatedMin={pricing?.min}
              estimatedMax={pricing?.max}
              quoteToken={quoteToken ?? undefined}
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
              estimatedMin={pricing?.min}
              estimatedMax={pricing?.max}
              amountBasis={pricing?.amount_basis}
              quoteToken={quoteToken ?? undefined}
              onInquiryPricingChange={updateInquiryPricing}
              onBack={() => setStep("category")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
