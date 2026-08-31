import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ConsentBanner from "@/components/ConsentBanner";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Clean24 – Reinigung in Zürich & Umgebung | Umzug, Büro, Privat, Bau",
    template: "%s | Clean24 Memis GmbH",
  },
  description:
    "Online Anfrage für Umzugsreinigung, Büroreinigung, Privatreinigung, Baureinigung, Fensterreinigung und weitere Reinigungsarbeiten in Zürich und Umgebung. Umzugsreinigung mit Abgabegarantie.",
  keywords:
    "Reinigungsfirma Zürich, Umzugsreinigung Schweiz, Büroreinigung, Privatreinigung, Reinigung mit Abgabegarantie",
  authors: [{ name: "Clean24 Memis GmbH" }],
  creator: "Clean24 Memis GmbH",
  metadataBase: new URL("https://www.clean-24.ch"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  const googleAdsConversionId = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID?.trim();
  const googleTagId = gaMeasurementId || googleAdsConversionId;
  const trackingEnabled = Boolean(googleTagId);

  const consentDefaultScript = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = window.gtag || gtag;
    (function () {
      var stored = null;
      try { stored = window.localStorage.getItem('c24_google_consent'); } catch (_) {}
      var granted = stored === 'granted';
      gtag('consent', 'default', {
        ad_storage: granted ? 'granted' : 'denied',
        analytics_storage: granted ? 'granted' : 'denied',
        ad_user_data: granted ? 'granted' : 'denied',
        ad_personalization: granted ? 'granted' : 'denied',
        wait_for_update: 500
      });
    })();
  `;

  const configLines = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "window.gtag = window.gtag || gtag;",
    "gtag('js', new Date());",
    gaMeasurementId
      ? `gtag('config', ${JSON.stringify(gaMeasurementId)}, { anonymize_ip: true });`
      : "",
    googleAdsConversionId
      ? `gtag('config', ${JSON.stringify(googleAdsConversionId)});`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <html lang="de">
      <head>
        {trackingEnabled ? (
          <>
            <Script id="c24-google-consent-default" strategy="beforeInteractive">
              {consentDefaultScript}
            </Script>
            <Script
              id="c24-google-tag"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script id="c24-google-tag-config" strategy="afterInteractive">
              {configLines}
            </Script>
          </>
        ) : null}
      </head>
      <body className={`${geist.className} antialiased`}>
        <Header />
        <main className="pt-16 md:pt-24">{children}</main>
        <Footer />
        <ConsentBanner enabled={trackingEnabled} />
      </body>
    </html>
  );
}
