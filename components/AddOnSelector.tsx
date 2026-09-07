import { ADDONS } from "@/lib/constants";
import { ADDON_ICONS, IconCheck, IconSparkle } from "./icons";

interface AddOnSelectorProps {
  values: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}

/**
 * Add-on selection rows.
 *
 * Per-add-on CHF prices are intentionally NOT shown. The fixed surcharges
 * (lib/constants.ts) still apply via lib/pricing.ts — the customer sees their
 * effect only in the live Richtpreis range and the selection summary.
 */
export default function AddOnSelector({ values, onChange }: AddOnSelectorProps) {
  return (
    <ul className="mt-5 space-y-2.5">
      {ADDONS.map((addon) => {
        const active = !!values[addon.key];
        const Icon = ADDON_ICONS[addon.key] ?? IconSparkle;
        return (
          <li key={addon.key}>
            <label
              className={`flex items-center gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500/40 ${
                active
                  ? "border-teal-500 bg-teal-50/50 ring-1 ring-teal-500/30"
                  : "border-slate-200 bg-white hover:border-teal-400"
              }`}
            >
              <span
                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors duration-200 ${
                  active ? "bg-white text-teal-600" : "bg-slate-50 text-slate-500"
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
              </span>

              <span className="flex-1 min-w-0">
                <span className="block text-[14px] font-semibold text-ink leading-snug">
                  {addon.label}
                </span>
                <span className="block text-[12px] text-slate-500 mt-0.5 leading-snug">
                  {addon.description}
                </span>
              </span>

              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onChange(addon.key, e.target.checked)}
                className="sr-only peer"
              />
              <span
                aria-hidden
                className={`flex-shrink-0 flex items-center justify-center w-[22px] h-[22px] rounded-md border transition-colors duration-200 ${
                  active
                    ? "bg-teal-500 border-teal-500 text-white"
                    : "bg-white border-slate-300 text-transparent"
                }`}
              >
                <IconCheck className="w-3.5 h-3.5" />
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
