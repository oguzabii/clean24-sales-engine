import type { SidebarCopy } from "./quote-copy";
import {
  IconCheckCircle,
  IconClock,
  IconEye,
  IconHeart,
  IconLock,
  IconPlusCircle,
  IconShield,
} from "./icons";

const BULLET_ICONS = {
  check: IconCheckCircle,
  clock: IconClock,
  heart: IconHeart,
  lock: IconLock,
  plus: IconPlusCircle,
  eye: IconEye,
  shield: IconShield,
} as const;

interface QuoteSidebarProps {
  stepLabel: string;
  copy: SidebarCopy;
}

/**
 * Left explanatory column of the quotation workspace (lg and up).
 * Purely informational — no controls.
 */
export default function QuoteSidebar({ stepLabel, copy }: QuoteSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {stepLabel}
      </p>

      <h1 className="mt-4 text-[26px] xl:text-[30px] font-semibold tracking-[-0.02em] leading-[1.15] text-ink">
        {copy.heading}
      </h1>

      <p className="mt-4 text-[14.5px] leading-relaxed text-slate-600">{copy.body}</p>

      <ul className="mt-8 space-y-5">
        {copy.bullets.map((b) => {
          const Icon = BULLET_ICONS[b.icon];
          return (
            <li key={b.title} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 text-teal-600">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-ink leading-snug">
                  {b.title}
                </span>
                <span className="block text-[13px] text-slate-500 mt-0.5 leading-snug">
                  {b.body}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {copy.script && (
        <p className="mt-auto pt-12 text-[26px] xl:text-[28px] leading-[1.15] text-teal-700 whitespace-pre-line [font-family:var(--font-script)]">
          {copy.script}
        </p>
      )}
    </div>
  );
}
