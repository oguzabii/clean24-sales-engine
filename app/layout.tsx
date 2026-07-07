import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      </body>
    </html>
  );
}
