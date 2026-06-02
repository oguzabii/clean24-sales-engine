import type { Metadata } from "next";
import UmzugsreinigungPageContent from "@/components/UmzugsreinigungPageContent";

export const metadata: Metadata = {
  title: "Umzugsreinigung mit Abgabegarantie in der Schweiz",
  description:
    "Professionelle Umzugsreinigung mit Abgabegarantie. Wir begleiten den Übergabetermin und klären reinigungsbezogene Punkte direkt. Richtpreis in 60 Sekunden, Einsätze in der ganzen Schweiz.",
  keywords:
    "Umzugsreinigung Schweiz, Endreinigung Schweiz, Abgabegarantie, Umzugsreinigung Zürich, Umzugsreinigung Bern, Umzugsreinigung Luzern",
  alternates: { canonical: "https://www.clean-24.ch/umzugsreinigung" },
};

export default function UmzugsreinigungPage() {
  return <UmzugsreinigungPageContent />;
}
