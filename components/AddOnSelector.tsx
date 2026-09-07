import { ADDONS } from "@/lib/constants";

interface AddOnSelectorProps {
  values: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}

/**
 * Add-on selection — hairline rows, no cards.
 *
 * Per-add-on CHF prices are intentionally NOT shown on the rows — the fixed
 * surcharges (lib/constants.ts) still apply via lib/pricing.ts, and the
 * customer sees the effect only in the Richtpreis range / summary.
 */
export default function AddOnSelector({ values, onChange }: AddOnSelectorProps) {
  return (
    <ul className="mt-6 border-t border-slate-200">
      {ADDONS.map((addon) => {
        const active = !!values[addon.key];
        return (
          <li key={addon.key}>
            <label
              className={`flex items-start gap-3.5 py-4 border-b border-slate-200 cursor-pointer transition-colors duration-200 hover:bg-mist has-[:focus-visible]:bg-mist ${
                active ? "bg-mist/60" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => onChange(addon.key, e.target.checked)}
                className="mt-0.5 w-[18px] h-[18px] rounded-sm border-slate-300 accent-teal-600 flex-shrink-0"
              />
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-[15px] leading-snug ${
                    active ? "font-medium text-ink" : "text-ink"
                  }`}
                >
                  {addon.label}
                </span>
                <span className="block text-[13px] text-slate-500 mt-0.5 leading-relaxed">
                  {addon.description}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
