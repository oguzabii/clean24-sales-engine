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
  const adsConversionId = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID?.trim();
  const googleTagId = adsConversionId || gaMeasurementId;
  const googleTrackingEnabled = Boolean(googleTagId);

  return (
    <html lang="de">
      <head>
        {googleTrackingEnabled && (
          <>
            <Script id="c24-google-consent-default" strategy="beforeInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = window.gtag || gtag;
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  analytics_storage: 'denied',
                  ad_user_data: 'denied',
                  ad_personalization: 'denied',
                  wait_for_update: 500
                });
                gtag('set', 'ads_data_redaction', true);
              `}
            </Script>
            <Script
              id="c24-google-tag-loader"
              src={`https://www.googletagmanager.com/gtag/js?id=${googleTagId}`}
              strategy="afterInteractive"
            />
            <Script id="c24-google-tag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                window.gtag = window.gtag || function(){dataLayer.push(arguments);};
                gtag('js', new Date());
                ${gaMeasurementId ? `gtag('config', '${gaMeasurementId}');` : ""}
                ${adsConversionId ? `gtag('config', '${adsConversionId}');` : ""}
              `}
            </Script>
          </>
        )}
      </head>
      <body className={`${geist.className} antialiased`}>
        <Header />
        <main className="pt-16 md:pt-24">{children}</main>
        <Footer />
        <ConsentBanner enabled={googleTrackingEnabled} />
      </body>
    </html>
  );
}
