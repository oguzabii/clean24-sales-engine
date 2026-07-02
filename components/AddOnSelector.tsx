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
            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              active
                ? "border-blue-600 bg-blue-50"
                : "border-gray-200 hover:border-blue-300"
            }`}
          >
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => onChange(addon.key, e.target.checked)}
              className="w-5 h-5 rounded text-blue-600 flex-shrink-0 mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className={`font-medium text-sm ${active ? "text-blue-700" : "text-gray-900"}`}>
                {addon.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                {addon.description}
              </div>
            </div>
            <div
              className={`text-[11px] uppercase tracking-wider font-semibold flex-shrink-0 whitespace-nowrap ${
                active ? "text-blue-600" : "text-gray-400"
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
