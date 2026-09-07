"use client";

import { useEffect, useState } from "react";
import { OfferScrollLink } from "@/components/OfferScrollLink";
import { COMPANY } from "@/lib/constants";

/**
 * Sticky bottom CTA bar visible only on small screens.
 * Safe-area aware via the `c24-sticky-cta` class.
 *
 * The quotation wizard is the top of the page, so the bar stays hidden while
 * it is on screen and only appears once the visitor scrolls into the content
 * sections below — no CTA pointing at a form the visitor is already using.
 */
export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const offer = document.getElementById("offer");
    if (!offer) {
      // No quotation workspace on this page — show the bar unconditionally.
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: "0px" }
    );
    observer.observe(offer);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <div className="c24-sticky-cta bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-2 gap-2 px-3 pt-2.5">
          <OfferScrollLink
            href="#offer"
            tabIndex={visible ? undefined : -1}
            className="inline-flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold py-3 rounded-xl transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Offerte erhalten
          </OfferScrollLink>
          <a
            href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            tabIndex={visible ? undefined : -1}
            className="inline-flex items-center justify-center gap-1.5 bg-navy-900 hover:bg-ink text-white text-sm font-semibold py-3 rounded-xl transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Anrufen
          </a>
        </div>
      </div>
    </div>
  );
}
