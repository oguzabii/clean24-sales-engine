import { IconCheck } from "./icons";

interface QuoteStepperProps {
  /** Labels of the steps in the CURRENT flow (2 or 4 entries). */
  labels: string[];
  /** Index of the active step within `labels`. */
  current: number;
}

const LINE = "absolute top-4 h-px -translate-y-1/2 transition-colors duration-300";

/**
 * Numbered progress indicator. Presentation only — it reflects the wizard's
 * existing step array and never drives navigation.
 */
export default function QuoteStepper({ labels, current }: QuoteStepperProps) {
  const last = labels.length - 1;

  return (
    <nav aria-label="Fortschritt">
      <ol className="flex items-start">
        {labels.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="relative flex-1 flex flex-col items-center min-w-0">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`${LINE} left-0 right-1/2 ${i <= current ? "bg-teal-500" : "bg-slate-300"}`}
                />
              )}
              {i < last && (
                <span
                  aria-hidden
                  className={`${LINE} left-1/2 right-0 ${i < current ? "bg-teal-500" : "bg-slate-300"}`}
                />
              )}

              <span
                aria-current={active ? "step" : undefined}
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                  done
                    ? "bg-teal-500 text-white"
                    : active
                      ? "bg-teal-600 text-white ring-4 ring-teal-500/15"
                      : "bg-white text-slate-400 border border-slate-300"
                }`}
              >
                {done ? <IconCheck className="w-4 h-4" /> : i + 1}
              </span>
              {/* Below sm only the active label is shown, so four German
                  step names never collide on a phone. */}
              <span
                className={`mt-2 px-1 text-[11px] sm:text-[12.5px] text-center leading-tight ${
                  active ? "text-ink font-medium" : "text-slate-500 hidden sm:block"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
