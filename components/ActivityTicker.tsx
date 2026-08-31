import { ACTIVITY_FEED } from "@/lib/constants";

/**
 * Vertical scrolling activity ticker. CSS-only animation; duplicated list
 * inside the track makes the loop seamless. Hover pauses (see globals.css).
 *
 * Styled to match — and size to — the dark live-operations card so the two
 * cards read as one balanced dashboard block.
 */
export default function ActivityTicker() {
  const items = ACTIVITY_FEED;
  const loop = [...items, ...items];

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-[#dbe6ea] bg-white">
      <div className="flex items-center justify-between border-b border-[#dbe6ea] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="c24-live-dot" />
          <span className="text-sm font-semibold text-[#0b1f33]">Aktivität bei Clean24</span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-[#1f7f78]">Live</span>
      </div>
      <div className="c24-ticker flex-1 min-h-[180px]">
        <ul className="c24-ticker-track">
          {loop.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              className="flex items-start gap-3 border-b border-slate-100 px-4 py-2.5 last:border-b-0"
            >
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#1f9b8f]" />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px] font-semibold leading-tight text-[#0b1f33]">
                  {item.label}
                </div>
                <div className="mt-0.5 truncate text-[11px] leading-tight text-slate-500">
                  {item.detail}
                </div>
              </div>
              <div className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">
                {item.timeAgo}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
