"use client";

import { useEffect, useState } from "react";

const CONSENT_STORAGE_KEY = "c24_google_consent";
const CONSENT_COOKIE = "c24_google_consent";
const ACQUISITION_COOKIE = "c24_google_acquisition";

type ConsentChoice = "granted" | "denied";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

type StoredAcquisition = {
  page_path?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
};

function cookieSuffix(maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  return `; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function persistConsent(choice: ConsentChoice) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  document.cookie = `${CONSENT_COOKIE}=${choice}${cookieSuffix(15552000)}`;
}

function updateGoogleConsent(choice: ConsentChoice) {
  const gtag = (window as GtagWindow).gtag;
  if (!gtag) return;

  const value = choice === "granted" ? "granted" : "denied";
  gtag("consent", "update", {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

function clamp(value: string | null, max: number): string | null {
  if (!value) return null;
  return value.slice(0, max);
}

function captureAcquisition() {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const acquisition: StoredAcquisition = {
    page_path: clamp(`${url.pathname}${url.search}`, 300),
    referrer: clamp(document.referrer || null, 1000),
    utm_source: clamp(params.get("utm_source"), 200),
    utm_medium: clamp(params.get("utm_medium"), 200),
    utm_campaign: clamp(params.get("utm_campaign"), 300),
    gclid: clamp(params.get("gclid"), 500),
    gbraid: clamp(params.get("gbraid"), 500),
    wbraid: clamp(params.get("wbraid"), 500),
  };

  const hasUsefulAttribution = Object.entries(acquisition).some(
    ([key, value]) => key !== "page_path" && Boolean(value)
  );
  if (!hasUsefulAttribution) return;

  document.cookie = `${ACQUISITION_COOKIE}=${encodeURIComponent(JSON.stringify(acquisition))}${cookieSuffix(7776000)}`;
}

function clearAcquisition() {
  document.cookie = `${ACQUISITION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function ConsentBanner({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") {
      updateGoogleConsent(stored);
      if (stored === "granted") captureAcquisition();
      return;
    }

    setVisible(true);
  }, [enabled]);

  if (!enabled || !visible) return null;

  const choose = (choice: ConsentChoice) => {
    persistConsent(choice);
    updateGoogleConsent(choice);
    if (choice === "granted") captureAcquisition();
    else clearAcquisition();
    setVisible(false);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl border border-[#dbe6ea] bg-white p-5 shadow-2xl sm:flex sm:items-center sm:gap-6">
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#0b1f33]">Datenschutz & Messung</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Wir verwenden Google Analytics und Google Ads, um Anfragen zu messen und unsere Werbung zu verbessern. Sie können zustimmen oder nur notwendige Funktionen verwenden.
          </p>
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="c24-button-secondary min-h-0 px-4 py-2.5 text-sm"
          >
            Nur notwendig
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="c24-button-primary min-h-0 px-4 py-2.5 text-sm"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
