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
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden w-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="c24-live-dot" />
          <span className="text-sm font-semibold text-white">Aktivität bei Clean24</span>
        </div>
        <span className="text-[10px] text-blue-200/70 uppercase tracking-wider">Live</span>
      </div>
      <div className="c24-ticker flex-1 min-h-[180px]">
        <ul className="c24-ticker-track">
          {loop.map((item, i) => (
            <li
              key={`${item.label}-${i}`}
              className="flex items-start gap-3 px-4 py-2.5 border-b border-white/5 last:border-b-0"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-white truncate leading-tight">
                  {item.label}
                </div>
                <div className="text-[11px] text-blue-200/70 truncate leading-tight mt-0.5">
                  {item.detail}
                </div>
              </div>
              <div className="text-[10px] text-blue-200/60 whitespace-nowrap mt-0.5">
                {item.timeAgo}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
