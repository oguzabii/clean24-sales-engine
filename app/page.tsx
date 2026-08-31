import type { Metadata } from "next";
import UmzugsreinigungPageContent from "@/components/UmzugsreinigungPageContent";

export const metadata: Metadata = {
  title: "Reinigung in Zürich & Umgebung | Umzug, Büro, Privat, Bau",
  description:
    "Online Anfrage für Umzugsreinigung, Büroreinigung, Privatreinigung, Baureinigung, Fensterreinigung und weitere Reinigungsarbeiten in Zürich und Umgebung. Umzugsreinigung mit Abgabegarantie.",
  keywords:
    "Reinigungsfirma Zürich, Umzugsreinigung Zürich, Büroreinigung Zürich, Privatreinigung, Baureinigung, Fensterreinigung",
  alternates: { canonical: "https://www.clean-24.ch" },
};

export default function HomePage() {
  return <UmzugsreinigungPageContent variant="home" />;
}
