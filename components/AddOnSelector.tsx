import { ADDONS } from "@/lib/constants";

interface AddOnSelectorProps {
  values: Record<string, boolean>;
  onChange: (key: string, value: boolean) => void;
}

/**
 * Add-on selection step.
 *
 * Per-add-on CHF prices are intentionally NOT shown on the selection cards —
 * the fixed surcharges (lib/constants.ts) still apply via lib/pricing.ts, and
 * the customer sees the effect only in the Richtpreis range / summary.
 */
export default function AddOnSelector({ values, onChange }: AddOnSelectorProps) {
  return (
    <div className="space-y-3">
      {ADDONS.map((addon) => {
        const active = !!values[addon.key];
        const trailingLabel = "Optional";
        return (
          <label
            key={addon.key}
            className={`c24-choice flex cursor-pointer items-start gap-4 p-4 ${
              active
                ? "c24-choice-active"
                : ""
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => onChange(addon.key, e.target.checked)}
              className="mt-0.5 h-5 w-5 flex-shrink-0 rounded text-[#1f9b8f]"
            />
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-semibold ${active ? "text-[#0f766e]" : "text-[#0b1f33]"}`}>
                {addon.label}
              </div>
              <div className="mt-1 text-xs leading-relaxed text-slate-500">
                {addon.description}
              </div>
            </div>
            <div
              className={`text-[11px] uppercase tracking-wider font-semibold flex-shrink-0 whitespace-nowrap ${
                active ? "text-[#1f7f78]" : "text-slate-400"
              }`}
            >
              {active ? "Berücksichtigt" : trailingLabel}
            </div>
          </label>
        );
      })}
    </div>
  );
}
