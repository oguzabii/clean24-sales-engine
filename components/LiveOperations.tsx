"use client";

import { useEffect, useState } from "react";
import { LIVE_OPS } from "@/lib/constants";

/**
 * "Heute bei Clean24" – operations dashboard card.
 *
 * The numbers in `lib/constants.ts > LIVE_OPS` are the end-of-day TARGETS.
 * The displayed values scale linearly with the time of day so the dashboard
 * feels alive without random fake chaos:
 *   • Before business hours start → all daily totals = 0, teams = 0
 *   • During business hours        → daily totals rise toward their target
 *   • After business hours close   → daily totals stay at target, teams = 0
 *
 * Re-computed every 60s on the client to avoid SSR/CSR hydration mismatch.
 *
 * The card sizes to its content (no fill/stretch) — paired with a similarly
 * sized ActivityTicker for a balanced, tight dashboard block.
 */

interface OpsValues {
  cleaningsCompleted: number;
  offersSent: number;
  requestsReceived: number;
  activeTeams: number;
}

function computeValues(now: Date): OpsValues {
  const h = now.getHours() + now.getMinutes() / 60;
  const start = LIVE_OPS.businessHoursStart;
  const end = LIVE_OPS.businessHoursEnd;

  let progress: number;
  if (h < start) progress = 0;
  else if (h >= end) progress = 1;
  else progress = (h - start) / (end - start);

  const dailyTotal = (target: number) => {
    if (progress <= 0) return 0;
    if (progress >= 1) return target;
    return Math.max(1, Math.round(target * progress));
  };

  const inHours = h >= start && h < end;

  return {
    cleaningsCompleted: dailyTotal(LIVE_OPS.todayCleaningsCompleted),
    offersSent: dailyTotal(LIVE_OPS.todayOffersSent),
    requestsReceived: dailyTotal(LIVE_OPS.todayRequestsReceived),
    activeTeams: inHours ? LIVE_OPS.teamsCurrentlyActiveDaytime : 0,
  };
}

export default function LiveOperations() {
  const [values, setValues] = useState<OpsValues | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValues(computeValues(new Date()));
    const id = window.setInterval(() => {
      setValues(computeValues(new Date()));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const stats = [
    { label: "Heute abgeschlossen", value: values?.cleaningsCompleted },
    { label: "Offerten heute vorbereitet", value: values?.offersSent },
    { label: "Neue Anfragen heute", value: values?.requestsReceived },
  ];
  const activeTeams = values?.activeTeams;

  return (
    <div
      data-reveal
      className="relative overflow-hidden rounded-lg border border-[#dbe6ea] bg-[#f7fafb] p-4 lg:p-5"
    >
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-bold leading-tight tracking-tight text-[#0b1f33] lg:text-[17px]">
              Heute bei Clean24
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Operativer Status, automatisch nach Tageszeit.
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#b8d5d8] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0f766e]">
            <span className="c24-live-dot" />
            Live
          </div>
        </div>

        {/* 3 stat tiles */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-md border border-[#dbe6ea] bg-white px-2 py-3 text-center"
            >
              <div className="c24-count-in text-2xl font-bold leading-none tracking-tight text-[#0b1f33] tabular-nums md:text-[28px]">
                {s.value ?? "—"}
              </div>
              <div className="mt-1.5 text-[10px] leading-tight text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom 2-col tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center justify-between gap-2 rounded-md border border-[#dbe6ea] bg-white px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider leading-none text-slate-500">
                Aktuell im Einsatz
              </div>
              <div className="mt-1 text-base font-semibold leading-none text-[#0b1f33]">
                {activeTeams === undefined
                  ? "—"
                  : `${activeTeams} ${activeTeams === 1 ? "Team" : "Teams"}`}
              </div>
            </div>
            <svg
              className="h-5 w-5 flex-shrink-0 text-[#1f9b8f]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-md border border-[#dbe6ea] bg-white px-3 py-2.5">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider leading-none text-slate-500">
                Nächster freier Termin
              </div>
              <div className="mt-1 truncate text-base font-semibold leading-none text-[#0b1f33]">
                {LIVE_OPS.nextAvailableSlotText}
              </div>
            </div>
            <svg
              className="h-5 w-5 flex-shrink-0 text-[#1f7f78]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
