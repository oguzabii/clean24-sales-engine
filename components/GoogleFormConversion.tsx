"use client";

import { useEffect } from "react";

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void;
};

function hasGrantedConsent(): boolean {
  if (window.localStorage.getItem("c24_google_consent") === "granted") return true;
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .some((part) => part === "c24_google_consent=granted");
}

export default function GoogleFormConversion({
  conversionId,
  conversionLabel,
}: {
  conversionId?: string;
  conversionLabel?: string;
}) {
  useEffect(() => {
    if (!conversionId || !conversionLabel) return;
    if (new URLSearchParams(window.location.search).get("m") === "review") return;
    if (!hasGrantedConsent()) return;

    const sentKey = "c24_umzugsreinigung_form_conversion_sent";
    if (window.sessionStorage.getItem(sentKey) === "1") return;

    const gtag = (window as GtagWindow).gtag;
    if (!gtag) return;

    gtag("event", "conversion", {
      send_to: `${conversionId}/${conversionLabel}`,
    });
    window.sessionStorage.setItem(sentKey, "1");
  }, [conversionId, conversionLabel]);

  return null;
}
