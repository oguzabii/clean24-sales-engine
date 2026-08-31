"use client";

import { useEffect, useState } from "react";

const CONSENT_STORAGE_KEY = "c24_google_consent";
const CONSENT_COOKIE = "c24_google_consent";

type ConsentChoice = "granted" | "denied";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

function persistConsent(choice: ConsentChoice) {
  window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${choice}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
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

export default function ConsentBanner({ enabled }: { enabled: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored !== "granted" && stored !== "denied") setVisible(true);
  }, [enabled]);

  if (!enabled || !visible) return null;

  const choose = (choice: ConsentChoice) => {
    persistConsent(choice);
    updateGoogleConsent(choice);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:flex sm:items-center sm:gap-6">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900">Datenschutz & Messung</p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            Wir verwenden Google Analytics und Google Ads, um Anfragen zu messen und unsere Werbung zu verbessern. Sie können zustimmen oder nur notwendige Funktionen verwenden.
          </p>
        </div>
        <div className="mt-4 flex shrink-0 flex-col gap-2 sm:mt-0 sm:flex-row">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Nur notwendig
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Akzeptieren
          </button>
        </div>
      </div>
    </div>
  );
}
