"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/constants";
import { MAX_LEAD_FILES, uploadLeadFiles, validateLeadFiles } from "@/lib/attachments";
import {
  INQUIRY_RECURRENCE_OPTIONS,
  MOVE_OUT_CATEGORY,
  OBJECT_TYPE_OPTIONS,
  RECURRENCE_COUNT_CONFIG,
  buildRecurrenceSummary,
} from "@/lib/service-categories";
import type { LeadFormData } from "@/lib/lead-payload";
import type { LocalLeadFile } from "@/lib/attachments";
import { formatRichtpreis } from "@/lib/richtpreis";
import { inquiryPricingInput, inquiryQuoteSelection, recurrencePatch, recurrenceSelection, type InquiryQuoteSelection } from "@/lib/inquiry-pricing-input";
import { needsFloorArea, recurrenceOptionsFor } from "@/lib/inquiry-fields";
import InquiryPricingFields from "./InquiryPricingFields";
import type { AmountBasis } from "@/lib/sales-engine-contract";

interface LeadFormProps {
  prefilledData?: Partial<LeadFormData>;
  estimatedMin?: number;
  estimatedMax?: number;
  onBack?: () => void;
  pagePath?: string;
  /** Service selected in the existing category flow. */
  serviceType?: string;
  /**
   * Service category (lib/service-categories.ts). move_out_cleaning (default)
   * keeps the full Umzugsreinigung form; other categories use OS input fields.
   */
  serviceCategory?: string;
  quoteToken?: string;
  amountBasis?: AmountBasis;
  onInquiryPricingChange?: (input: InquiryQuoteSelection | null) => void;
}

type FormState = Omit<LeadFormData, "source" | "service_type">;

function newUploadId(): string {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `upload:${id}`;
}

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

function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb < 1 ? mb.toFixed(2) : mb.toFixed(1)} MB`;
}

export default function LeadForm({
  prefilledData = {},
  estimatedMin,
  estimatedMax,
  onBack,
  pagePath,
  serviceType = "umzugsreinigung",
  serviceCategory = MOVE_OUT_CATEGORY,
  quoteToken,
  amountBasis = "one_off",
  onInquiryPricingChange,
}: LeadFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional photos/files — uploaded privately to OS on submit; only
  // the returned references go into the lead payload (never file contents).
  const [uploadFiles, setUploadFiles] = useState<LocalLeadFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<FormState>>({
    apartment_size: "3.5",
    addons: {},
    express: false,
    // Abgabegarantie defaults to "Ja".
    handover_guarantee_requested: true,
    ...prefilledData,
  });

  // Move-out retains its historical form; new categories share its field styles.
  const isMoveOut = serviceCategory === MOVE_OUT_CATEGORY;
  const isUmzugsreinigung = isMoveOut && serviceType === "umzugsreinigung";
  const isRecurringService = RECURRING_SERVICE_TYPES.includes(serviceType);
  const contractRecurrences = recurrenceOptionsFor(serviceCategory);
  const floorAreaRequired = needsFloorArea(serviceCategory, form.pricing_inputs?.subtype);
  const showFloorArea = isMoveOut || floorAreaRequired;
  const residentialObject = serviceCategory === "construction_cleaning" || serviceCategory === "private_cleaning";
  const deepObject = serviceCategory === "deep_cleaning" || (serviceCategory === "special_cleaning" && form.pricing_inputs?.subtype === "nicotine");
  const objectOptions = OBJECT_TYPE_OPTIONS.filter((o) => residentialObject ? ["wohnung", "haus"].includes(o.value)
    : deepObject ? ["wohnung", "haus", "buero_gewerbe"].includes(o.value) : true);

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

  const applyDiscount = () => {
    const code = discountCode.trim();
    if (!code) return;
    setDiscountChecking(true);
    setDiscountError(null);
    setDiscount({ code, label: "wird mit Ihrer Anfrage geprüft" });
    setDiscountChecking(false);
  };

  const updateField = (key: keyof FormState, value: string | boolean | Record<string, boolean>) => {
    const next = { ...form, [key]: value };
    setForm(next);
    if (!isMoveOut && (key === "object_type" || key === "square_meters")) {
      onInquiryPricingChange?.(inquiryQuoteSelection({ ...next, service_category: serviceCategory }));
    }
  };

  const updateInquiry = (patch: Partial<LeadFormData>) => {
    const next = { ...form, ...patch };
    setForm(next);
    onInquiryPricingChange?.(inquiryQuoteSelection({ ...next, service_category: serviceCategory }));
  };

  // Non-move-out recurrence. Changing the main rhythm resets the conditional
  // count + unit so no stale detail lingers; the summary is recomputed for the
  // new rhythm (base label until a count is picked).
  const handleInquiryRecurrenceChange = (value: string) => {
    const next = {
      ...form,
      recurrence: value,
      recurrence_count: undefined,
      recurrence_unit: undefined,
      recurrence_summary: buildRecurrenceSummary(value, undefined),
    };
    setForm(next);
    onInquiryPricingChange?.(inquiryQuoteSelection({ ...next, service_category: serviceCategory }));
  };

  // Count select (weekly / biweekly / monthly only) → store count, unit and
  // the human-readable summary together.
  const handleRecurrenceCountChange = (recurrence: string, raw: string) => {
    const count = raw ? Number(raw) : undefined;
    const cfg = RECURRENCE_COUNT_CONFIG[recurrence];
    const next = {
      ...form,
      recurrence_count: count,
      recurrence_unit: count != null ? cfg?.unit : undefined,
      recurrence_summary: buildRecurrenceSummary(recurrence, count),
    };
    setForm(next);
    onInquiryPricingChange?.(inquiryQuoteSelection({ ...next, service_category: serviceCategory }));
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = "";
    if (selected.length === 0) return;

    setUploadError(null);

    const merged = [...uploadFiles, ...selected.map((file) => ({ file, upload_id: newUploadId() }))].slice(0, MAX_LEAD_FILES);
    setUploadFiles(merged);
    setUploadError(validateLeadFiles(merged.map((entry) => entry.file)));
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(validateLeadFiles(uploadFiles.filter((_, i) => i !== index).map((entry) => entry.file)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(form.cleaning_date ?? "").trim()) {
      setError("Bitte wählen Sie einen Reinigungstermin aus.");
      return;
    }

    // Abgabezeit only makes sense together with an Abgabetermin (move-out only).
    if (isMoveOut && (form.handover_time ?? "").trim() && !(form.handover_date ?? "").trim()) {
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
    setUploadError(null);

    try {
      if (!quoteToken) throw new Error("Ihre Angaben werden noch geprüft. Bitte versuchen Sie es gleich nochmals.");
      const uploadedAttachments = await uploadLeadFiles(uploadFiles);

      const utmParams =
        typeof window !== "undefined"
          ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
          : {};

      const payload = {
        ...form,
        service_category: serviceCategory,
        attachments: uploadedAttachments.map((attachment) => attachment.attachment_id),
        quote_token: quoteToken,
        pricing_inputs: !isMoveOut
          ? inquiryPricingInput({ ...form, service_category: serviceCategory }) ?? undefined
          : undefined,
        // Move-out-only fields never travel for manual-review inquiries.
        apartment_size: isMoveOut ? form.apartment_size : undefined,
        addons: isMoveOut ? form.addons : undefined,
        express: isMoveOut ? form.express : undefined,
        handover_date: isMoveOut ? form.handover_date : undefined,
        handover_time: isMoveOut ? (form.handover_time ?? "").trim() || undefined : undefined,
        handover_guarantee_requested: isMoveOut ? form.handover_guarantee_requested : undefined,
        property_type: isMoveOut ? form.property_type : undefined,
        windows_count: isMoveOut ? form.windows_count : undefined,
        dirtiness_level: isMoveOut ? form.dirtiness_level || undefined : undefined,
        // Non-move-out: optional "gewünschter Termin" mirrors cleaning_date.
        cleaning_date: (form.cleaning_date ?? "").trim() || undefined,
        preferred_date: !isMoveOut ? (form.cleaning_date ?? "").trim() || undefined : undefined,
        object_type: !isMoveOut ? form.object_type || undefined : undefined,
        // New key expected by Lead Autopilot; square_meters stays for
        // backward compatibility (same value, no rename).
        floor_area_m2: (form.square_meters ?? "").trim() || undefined,
        recurrence: isMoveOut
          ? isRecurringService
            ? form.recurrence || undefined
            : undefined
          : form.recurrence || undefined,
        // Recurrence rhythm detail — non-move-out inquiries only. Manual review
        // keeps the raw combination (e.g. "2x pro Woche") without normalizing.
        recurrence_count: !isMoveOut ? form.recurrence_count : undefined,
        recurrence_unit: !isMoveOut ? form.recurrence_unit : undefined,
        recurrence_summary: !isMoveOut ? form.recurrence_summary : undefined,
        // Rabattcode applies only to the automatic Richtpreis (move-out).
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

      router.push(isMoveOut ? "/danke" : "/danke?m=review");
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
                {formatRichtpreis({ min: estimatedMin, max: estimatedMax })}
              </span>{" "}
              <strong>
                {formatRichtpreis({ min: discount.priceMin, max: discount.priceMax })}
              </strong>
              <span className="block text-xs text-green-600 mt-0.5">
                Rabatt {discount.code} (−{discount.label}) angewendet.
              </span>
            </>
          ) : (
            <>
              {amountBasis === "monthly" ? "Ihr monatlicher Richtpreis:" : "Ihr Richtpreis:"}{" "}
              <strong>{formatRichtpreis({ min: estimatedMin, max: estimatedMax })}</strong>
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

      {isMoveOut ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cleaning-date" className="block text-sm font-medium text-gray-700 mb-1">
              Reinigungsdatum <span className="text-red-500">*</span>
            </label>
            <input
              id="cleaning-date"
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Objektart <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={form.object_type ?? ""}
              onChange={(e) => updateField("object_type", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Bitte wählen</option>
              {objectOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="cleaning-date" className="block text-sm font-medium text-gray-700 mb-1">
              Gewünschter Termin <span className="text-red-500">*</span>
            </label>
            <input
              id="cleaning-date"
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
              Wiederholung
            </label>
            <select
              required={Boolean(contractRecurrences)}
              value={contractRecurrences ? recurrenceSelection(form) : form.recurrence ?? ""}
              onChange={(e) => contractRecurrences ? updateInquiry(recurrencePatch(e.target.value)) : handleInquiryRecurrenceChange(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Bitte wählen</option>
              {(contractRecurrences ?? INQUIRY_RECURRENCE_OPTIONS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {!contractRecurrences && form.recurrence && RECURRENCE_COUNT_CONFIG[form.recurrence] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {RECURRENCE_COUNT_CONFIG[form.recurrence].label}
              </label>
              <select
                value={form.recurrence_count ?? ""}
                onChange={(e) =>
                  handleRecurrenceCountChange(form.recurrence as string, e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Bitte wählen</option>
                {Array.from(
                  { length: RECURRENCE_COUNT_CONFIG[form.recurrence].max },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {RECURRENCE_COUNT_CONFIG[form.recurrence as string].optionLabel(n)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

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

      {showFloorArea && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isMoveOut ? "Bodenfläche in m² (optional)" : "Wie gross ist die Fläche in m²?"}
            {floorAreaRequired && <> <span className="text-red-500">*</span></>}
          </label>
          <input
            type="number"
            min={isMoveOut ? 1 : 0}
            step={isMoveOut ? 1 : "any"}
            required={floorAreaRequired}
            value={form.square_meters ?? ""}
            onChange={(e) => updateField("square_meters", e.target.value)}
            placeholder="z.B. 85"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {isMoveOut && (
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
        )}
      </div>}

      {!isMoveOut && <InquiryPricingFields data={{ ...form, service_category: serviceCategory }} onChange={updateInquiry} />}

      {isMoveOut && (
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
      </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {isMoveOut ? "Bemerkungen (optional)" : "Beschreibung / Bemerkungen (optional)"}
        </label>
        <textarea
          rows={3}
          value={form.notes ?? ""}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Besonderheiten, spezielle Wünsche, Fragen..."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {!isMoveOut && form.recurrence === "by_agreement" && (
          <p className="mt-1 text-xs text-gray-500 leading-snug">
            Bitte beschreiben Sie den gewünschten Rhythmus kurz in den Bemerkungen.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fotos hochladen (optional)
        </label>
        <p className="text-xs text-gray-500 mb-2 leading-snug">
          Laden Sie optional Fotos der Wohnung oder des Objekts hoch, damit wir Ihre
          Anfrage genauer prüfen können.
        </p>
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFilesSelected}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold file:text-xs file:px-3 file:py-1.5 file:rounded-lg file:cursor-pointer"
        />
        <p className="mt-1 text-xs text-gray-400">
          Max. 10 Dateien, je max. 10 MB. JPG, PNG, WEBP oder PDF.
        </p>
        {uploadFiles.length > 0 && (
          <ul className="mt-2 space-y-1">
            {uploadFiles.map((file, index) => (
              <li
                key={`${file.upload_id}-${index}`}
                className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5"
              >
                <span className="flex-1 truncate">{file.file.name}</span>
                <span className="text-gray-400 whitespace-nowrap">
                  {formatFileSizeMb(file.file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => removeUploadFile(index)}
                  disabled={submitting}
                  aria-label={`${file.file.name} entfernen`}
                  className="text-gray-400 hover:text-red-500 disabled:opacity-50 font-semibold px-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
      </div>

      {isMoveOut && (
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
      )}

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
        Keine Vorauszahlung. Unverbindlich. Bei automatisch berechenbaren Anfragen erhalten Sie
        Ihre Offerte in der Regel innerhalb von 2 Minuten.
      </p>
    </form>
  );
}
