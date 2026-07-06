"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/constants";
import type { LeadFormData } from "@/lib/lead-payload";

interface LeadFormProps {
  prefilledData?: Partial<LeadFormData>;
  estimatedMin?: number;
  estimatedMax?: number;
  onBack?: () => void;
  pagePath?: string;
  /**
   * Service the form is submitted for. The Sales Engine currently only sells
   * Umzugsreinigung; recurring services show the "Wiederholung" selector.
   */
  serviceType?: string;
}

type FormState = Omit<LeadFormData, "source" | "service_type">;

/** Services that show the recurrence ("Wiederholung") selector. */
const RECURRING_SERVICE_TYPES = [
  "wiederkehrende_reinigung_privat",
  "wiederkehrende_reinigung_gewerbe",
];

const RECURRENCE_OPTIONS: { value: string; label: string }[] = [
  { value: "daily", label: "Täglich" },
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Alle 2 Wochen" },
  { value: "monthly", label: "Monatlich" },
  { value: "other", label: "Andere" },
];

export default function LeadForm({
  prefilledData = {},
  estimatedMin,
  estimatedMax,
  onBack,
  pagePath,
  serviceType = "umzugsreinigung",
}: LeadFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<FormState>>({
    apartment_size: "3.5",
    addons: {},
    express: false,
    // Abgabegarantie defaults to "Ja".
    handover_guarantee_requested: true,
    ...prefilledData,
  });

  const isUmzugsreinigung = serviceType === "umzugsreinigung";
  const isRecurringService = RECURRING_SERVICE_TYPES.includes(serviceType);

  // Optional Rabattcode — validated server-side via the Autopilot API.
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{
    code: string;
    label: string;
    priceMin?: number;
    priceMax?: number;
  } | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [discountError, setDiscountError] = useState<string | null>(null);

  const applyDiscount = async () => {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountChecking(true);
    setDiscountError(null);
    try {
      const res = await fetch("/api/discount/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, price_min: estimatedMin, price_max: estimatedMax }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.valid) {
        setDiscount({
          code: data.code,
          label: data.label,
          priceMin: data.price_min,
          priceMax: data.price_max,
        });
      } else {
        setDiscount(null);
        setDiscountError("Code ungültig oder abgelaufen.");
      }
    } catch {
      setDiscount(null);
      setDiscountError("Prüfung fehlgeschlagen. Bitte später erneut versuchen.");
    } finally {
      setDiscountChecking(false);
    }
  };

  const updateField = (key: keyof FormState, value: string | boolean | Record<string, boolean>) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Abgabezeit only makes sense together with an Abgabetermin.
    if ((form.handover_time ?? "").trim() && !(form.handover_date ?? "").trim()) {
      setError("Bitte wählen Sie zuerst einen Abgabetermin aus.");
      return;
    }

    // Bodenfläche is optional, but must be a positive number when entered.
    const floorArea = (form.square_meters ?? "").trim();
    if (floorArea && (!Number.isFinite(Number(floorArea)) || Number(floorArea) <= 0)) {
      setError("Bitte geben Sie eine gültige Bodenfläche in m² an.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const utmParams =
        typeof window !== "undefined"
          ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
          : {};

      const payload = {
        ...form,
        handover_time: (form.handover_time ?? "").trim() || undefined,
        // New key expected by Lead Autopilot; square_meters stays for
        // backward compatibility (same value, no rename).
        floor_area_m2: (form.square_meters ?? "").trim() || undefined,
        recurrence: isRecurringService ? form.recurrence || undefined : undefined,
        dirtiness_level: form.dirtiness_level || undefined,
        priority_preference: form.priority_preference || undefined,
        discount_code: discountCode.trim() || undefined,
        page_path: pagePath ?? (typeof window !== "undefined" ? window.location.pathname : "/"),
        utm_source: utmParams.utm_source,
        utm_medium: utmParams.utm_medium,
        utm_campaign: utmParams.utm_campaign,
      };

      const res = await fetch("/api/leads/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Fehler beim Absenden. Bitte versuchen Sie es erneut.");
      }

      router.push("/danke");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {estimatedMin && estimatedMax && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
          {discount && discount.priceMin != null && discount.priceMax != null ? (
            <>
              Ihr Richtpreis:{" "}
              <span className="line-through text-blue-400">
                CHF {estimatedMin} – CHF {estimatedMax}
              </span>{" "}
              <strong>
                CHF {discount.priceMin} – CHF {discount.priceMax}
              </strong>
              <span className="block text-xs text-green-600 mt-0.5">
                Rabatt {discount.code} (−{discount.label}) angewendet.
              </span>
            </>
          ) : (
            <>
              Ihr Richtpreis: <strong>CHF {estimatedMin} – CHF {estimatedMax}</strong>
            </>
          )}
          <span className="block text-xs text-blue-400 mt-0.5">
            Wird nach Prüfung Ihrer Angaben bestätigt.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.customer_name ?? ""}
            onChange={(e) => updateField("customer_name", e.target.value)}
            placeholder="Vorname Nachname"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefon <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            required
            value={form.phone ?? ""}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+41 79 000 00 00"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          E-Mail <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          required
          value={form.email ?? ""}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="ihre@email.ch"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse / Strasse und Hausnummer <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.address ?? ""}
          onChange={(e) => updateField("address", e.target.value)}
          placeholder="Musterstrasse 12"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PLZ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.zip ?? ""}
            onChange={(e) => updateField("zip", e.target.value)}
            placeholder="8953"
            maxLength={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ort <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            list="city-list"
            value={form.city ?? ""}
            onChange={(e) => updateField("city", e.target.value)}
            placeholder="Dietikon"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <datalist id="city-list">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reinigungsdatum <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.cleaning_date ?? ""}
            onChange={(e) => updateField("cleaning_date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abgabetermin (optional)
          </label>
          <input
            type="date"
            value={form.handover_date ?? ""}
            onChange={(e) => updateField("handover_date", e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Abgabezeit (optional)
          </label>
          <input
            type="time"
            value={form.handover_time ?? ""}
            onChange={(e) => updateField("handover_time", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400 leading-snug">
            Optional – falls die Uhrzeit der Wohnungsabgabe bereits bekannt ist.
          </p>
        </div>
      </div>

      {(isUmzugsreinigung || isRecurringService) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {isUmzugsreinigung && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abgabegarantie gewünscht?
              </label>
              <select
                value={(form.handover_guarantee_requested ?? true) ? "ja" : "nein"}
                onChange={(e) =>
                  updateField("handover_guarantee_requested", e.target.value === "ja")
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="ja">Ja</option>
                <option value="nein">Nein</option>
              </select>
            </div>
          )}
          {isRecurringService && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wiederholung
              </label>
              <select
                value={form.recurrence ?? ""}
                onChange={(e) => updateField("recurrence", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Bitte wählen</option>
                {RECURRENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bodenfläche in m² (optional)
          </label>
          <input
            type="number"
            min={1}
            value={form.square_meters ?? ""}
            onChange={(e) => updateField("square_meters", e.target.value)}
            placeholder="z.B. 85"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Anzahl Fenster (optional)
          </label>
          <input
            type="number"
            value={form.windows_count ?? ""}
            onChange={(e) => updateField("windows_count", e.target.value)}
            placeholder="z.B. 8"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verschmutzungsgrad (optional)
          </label>
          <select
            value={form.dirtiness_level ?? ""}
            onChange={(e) => updateField("dirtiness_level", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Bitte wählen</option>
            <option value="low">Wenig schmutzig</option>
            <option value="medium">Mittel schmutzig</option>
            <option value="high">Sehr schmutzig</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Was ist Ihnen wichtiger? (optional)
          </label>
          <select
            value={form.priority_preference ?? ""}
            onChange={(e) => updateField("priority_preference", e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Bitte wählen</option>
            <option value="quality">Qualität</option>
            <option value="price">Preis</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Bemerkungen (optional)
        </label>
        <textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Besonderheiten, spezielle Wünsche, Fragen..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rabattcode (optional)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value);
              setDiscount(null);
              setDiscountError(null);
            }}
            placeholder="z.B. SOMMER10"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={applyDiscount}
            disabled={discountChecking || !discountCode.trim()}
            className="border border-gray-200 text-gray-700 hover:text-blue-600 disabled:opacity-50 font-semibold px-5 rounded-xl transition-colors whitespace-nowrap"
          >
            {discountChecking ? "Prüfen..." : "Anwenden"}
          </button>
        </div>
        {discount ? (
          <p className="mt-1 text-xs text-green-600">
            Rabatt {discount.code} (−{discount.label}) angewendet.
          </p>
        ) : discountError ? (
          <p className="mt-1 text-xs text-red-600">{discountError}</p>
        ) : null}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 border border-gray-200 text-gray-600 hover:text-gray-900 font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Zurück
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-grow bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
        >
          {submitting ? "Wird gesendet..." : "Kostenlose Anfrage absenden"}
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Keine Vorauszahlung. Unverbindlich. Wir antworten innerhalb von 2 Stunden.
      </p>
    </form>
  );
}
