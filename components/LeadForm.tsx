"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/constants";
import { formatPrice } from "@/lib/pricing";
import {
  INQUIRY_RECURRENCE_OPTIONS,
  MOVE_OUT_CATEGORY,
  OBJECT_TYPE_OPTIONS,
  RECURRENCE_COUNT_CONFIG,
  buildRecurrenceSummary,
} from "@/lib/service-categories";
import type { LeadAttachmentRef, LeadFormData } from "@/lib/lead-payload";

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
  /**
   * Service category (lib/service-categories.ts). move_out_cleaning (default)
   * keeps the full Umzugsreinigung form incl. Richtpreis; every other
   * category renders the simplified manual-review inquiry.
   */
  serviceCategory?: string;
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

/* ---- Optional photo/file upload (Lead Autopilot upload endpoint) ---- */
// Limits mirror the Lead Autopilot server-side rules (max. 10 files à 10 MB,
// JPG/PNG/WEBP/PDF). Client checks are UX only — the backend re-validates.
const MAX_UPLOAD_FILES = 10;
const MAX_UPLOAD_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_UPLOAD_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
const ALLOWED_UPLOAD_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

const UPLOAD_ERROR_TOO_MANY = "Bitte laden Sie maximal 10 Dateien hoch.";
const UPLOAD_ERROR_TOO_LARGE = "Eine Datei ist zu gross. Maximal 10 MB pro Datei.";
const UPLOAD_ERROR_BAD_TYPE = "Bitte laden Sie nur JPG, PNG, WEBP oder PDF hoch.";
const UPLOAD_ERROR_FAILED =
  "Die Fotos konnten nicht hochgeladen werden. Bitte versuchen Sie es erneut oder senden Sie die Anfrage ohne Fotos.";
const UPLOAD_ERROR_NOT_AVAILABLE =
  "Foto-Upload ist aktuell nicht verfügbar. Bitte senden Sie die Anfrage ohne Fotos.";

/* ---- Clean24 field presentation (styling only) ---- */
const FIELD =
  "w-full min-h-[48px] rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-ink placeholder:text-slate-400 transition-colors duration-200 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";
const LABEL = "block text-[13.5px] text-slate-600 mb-1.5";
const HINT = "mt-1.5 text-[12px] text-slate-500 leading-snug";
const REQUIRED_MARK = <span className="text-teal-600">*</span>;

/** Section marker inside the continuous form — a hairline and a quiet label. */
function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400 pb-3 mb-5 border-b border-slate-200">
      {children}
    </h3>
  );
}

function isAllowedUploadFile(file: File): boolean {
  if (ALLOWED_UPLOAD_MIMES.includes(file.type)) return true;
  const name = file.name.toLowerCase();
  return ALLOWED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext));
}

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
}: LeadFormProps) {
  const router = useRouter();
  const uid = useId();
  /** Unique DOM id per field — the form can appear twice on one page. */
  const fid = (name: string) => `${uid}-${name}`;
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optional photos/files — uploaded to the Lead Autopilot on submit; only
  // the returned references go into the lead payload (never file contents).
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<FormState>>({
    apartment_size: "3.5",
    addons: {},
    express: false,
    // Abgabegarantie defaults to "Ja".
    handover_guarantee_requested: true,
    ...prefilledData,
  });

  // move_out_cleaning keeps the full Umzugsreinigung form; everything else is
  // a manual-review inquiry (no Richtpreis, no Abgabe fields, no Rabattcode).
  const isMoveOut = serviceCategory === MOVE_OUT_CATEGORY;
  const isUmzugsreinigung = isMoveOut && serviceType === "umzugsreinigung";
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
        // The preview endpoint recalculates from selections with the same pure
        // pricing function as the submit route; client price amounts are not
        // accepted as authoritative inputs.
        body: JSON.stringify({
          code,
          apartment_size: form.apartment_size,
          property_type: form.property_type,
          addons: form.addons,
          express: form.express,
        }),
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

  // Non-move-out recurrence. Changing the main rhythm resets the conditional
  // count + unit so no stale detail lingers; the summary is recomputed for the
  // new rhythm (base label until a count is picked).
  const handleInquiryRecurrenceChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      recurrence: value,
      recurrence_count: undefined,
      recurrence_unit: undefined,
      recurrence_summary: buildRecurrenceSummary(value, undefined),
    }));
  };

  // Count select (weekly / biweekly / monthly only) → store count, unit and
  // the human-readable summary together.
  const handleRecurrenceCountChange = (recurrence: string, raw: string) => {
    const count = raw ? Number(raw) : undefined;
    const cfg = RECURRENCE_COUNT_CONFIG[recurrence];
    setForm((prev) => ({
      ...prev,
      recurrence_count: count,
      recurrence_unit: count != null ? cfg?.unit : undefined,
      recurrence_summary: buildRecurrenceSummary(recurrence, count),
    }));
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    // Reset so selecting the same file again re-triggers onChange.
    e.target.value = "";
    if (selected.length === 0) return;

    setUploadError(null);

    if (uploadFiles.length + selected.length > MAX_UPLOAD_FILES) {
      setUploadError(UPLOAD_ERROR_TOO_MANY);
      return;
    }
    if (selected.some((f) => !isAllowedUploadFile(f))) {
      setUploadError(UPLOAD_ERROR_BAD_TYPE);
      return;
    }
    if (selected.some((f) => f.size > MAX_UPLOAD_FILE_BYTES)) {
      setUploadError(UPLOAD_ERROR_TOO_LARGE);
      return;
    }

    setUploadFiles((prev) => [...prev, ...selected]);
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
    setUploadError(null);
  };

  /**
   * Uploads the selected files to the Lead Autopilot upload endpoint and
   * returns the attachment references for the lead payload. Returns `null`
   * when no files are selected. Throws with a customer-friendly message when
   * the upload is unavailable or fails — the lead submit is then blocked.
   */
  const uploadPhotos = async (): Promise<LeadAttachmentRef[] | null> => {
    if (uploadFiles.length === 0) return null;

    // UX re-check before upload — the backend validates again server-side.
    if (uploadFiles.length > MAX_UPLOAD_FILES) throw new Error(UPLOAD_ERROR_TOO_MANY);
    if (uploadFiles.some((f) => !isAllowedUploadFile(f))) throw new Error(UPLOAD_ERROR_BAD_TYPE);
    if (uploadFiles.some((f) => f.size > MAX_UPLOAD_FILE_BYTES))
      throw new Error(UPLOAD_ERROR_TOO_LARGE);

    const uploadUrl = process.env.NEXT_PUBLIC_CLEAN24_LEAD_UPLOAD_URL;
    if (!uploadUrl) throw new Error(UPLOAD_ERROR_NOT_AVAILABLE);

    setUploadingPhotos(true);
    try {
      const formData = new FormData();
      for (const file of uploadFiles) formData.append("files", file);

      const res = await fetch(uploadUrl, { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (
        !res.ok ||
        !data?.ok ||
        !Array.isArray(data.attachments) ||
        data.attachments.length === 0
      ) {
        throw new Error(UPLOAD_ERROR_FAILED);
      }
      return data.attachments as LeadAttachmentRef[];
    } catch (err) {
      // Network errors etc. also surface as the friendly upload message.
      throw err instanceof Error && err.message === UPLOAD_ERROR_FAILED
        ? err
        : new Error(UPLOAD_ERROR_FAILED);
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      // Upload photos first (if any) — on failure the submit is blocked and
      // the customer sees a clear error. Without files nothing changes.
      const attachments = await uploadPhotos();

      const utmParams =
        typeof window !== "undefined"
          ? Object.fromEntries(new URLSearchParams(window.location.search).entries())
          : {};

      const payload = {
        ...form,
        service_category: serviceCategory,
        attachments: attachments ?? undefined,
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
        discount_code: isMoveOut ? discountCode.trim() || undefined : undefined,
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
    <form onSubmit={handleSubmit} className="space-y-7">
      {isMoveOut && estimatedMin && estimatedMax && (
        <div className="border-t-2 border-teal-500 pt-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
            Aktueller Richtpreis
          </div>
          {discount && discount.priceMin != null && discount.priceMax != null ? (
            <>
              <div className="mt-2 text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-ink tabular-nums leading-none">
                {formatPrice(discount.priceMin)} – {formatPrice(discount.priceMax)}
              </div>
              <div className="mt-2 text-[13px] text-slate-500 line-through tabular-nums">
                {formatPrice(estimatedMin)} – {formatPrice(estimatedMax)}
              </div>
              <span className="block text-[13px] text-teal-700 mt-1">
                Rabatt {discount.code} (−{discount.label}) angewendet.
              </span>
            </>
          ) : (
            <div className="mt-2 text-[30px] sm:text-[34px] font-semibold tracking-[-0.025em] text-ink tabular-nums leading-none">
              {formatPrice(estimatedMin)} – {formatPrice(estimatedMax)}
            </div>
          )}
          <div className="mt-2.5 text-[13px] text-slate-500">
            inkl. 8.1% MwSt. · unverbindlich · wird nach Prüfung Ihrer Angaben bestätigt
          </div>
        </div>
      )}

      {/* ---- 1. Objekt & Termin ---- */}
      <section>
        <GroupTitle>Objekt &amp; Termin</GroupTitle>

        <div className="space-y-4">
          {isMoveOut ? (
            <div>
              <label htmlFor={fid("cleaning-date")} className={LABEL}>Reinigungsdatum {REQUIRED_MARK}</label>
              <input
                type="date"
                required
                value={form.cleaning_date ?? ""}
                onChange={(e) => updateField("cleaning_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                id={fid("cleaning-date")}
                className={FIELD}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor={fid("object-type")} className={LABEL}>Objektart {REQUIRED_MARK}</label>
                <select
                  required
                  value={form.object_type ?? ""}
                  onChange={(e) => updateField("object_type", e.target.value)}
                  id={fid("object-type")}
                  className={FIELD}
                >
                  <option value="">Bitte wählen</option>
                  {OBJECT_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={fid("preferred-date")} className={LABEL}>Gewünschter Termin (optional)</label>
                <input
                  type="date"
                  value={form.cleaning_date ?? ""}
                  onChange={(e) => updateField("cleaning_date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  id={fid("preferred-date")}
                  className={FIELD}
                />
              </div>
              <div>
                <label htmlFor={fid("recurrence")} className={LABEL}>Wiederholung</label>
                <select
                  value={form.recurrence ?? ""}
                  onChange={(e) => handleInquiryRecurrenceChange(e.target.value)}
                  id={fid("recurrence")}
                  className={FIELD}
                >
                  <option value="">Bitte wählen</option>
                  {INQUIRY_RECURRENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {form.recurrence && RECURRENCE_COUNT_CONFIG[form.recurrence] && (
                <div>
                  <label htmlFor={fid("recurrence-count")} className={LABEL}>
                    {RECURRENCE_COUNT_CONFIG[form.recurrence].label}
                  </label>
                  <select
                    value={form.recurrence_count ?? ""}
                    onChange={(e) =>
                      handleRecurrenceCountChange(form.recurrence as string, e.target.value)
                    }
                    id={fid("recurrence-count")}
                    className={FIELD}
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

          {isRecurringService && (
            <div>
              <label htmlFor={fid("recurrence-service")} className={LABEL}>Wiederholung</label>
              <select
                value={form.recurrence ?? ""}
                onChange={(e) => updateField("recurrence", e.target.value)}
                id={fid("recurrence-service")}
                className={FIELD}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={fid("square-meters")} className={LABEL}>
                {isMoveOut ? "Bodenfläche in m² (optional)" : "Fläche in m² (optional)"}
              </label>
              <input
                type="number"
                min={1}
                value={form.square_meters ?? ""}
                onChange={(e) => updateField("square_meters", e.target.value)}
                placeholder="z.B. 85"
                id={fid("square-meters")}
                className={FIELD}
              />
            </div>
            {isMoveOut && (
              <div>
                <label htmlFor={fid("windows-count")} className={LABEL}>Anzahl Fenster (optional)</label>
                <input
                  type="number"
                  value={form.windows_count ?? ""}
                  onChange={(e) => updateField("windows_count", e.target.value)}
                  placeholder="z.B. 8"
                  id={fid("windows-count")}
                  className={FIELD}
                />
              </div>
            )}
            {isMoveOut && (
              <div>
                <label htmlFor={fid("dirtiness")} className={LABEL}>Verschmutzungsgrad (optional)</label>
                <select
                  value={form.dirtiness_level ?? ""}
                  onChange={(e) => updateField("dirtiness_level", e.target.value)}
                  id={fid("dirtiness")}
                  className={FIELD}
                >
                  <option value="">Bitte wählen</option>
                  <option value="low">Wenig schmutzig</option>
                  <option value="medium">Mittel schmutzig</option>
                  <option value="high">Sehr schmutzig</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label htmlFor={fid("notes")} className={LABEL}>
              {isMoveOut ? "Bemerkungen (optional)" : "Beschreibung / Bemerkungen (optional)"}
            </label>
            <textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Besonderheiten, spezielle Wünsche, Fragen..."
              id={fid("notes")}
              className={`${FIELD} resize-none`}
            />
            {!isMoveOut && form.recurrence === "by_agreement" && (
              <p className={HINT}>
                Bitte beschreiben Sie den gewünschten Rhythmus kurz in den Bemerkungen.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ---- 2. Wohnungsabgabe (move-out only) ---- */}
      {isMoveOut && (
        <section>
          <GroupTitle>Wohnungsabgabe</GroupTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={fid("handover-date")} className={LABEL}>Abgabetermin (optional)</label>
              <input
                type="date"
                value={form.handover_date ?? ""}
                onChange={(e) => updateField("handover_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                id={fid("handover-date")}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("handover-time")} className={LABEL}>Abgabezeit (optional)</label>
              <input
                type="time"
                value={form.handover_time ?? ""}
                onChange={(e) => updateField("handover_time", e.target.value)}
                id={fid("handover-time")}
                className={FIELD}
              />
              <p className={HINT}>Falls die Uhrzeit der Wohnungsabgabe bereits bekannt ist.</p>
            </div>
            {isUmzugsreinigung && (
              <div>
                <label htmlFor={fid("handover-guarantee")} className={LABEL}>Abgabegarantie gewünscht?</label>
                <select
                  value={(form.handover_guarantee_requested ?? true) ? "ja" : "nein"}
                  onChange={(e) =>
                    updateField("handover_guarantee_requested", e.target.value === "ja")
                  }
                  id={fid("handover-guarantee")}
                  className={FIELD}
                >
                  <option value="ja">Ja</option>
                  <option value="nein">Nein</option>
                </select>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- 3. Kontaktdaten ---- */}
      <section>
        <GroupTitle>Kontaktdaten</GroupTitle>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={fid("name")} className={LABEL}>Name {REQUIRED_MARK}</label>
              <input
                type="text"
                required
                value={form.customer_name ?? ""}
                onChange={(e) => updateField("customer_name", e.target.value)}
                placeholder="Vorname Nachname"
                id={fid("name")}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("phone")} className={LABEL}>Telefon {REQUIRED_MARK}</label>
              <input
                type="tel"
                required
                value={form.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="+41 79 000 00 00"
                id={fid("phone")}
                className={FIELD}
              />
            </div>
          </div>

          <div>
            <label htmlFor={fid("email")} className={LABEL}>E-Mail {REQUIRED_MARK}</label>
            <input
              type="email"
              required
              value={form.email ?? ""}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="ihre@email.ch"
              id={fid("email")}
              className={FIELD}
            />
          </div>

          <div>
            <label htmlFor={fid("address")} className={LABEL}>Adresse / Strasse und Hausnummer {REQUIRED_MARK}</label>
            <input
              type="text"
              required
              value={form.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Musterstrasse 12"
              id={fid("address")}
              className={FIELD}
            />
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
            <div>
              <label htmlFor={fid("zip")} className={LABEL}>PLZ {REQUIRED_MARK}</label>
              <input
                type="text"
                required
                value={form.zip ?? ""}
                onChange={(e) => updateField("zip", e.target.value)}
                placeholder="8953"
                maxLength={4}
                id={fid("zip")}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("city")} className={LABEL}>Ort {REQUIRED_MARK}</label>
              <input
                type="text"
                required
                list={fid("city-list")}
                value={form.city ?? ""}
                onChange={(e) => updateField("city", e.target.value)}
                placeholder="Dietikon"
                id={fid("city")}
                className={FIELD}
              />
              <datalist id={fid("city-list")}>
                {CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </section>

      {/* ---- 4. Fotos (optional) ---- */}
      <section>
        <GroupTitle>Fotos (optional)</GroupTitle>

        <div>
          <p className="text-[13.5px] text-slate-600 leading-relaxed mb-3 max-w-[34rem]">
            Fotos der Wohnung oder des Objekts helfen uns, Ihre Anfrage genauer zu prüfen.
          </p>
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFilesSelected}
            aria-label="Fotos hochladen (optional)"
            className="w-full rounded-md border border-slate-300 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 transition-colors duration-200 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 file:mr-3 file:border-0 file:bg-mist file:text-ink file:font-medium file:text-[12.5px] file:px-3 file:py-1.5 file:rounded file:cursor-pointer"
          />
          <p className="mt-2 text-[12px] text-slate-500">
            Max. 10 Dateien, je max. 10 MB. JPG, PNG, WEBP oder PDF.
          </p>
          {uploadFiles.length > 0 && (
            <ul className="mt-3 border-t border-slate-200">
              {uploadFiles.map((file, index) => (
                <li
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 text-[13px] text-slate-600 border-b border-slate-200 py-2.5"
                >
                  <span className="flex-1 truncate">{file.name}</span>
                  <span className="text-slate-400 whitespace-nowrap tabular-nums">
                    {formatFileSizeMb(file.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeUploadFile(index)}
                    disabled={submitting}
                    aria-label={`${file.name} entfernen`}
                    className="text-slate-400 hover:text-ink disabled:opacity-50 px-1 rounded transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {uploadError && <p className="mt-2 text-[13px] text-red-600">{uploadError}</p>}
        </div>
      </section>

      {/* ---- 5. Rabattcode (move-out only) ---- */}
      {isMoveOut && (
        <section>
          <GroupTitle>Rabattcode (optional)</GroupTitle>

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
              aria-label="Rabattcode"
              className={`${FIELD} flex-1`}
            />
            <button
              type="button"
              onClick={applyDiscount}
              disabled={discountChecking || !discountCode.trim()}
              className="min-h-[48px] border border-slate-300 bg-white text-ink hover:border-teal-600 hover:text-teal-700 disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:text-ink font-medium text-[14px] px-5 rounded-md transition-colors duration-200 whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              {discountChecking ? "Prüfen..." : "Anwenden"}
            </button>
          </div>
          {discount ? (
            <p className="mt-1.5 text-[12.5px] text-teal-600">
              Rabatt {discount.code} (−{discount.label}) angewendet.
            </p>
          ) : discountError ? (
            <p className="mt-1.5 text-[12.5px] text-red-600">{discountError}</p>
          ) : null}
        </section>
      )}

      {error && (
        <p className="border-l-2 border-red-500 pl-4 text-[13.5px] text-red-700 leading-relaxed">
          {error}
        </p>
      )}

      <div className="border-t border-slate-200 pt-7">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center h-12 px-7 rounded-md bg-navy-900 text-white text-[15px] font-medium transition-colors duration-200 hover:bg-ink disabled:opacity-60 disabled:hover:bg-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40 focus-visible:ring-offset-2"
          >
            {uploadingPhotos
              ? "Fotos werden hochgeladen..."
              : submitting
                ? "Wird gesendet..."
                : "Kostenlose Anfrage senden"}
          </button>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[14px] text-slate-500 hover:text-ink transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
            >
              Zurück
            </button>
          )}
        </div>

        <p className="mt-4 text-[13px] text-slate-500">Unverbindlich · keine Vorauszahlung</p>
      </div>
    </form>
  );
}
