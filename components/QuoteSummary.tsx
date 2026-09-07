import { COMPANY } from "@/lib/constants";
import { GOOD_TO_KNOW, SUMMARY_TRUST, SUMMARY_TRUST_MANUAL } from "./quote-copy";
import {
  CATEGORY_ICONS,
  IconBolt,
  IconChat,
  IconCheckCircle,
  IconCoins,
  IconDots,
  IconHome,
  IconInfo,
  IconNote,
  IconPencil,
  IconPhone,
  IconWindow,
} from "./icons";

export interface SummaryRow {
  label: string;
  value: string;
  icon: "home" | "window" | "bolt" | "plus";
}

const ROW_ICONS = {
  home: IconHome,
  window: IconWindow,
  bolt: IconBolt,
  plus: IconDots,
} as const;

const GOOD_ICONS = { note: IconNote, chat: IconChat, phone: IconPhone } as const;

interface QuoteSummaryProps {
  /** Selected category value + label, or null before a choice is made. */
  categoryValue: string | null;
  categoryLabel: string | null;
  rows: SummaryRow[];
  /** Preformatted range from the live engine (formatRichtpreis). Never computed here. */
  price?: string;
  /** Caption above the amount — one-off vs monthly comes from the engine. */
  priceLabel?: string;
  /** Shown when the live engine has no range yet (manual review, error, pending). */
  notice?: { title: string; body: string } | null;
  /** Final step swaps the trust list for "Gut zu wissen" and shows Bearbeiten. */
  finalStep?: boolean;
  onEdit?: () => void;
}

/**
 * Right-hand live summary ("Ihre Auswahl").
 *
 * Every value is passed in from the wizard's existing state and the pricing
 * engine — this component performs no calculation of its own.
 */
export default function QuoteSummary({
  categoryValue,
  categoryLabel,
  rows,
  price,
  priceLabel = "Aktueller Richtpreis",
  notice,
  finalStep = false,
  onEdit,
}: QuoteSummaryProps) {
  const CategoryIcon = (categoryValue && CATEGORY_ICONS[categoryValue]) || IconHome;
  const trust = notice ? SUMMARY_TRUST_MANUAL : SUMMARY_TRUST;

  return (
    <aside className="space-y-4 min-w-0">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(12,29,51,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-teal-50 text-teal-600">
              <CategoryIcon className="w-5 h-5" />
            </span>
            <span className="block min-w-0 flex-1">
              <span className="block text-[11px] text-slate-500">Ihre Auswahl</span>
              <span className="block text-[15px] font-semibold text-ink leading-snug truncate">
                {categoryLabel ?? "Noch nicht gewählt"}
              </span>
            </span>
          </div>
          {finalStep && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-[12px] text-slate-600 hover:text-ink hover:border-slate-300 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
            >
              Bearbeiten
              <IconPencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {rows.length > 0 && (
          <dl className="mt-5 space-y-3.5">
            {rows.map((r) => {
              const RowIcon = ROW_ICONS[r.icon];
              return (
                <div key={r.label} className="flex items-center gap-3">
                  <RowIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <dt className="text-[13px] text-slate-500 flex-1 min-w-0 truncate">{r.label}</dt>
                  <dd className="text-[13px] font-medium text-ink text-right">{r.value}</dd>
                </div>
              );
            })}
          </dl>
        )}

        {price && (
          <div className="mt-5 rounded-xl bg-teal-50/70 border border-teal-500/20 p-4">
            <div className="flex items-center gap-2">
              <IconCoins className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-[11.5px] text-slate-600">{priceLabel}</span>
              <IconInfo className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            </div>
            <div className="mt-1.5 text-[21px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
              {price}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-snug">
              Inklusive Standardreinigung
              <br />
              inkl. 8.1% MwSt. · unverbindlich
            </p>
          </div>
        )}

        {notice && (
          <div className="mt-5 rounded-xl bg-teal-50/70 border border-teal-500/20 p-4">
            <div className="flex items-center gap-2">
              <IconInfo className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-[11.5px] font-medium text-slate-700">{notice.title}</span>
            </div>
            <p className="mt-1.5 text-[12px] text-slate-600 leading-relaxed" role="status">{notice.body}</p>
          </div>
        )}

        <ul className="mt-5 space-y-2.5">
          {(finalStep ? [] : trust).map((t) => (
            <li key={t} className="flex items-center gap-2.5">
              <IconCheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-[13px] text-slate-600">{t}</span>
            </li>
          ))}
        </ul>
      </div>

      {finalStep ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3.5">
            <IconInfo className="w-4 h-4 text-teal-600" />
            <span className="text-[13.5px] font-semibold text-ink">Gut zu wissen</span>
          </div>
          <ul className="space-y-3.5">
            {GOOD_TO_KNOW.map((g) => {
              const GoodIcon = GOOD_ICONS[g.icon];
              return (
                <li key={g.body} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-teal-50 text-teal-600">
                    <GoodIcon className="w-[15px] h-[15px]" />
                  </span>
                  <span className="text-[12.5px] text-slate-600 leading-relaxed">{g.body}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <a
          href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
          className="group flex items-center gap-3 rounded-2xl bg-teal-50/70 border border-teal-500/15 p-4 transition-colors duration-200 hover:bg-teal-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
        >
          <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-white text-teal-600 border border-teal-500/20">
            <IconChat className="w-[18px] h-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] font-semibold text-ink">Fragen?</span>
            <span className="block text-[12px] text-slate-500">Wir sind für Sie da.</span>
            <span className="block text-[13px] font-medium text-teal-700 tabular-nums mt-0.5">
              {COMPANY.phoneDisplay}
            </span>
          </span>
        </a>
      )}
    </aside>
  );
}
