import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Clean24 – Umzugsreinigung mit Abgabegarantie in der Schweiz",
    template: "%s | Clean24 Memis GmbH",
  },
  description:
    "Professionelle Umzugsreinigung mit Abgabegarantie. Clean24 begleitet die Wohnungsabgabe vor Ort und klärt reinigungsbezogene Punkte direkt. Einsätze in der ganzen Schweiz nach Verfügbarkeit.",
  keywords:
    "Umzugsreinigung Schweiz, Endreinigung Schweiz, Wohnungsreinigung Abgabe, Reinigung mit Abgabegarantie, Reinigungsfirma",
  authors: [{ name: "Clean24 Memis GmbH" }],
  creator: "Clean24 Memis GmbH",
  metadataBase: new URL("https://www.clean-24.ch"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        {/* Google Analytics placeholder – TODO: Replace GA_MEASUREMENT_ID */}
        {/* Google Ads conversion placeholder – TODO: Add conversion tag */}
        {/* Meta Pixel placeholder – TODO: Replace FB_PIXEL_ID */}
      </head>
      <body className={`${geist.className} antialiased`}>
        <Header />
        <main className="pt-16 md:pt-24">{children}</main>
        <Footer />
        <WhatsAppButton variant="floating" />
      </body>
    </html>
  );
}
