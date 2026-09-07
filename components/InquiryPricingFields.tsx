"use client";

import { useId } from "react";
import type { LeadFormData } from "@/lib/lead-payload";
import { inquiryFields, SPECIAL_SUBTYPES, WINDOW_GROUP_FIELDS, type InquiryField } from "@/lib/inquiry-fields";

const inputClass = "w-full min-h-[46px] rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[14.5px] text-ink placeholder:text-slate-400 transition-colors duration-200 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
const labelClass = "block text-[13px] text-slate-600 mb-1.5";

function Field({ field, value, onChange }: { field: InquiryField; value: unknown; onChange: (value: unknown) => void }) {
  const id = useId();
  if (field.kind === "checkbox") return (
    <label className="flex items-center gap-2.5 text-[14px] text-slate-600 cursor-pointer">
      <input type="checkbox" checked={value === true} onChange={(e) => onChange(e.target.checked)} className="w-[18px] h-[18px] rounded-sm border-slate-300 accent-teal-600" />
      <span>{field.label}</span>
    </label>
  );
  if (field.kind === "multi") return (
    <fieldset className="space-y-4">
      <legend className={labelClass}>{field.label}</legend>
      {field.options?.map((option) => (
        <label key={option.value} className="flex items-center gap-2.5 text-[14px] text-slate-600 cursor-pointer">
          <input type="checkbox" className="w-[18px] h-[18px] rounded-sm border-slate-300 accent-teal-600"
            checked={Array.isArray(value) && value.includes(option.value)}
            onChange={(e) => {
              const selected = Array.isArray(value) ? value : [];
              onChange(e.target.checked ? [...selected, option.value] : selected.filter((v) => v !== option.value));
            }} />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {field.label}{field.required ? <> <span className="text-teal-600">*</span></> : " (optional)"}
      </label>
      {field.kind === "select" ? (
        <select id={id} required={field.required} value={typeof value === "string" || typeof value === "number" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)} className={inputClass}>
          <option value="">{"Bitte w\u00e4hlen"}</option>
          {field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      ) : (
        <input id={id} type="number" min={field.min}
          step={field.integer ? 1 : "any"} required={field.required}
          value={typeof value === "number" || typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className={inputClass} />
      )}
    </div>
  );
}

export default function InquiryPricingFields({ data, onChange }: {
  data: Partial<LeadFormData>;
  onChange: (patch: Partial<LeadFormData>) => void;
}) {
  const input = data.pricing_inputs ?? {};
  const category = data.service_category;
  const nicotine = category === "special_cleaning" && input.subtype === "nicotine";
  const details = nicotine ? (input.nicotine_base ?? {}) as Record<string, unknown> : input;
  const { main, extras, risks } = inquiryFields(data);
  const changeInput = (key: string, value: unknown) => onChange({ pricing_inputs: { ...input, [key]: value } });
  const changeDetail = (key: string, value: unknown) => nicotine
    ? changeInput("nicotine_base", { ...details, [key]: value }) : changeInput(key, value);
  const renderFields = (fields: InquiryField[]) => fields.map((field) =>
    <Field key={field.key} field={field} value={details[field.key]} onChange={(value) => changeDetail(field.key, value)} />);
  const groups = Array.isArray(input.groups) ? input.groups as Record<string, unknown>[] : [{}];

  return (
    <div className="space-y-4">
      {category === "special_cleaning" && (
        <Field field={{ key: "subtype", label: "Welche Spezialreinigung?", kind: "select", options: SPECIAL_SUBTYPES, required: true }}
          value={input.subtype} onChange={(subtype) => onChange({ pricing_inputs: { subtype }, square_meters: "" })} />
      )}
      {category === "facility_staircase_cleaning" && (
        <Field field={{ key: "facility_product", label: "Gew\u00fcnschte Leistung", kind: "select", required: true, options: [
          { value: "staircase", label: "Treppenhausreinigung" }, { value: "facility_basis", label: "Hauswartung Basis" },
        ] }} value={data.facility_product} onChange={(value) => onChange({ facility_product: value as LeadFormData["facility_product"] })} />
      )}
      {category === "window_cleaning" && (
        <div className="space-y-4">
          {groups.map((group, index) => (
            <fieldset key={index} className="space-y-4">
              <legend className={labelClass}>{`Fenstergruppe ${index + 1}`}</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {WINDOW_GROUP_FIELDS.map((field) => <Field key={field.key} field={field} value={group[field.key]}
                  onChange={(value) => changeInput("groups", groups.map((g, i) => i === index ? { ...g, [field.key]: value } : g))} />)}
              </div>
              {groups.length > 1 && <button type="button" title={`Fenstergruppe ${index + 1} entfernen`}
                aria-label={`Fenstergruppe ${index + 1} entfernen`} className="text-[13.5px] text-slate-500 hover:text-red-600 transition-colors duration-200"
                onClick={() => changeInput("groups", groups.filter((_, i) => i !== index))}>
                <span aria-hidden="true">&minus;</span> Entfernen
              </button>}
            </fieldset>
          ))}
          <button type="button" className="text-[13.5px] text-teal-700 hover:text-teal-600 font-medium transition-colors duration-200"
            onClick={() => changeInput("groups", [...groups, {}])}>
            <span aria-hidden="true">+</span> {"Fenstergruppe hinzuf\u00fcgen"}
          </button>
        </div>
      )}
      {main.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{renderFields(main)}</div>}
      {extras.length > 0 && <details className="space-y-4">
        <summary className="text-[13.5px] font-medium text-ink cursor-pointer">Weitere Angaben / Zusatzleistungen (optional)</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{renderFields(extras)}</div>
      </details>}
      {(risks.length > 0 || nicotine) && <details className="space-y-4">
        <summary className="text-[13.5px] font-medium text-ink cursor-pointer">Besonderheiten (optional)</summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {renderFields(risks)}
          {nicotine && <Field field={{ key: "very_severe_nicotine", label: "Sehr starke Nikotinbelastung", kind: "checkbox" }}
            value={input.very_severe_nicotine} onChange={(value) => changeInput("very_severe_nicotine", value)} />}
        </div>
      </details>}
    </div>
  );
}
