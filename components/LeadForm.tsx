"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { CITIES } from "@/lib/constants";
import { formatPrice } from "@/lib/pricing";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCoins,
  IconMail,
  IconNote,
  IconPhone,
  IconPhoto,
  IconPin,
  IconTag,
  IconUser,
} from "./icons";
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

/* ---- Field presentation (reference UI) ---- */
const CARD = "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";
const FIELD =
  "w-full min-h-[46px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-slate-400 transition-colors duration-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const FIELD_WITH_ICON = FIELD + " pl-10";
const FIELD_ICON =
  "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400";
const LABEL = "block text-[13px] text-slate-600 mb-1.5";
const HINT = "mt-1.5 text-[12px] text-slate-500 leading-snug";
const REQUIRED_MARK = <span className="text-teal-600">*</span>;

/** Section header inside the form: icon, title and one line of context. */
function GroupTitle({
  icon: Icon,
  title,
  children,
}: {
  icon: (p: { className?: string }) => React.ReactElement;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-teal-50 text-teal-600">
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink leading-snug">{title}</h3>
        {children && (
          <p className="text-[12.5px] text-slate-500 mt-0.5 leading-snug">{children}</p>
        )}
      </span>
    </div>
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {isMoveOut && estimatedMin && estimatedMax && (
        <div className="rounded-xl border border-teal-500/20 bg-teal-50/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <IconCoins className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-[11.5px] text-slate-600">Aktueller Richtpreis</span>
          </div>
          {discount && discount.priceMin != null && discount.priceMax != null ? (
            <>
              <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {formatPrice(discount.priceMin)} – {formatPrice(discount.priceMax)}
              </div>
              <div className="mt-0.5 text-[12px] text-slate-500 line-through tabular-nums">
                {formatPrice(estimatedMin)} – {formatPrice(estimatedMax)}
              </div>
              <span className="block text-[12px] text-teal-700 mt-0.5">
                Rabatt {discount.code} (−{discount.label}) angewendet.
              </span>
            </>
          ) : (
            <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
              {formatPrice(estimatedMin)} – {formatPrice(estimatedMax)}
            </div>
          )}
          <span className="block text-[11.5px] text-slate-500 mt-1">
            inkl. 8.1% MwSt. · unverbindlich · wird nach Prüfung Ihrer Angaben bestätigt
          </span>
        </div>
      )}

      {/* ---- Persönliche Angaben ---- */}
      <section className={CARD}>
        <GroupTitle icon={IconUser} title="Persönliche Angaben">
          Wir melden uns mit der Offerte bei Ihnen.
        </GroupTitle>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={fid("name")} className={LABEL}>
              Name {REQUIRED_MARK}
            </label>
            <input
              id={fid("name")}
              type="text"
              required
              value={form.customer_name ?? ""}
              onChange={(e) => updateField("customer_name", e.target.value)}
              placeholder="z. B. Max Muster"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={fid("phone")} className={LABEL}>
              Telefon {REQUIRED_MARK}
            </label>
            <div className="relative">
              <IconPhone className={FIELD_ICON} />
              <input
                id={fid("phone")}
                type="tel"
                required
                value={form.phone ?? ""}
                onChange={(e) => updateField("phone", e.target.value)}
                placeholder="z. B. 079 123 45 67"
                className={FIELD_WITH_ICON}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={fid("email")} className={LABEL}>
              E-Mail {REQUIRED_MARK}
            </label>
            <div className="relative">
              <IconMail className={FIELD_ICON} />
              <input
                id={fid("email")}
                type="email"
                required
                value={form.email ?? ""}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="z. B. name@beispiel.ch"
                className={FIELD_WITH_ICON}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Adresse ---- */}
      <section className={CARD}>
        <GroupTitle
          icon={IconPin}
          title={isMoveOut ? "Adresse der zu reinigenden Wohnung" : "Adresse des Objekts"}
        >
          Damit wir die Gegebenheiten besser einschätzen können.
        </GroupTitle>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor={fid("address")} className={LABEL}>
              Strasse {REQUIRED_MARK}
            </label>
            <input
              id={fid("address")}
              type="text"
              required
              value={form.address ?? ""}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="z. B. Bahnhofstrasse 1"
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={fid("zip")} className={LABEL}>
              PLZ {REQUIRED_MARK}
            </label>
            <input
              id={fid("zip")}
              type="text"
              required
              value={form.zip ?? ""}
              onChange={(e) => updateField("zip", e.target.value)}
              placeholder="z. B. 8001"
              maxLength={4}
              className={FIELD}
            />
          </div>
          <div>
            <label htmlFor={fid("city")} className={LABEL}>
              Ort {REQUIRED_MARK}
            </label>
            <input
              id={fid("city")}
              type="text"
              required
              list={fid("city-list")}
              value={form.city ?? ""}
              onChange={(e) => updateField("city", e.target.value)}
              placeholder="z. B. Zürich"
              className={FIELD}
            />
            <datalist id={fid("city-list")}>
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      {/* ---- Objekt & Termin ---- */}
      <section className={CARD}>
        <GroupTitle icon={IconCalendar} title={isMoveOut ? "Wunschtermin" : "Objekt & Termin"}>
          {isMoveOut
            ? "Wann soll die Reinigung stattfinden?"
            : "Worum geht es und wann soll die Reinigung stattfinden?"}
        </GroupTitle>

        {isMoveOut ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor={fid("cleaning-date")} className={LABEL}>
                Gewünschtes Datum {REQUIRED_MARK}
              </label>
              <input
                id={fid("cleaning-date")}
                type="date"
                required
                value={form.cleaning_date ?? ""}
                onChange={(e) => updateField("cleaning_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("handover-date")} className={LABEL}>
                Abgabetermin (optional)
              </label>
              <input
                id={fid("handover-date")}
                type="date"
                value={form.handover_date ?? ""}
                onChange={(e) => updateField("handover_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("handover-time")} className={LABEL}>
                Abgabezeit (optional)
              </label>
              <input
                id={fid("handover-time")}
                type="time"
                value={form.handover_time ?? ""}
                onChange={(e) => updateField("handover_time", e.target.value)}
                className={FIELD}
              />
              <p className={HINT}>Falls die Uhrzeit der Wohnungsabgabe bereits bekannt ist.</p>
            </div>
            {isUmzugsreinigung && (
              <div>
                <label htmlFor={fid("handover-guarantee")} className={LABEL}>
                  Abgabegarantie gewünscht?
                </label>
                <select
                  id={fid("handover-guarantee")}
                  value={(form.handover_guarantee_requested ?? true) ? "ja" : "nein"}
                  onChange={(e) =>
                    updateField("handover_guarantee_requested", e.target.value === "ja")
                  }
                  className={FIELD}
                >
                  <option value="ja">Ja</option>
                  <option value="nein">Nein</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={fid("object-type")} className={LABEL}>
                Objektart {REQUIRED_MARK}
              </label>
              <select
                id={fid("object-type")}
                required
                value={form.object_type ?? ""}
                onChange={(e) => updateField("object_type", e.target.value)}
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
              <label htmlFor={fid("preferred-date")} className={LABEL}>
                Gewünschter Termin (optional)
              </label>
              <input
                id={fid("preferred-date")}
                type="date"
                value={form.cleaning_date ?? ""}
                onChange={(e) => updateField("cleaning_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor={fid("recurrence")} className={LABEL}>
                Wiederholung
              </label>
              <select
                id={fid("recurrence")}
                value={form.recurrence ?? ""}
                onChange={(e) => handleInquiryRecurrenceChange(e.target.value)}
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
                  id={fid("recurrence-count")}
                  value={form.recurrence_count ?? ""}
                  onChange={(e) =>
                    handleRecurrenceCountChange(form.recurrence as string, e.target.value)
                  }
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
          <div className="mt-4 sm:max-w-[50%]">
            <label htmlFor={fid("recurrence-service")} className={LABEL}>
              Wiederholung
            </label>
            <select
              id={fid("recurrence-service")}
              value={form.recurrence ?? ""}
              onChange={(e) => updateField("recurrence", e.target.value)}
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
      </section>

      {/* ---- Angaben zum Objekt (optional) ---- */}
      <section className={CARD}>
        <GroupTitle icon={IconNote} title="Angaben zum Objekt (optional)">
          Diese Angaben helfen uns, den Aufwand genauer einzuschätzen.
        </GroupTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor={fid("square-meters")} className={LABEL}>
              {isMoveOut ? "Bodenfläche in m²" : "Fläche in m²"}
            </label>
            <input
              id={fid("square-meters")}
              type="number"
              min={1}
              value={form.square_meters ?? ""}
              onChange={(e) => updateField("square_meters", e.target.value)}
              placeholder="z. B. 85"
              className={FIELD}
            />
          </div>
          {isMoveOut && (
            <div>
              <label htmlFor={fid("windows-count")} className={LABEL}>
                Anzahl Fenster
              </label>
              <input
                id={fid("windows-count")}
                type="number"
                value={form.windows_count ?? ""}
                onChange={(e) => updateField("windows_count", e.target.value)}
                placeholder="z. B. 8"
                className={FIELD}
              />
            </div>
          )}
          {isMoveOut && (
            <div>
              <label htmlFor={fid("dirtiness")} className={LABEL}>
                Verschmutzungsgrad
              </label>
              <select
                id={fid("dirtiness")}
                value={form.dirtiness_level ?? ""}
                onChange={(e) => updateField("dirtiness_level", e.target.value)}
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

        <div className="mt-4">
          <label htmlFor={fid("notes")} className={LABEL}>
            Zusätzliche Informationen
          </label>
          <textarea
            id={fid("notes")}
            rows={3}
            value={form.notes ?? ""}
            onChange={(e) => updateField("notes", e.target.value)}
            placeholder="z. B. Besonderheiten, Zugang, Parkmöglichkeiten …"
            className={`${FIELD} resize-none`}
          />
          {!isMoveOut && form.recurrence === "by_agreement" && (
            <p className={HINT}>
              Bitte beschreiben Sie den gewünschten Rhythmus kurz in den Bemerkungen.
            </p>
          )}
        </div>
      </section>

      {/* ---- Fotos ---- */}
      <section className={CARD}>
        <GroupTitle icon={IconPhoto} title="Fotos (optional)">
          Fotos der Wohnung oder des Objekts helfen uns, Ihre Anfrage genauer zu prüfen.
        </GroupTitle>

        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={handleFilesSelected}
          aria-label="Fotos hochladen (optional)"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 transition-colors duration-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 file:mr-3 file:border-0 file:bg-slate-100 file:text-ink file:font-medium file:text-[12.5px] file:px-3 file:py-1.5 file:rounded-md file:cursor-pointer"
        />
        <p className="mt-2 text-[12px] text-slate-500">
          Max. 10 Dateien, je max. 10 MB. JPG, PNG, WEBP oder PDF.
        </p>
        {uploadFiles.length > 0 && (
          <ul className="mt-3 space-y-2">
            {uploadFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-[12.5px] text-slate-600"
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
                  className="text-slate-400 hover:text-ink disabled:opacity-50 px-1 rounded transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        {uploadError && <p className="mt-2 text-[13px] text-red-600">{uploadError}</p>}
      </section>

      {/* ---- Rabattcode (move-out only) ---- */}
      {isMoveOut && (
        <section className={CARD}>
          <GroupTitle icon={IconTag} title="Rabattcode (optional)">
            Falls Sie einen Code erhalten haben, lösen Sie ihn hier ein.
          </GroupTitle>

          <div className="flex gap-2.5">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => {
                setDiscountCode(e.target.value);
                setDiscount(null);
                setDiscountError(null);
              }}
              placeholder="z. B. SOMMER10"
              aria-label="Rabattcode"
              className={`${FIELD} flex-1`}
            />
            <button
              type="button"
              onClick={applyDiscount}
              disabled={discountChecking || !discountCode.trim()}
              className="min-h-[46px] rounded-lg border border-slate-200 bg-white px-5 text-[14px] font-medium text-ink transition-colors duration-200 hover:border-teal-500 hover:text-teal-700 disabled:opacity-50 disabled:hover:border-slate-200 disabled:hover:text-ink whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
            >
              {discountChecking ? "Prüfen..." : "Anwenden"}
            </button>
          </div>
          {discount ? (
            <p className="mt-2 text-[12.5px] text-teal-700">
              Rabatt {discount.code} (−{discount.label}) angewendet.
            </p>
          ) : discountError ? (
            <p className="mt-2 text-[12.5px] text-red-600">{discountError}</p>
          ) : null}
        </section>
      )}

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700 leading-relaxed">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 h-[52px] px-4 rounded-lg text-[14.5px] text-slate-500 transition-colors duration-200 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
          >
            <IconArrowLeft className="w-4 h-4" />
            Zurück
          </button>
        ) : (
          <span />
        )}

        <div className="flex flex-col items-end gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2.5 h-[52px] px-7 rounded-lg bg-navy-900 text-white text-[15px] font-semibold transition-colors duration-200 hover:bg-ink disabled:opacity-60 disabled:hover:bg-navy-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 focus-visible:ring-offset-2"
          >
            {uploadingPhotos
              ? "Fotos werden hochgeladen..."
              : submitting
                ? "Wird gesendet..."
                : "Offerte anfragen"}
            {!submitting && !uploadingPhotos && <IconArrowRight className="w-[18px] h-[18px]" />}
          </button>
          <p className="text-[12px] text-slate-500">Unverbindlich · keine Vorauszahlung</p>
        </div>
      </div>
    </form>
  );
}
