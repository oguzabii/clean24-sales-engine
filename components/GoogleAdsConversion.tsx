"use client";

import { useEffect } from "react";

const CONSENT_STORAGE_KEY = "c24_google_consent";
const CONSENT_COOKIE = "c24_google_consent";
const CONVERSION_COOKIE = "c24_google_conversion";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function hasGrantedConsent(): boolean {
  if (window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted") return true;
  return readCookie(CONSENT_COOKIE) === "granted";
}

function clearConversionCookie() {
  document.cookie = `${CONVERSION_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export default function GoogleAdsConversion({
  conversionId,
  conversionLabel,
}: {
  conversionId?: string;
  conversionLabel?: string;
}) {
  useEffect(() => {
    if (!conversionId || !conversionLabel) return;
    if (!hasGrantedConsent()) return;

    const leadId = readCookie(CONVERSION_COOKIE);
    if (!leadId) return;

    const sentKey = `c24_gads_lead_conversion:${leadId}`;
    if (window.localStorage.getItem(sentKey) === "1") {
      clearConversionCookie();
      return;
    }

    const gtag = (window as GtagWindow).gtag;
    if (!gtag) return;

    gtag("event", "conversion", {
      send_to: `${conversionId}/${conversionLabel}`,
      transaction_id: leadId,
    });

    window.localStorage.setItem(sentKey, "1");
    clearConversionCookie();
  }, [conversionId, conversionLabel]);

  return null;
}
