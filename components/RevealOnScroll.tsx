"use client";

import { useEffect } from "react";

/**
 * Tiny client-only helper that toggles the `is-visible` class on any element
 * with a `data-reveal` attribute when it enters the viewport. No dependencies.
 * Pair with the [data-reveal] CSS in globals.css.
 */
export default function RevealOnScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (els.length === 0) return;

    const supportsIO = typeof IntersectionObserver !== "undefined";
    if (!supportsIO) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return null;
}
