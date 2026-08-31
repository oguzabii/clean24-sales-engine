import type { Metadata } from "next";

interface SeoConfig {
  title: string;
  description: string;
  keywords?: string[];
  path?: string;
  noindex?: boolean;
}

const BASE_URL = "https://www.clean-24.ch";

export function buildMetadata(config: SeoConfig): Metadata {
  const canonical = config.path ? `${BASE_URL}${config.path}` : BASE_URL;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(", "),
    alternates: {
      canonical,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
      siteName: "Clean24 Memis GmbH",
      locale: "de_CH",
      type: "website",
    },
    robots: config.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export const LOCAL_SEO_PAGES = {
  zuerich: {
    city: "Zürich",
    slug: "umzugsreinigung-zuerich",
    title: "Umzugsreinigung Zürich mit Abgabegarantie | Clean24",
    description:
      "Professionelle Umzugsreinigung in Zürich mit Abgabegarantie. Faire Preise, zuverlässiger Service. Richtpreis in 60 Sekunden berechnen.",
    intro:
      "Zürich zieht jährlich Tausende Mieter um – und die Abgabe der alten Wohnung ist oft mit Stress verbunden. Clean24 übernimmt Ihre Umzugsreinigung in Zürich zuverlässig, gründlich und mit Abgabegarantie.",
    keywords: [
      "Umzugsreinigung Zürich",
      "Endreinigung Zürich",
      "Wohnungsreinigung Zürich Abgabe",
      "Reinigung mit Abgabegarantie Zürich",
    ],
  },
  dietikon: {
    city: "Dietikon",
    slug: "umzugsreinigung-dietikon",
    title: "Umzugsreinigung Dietikon mit Abgabegarantie | Clean24",
    description:
      "Umzugsreinigung in Dietikon – Clean24 Memis GmbH hat den Firmensitz in Dietikon und kennt die lokalen Anforderungen genau. Jetzt Richtpreis berechnen.",
    intro:
      "Als in Dietikon ansässige Reinigungsfirma sind wir Ihr lokaler Partner für Umzugsreinigungen im Limmattal. Clean24 reinigt Ihre Wohnung in Dietikon professionell und garantiert die erfolgreiche Abgabe.",
    keywords: [
      "Umzugsreinigung Dietikon",
      "Endreinigung Dietikon",
      "Reinigungsfirma Dietikon",
      "Wohnungsreinigung Dietikon",
    ],
  },
  schlieren: {
    city: "Schlieren",
    slug: "umzugsreinigung-schlieren",
    title: "Umzugsreinigung Schlieren mit Abgabegarantie | Clean24",
    description:
      "Professionelle Umzugsreinigung in Schlieren. Mit Abgabegarantie und fairen Preisen ab CHF 750 inkl. MwSt. Jetzt Richtpreis berechnen.",
    intro:
      "Schlieren ist eine lebendige Stadt im Limmattal mit hoher Umzugsfrequenz. Clean24 bietet Ihnen in Schlieren eine professionelle Umzugsreinigung mit Abgabegarantie – schnell, sauber und zum fairen Preis.",
    keywords: [
      "Umzugsreinigung Schlieren",
      "Endreinigung Schlieren",
      "Reinigung Wohnung Schlieren",
      "Abgabegarantie Schlieren",
    ],
  },
  limmattal: {
    city: "Limmattal",
    slug: "umzugsreinigung-limmattal",
    title: "Umzugsreinigung Limmattal mit Abgabegarantie | Clean24",
    description:
      "Umzugsreinigung im Limmattal – Clean24 bedient das gesamte Limmattal: Dietikon, Schlieren, Urdorf, Spreitenbach und Umgebung. Mit Abgabegarantie.",
    intro:
      "Das Limmattal von Zürich bis Baden ist unser Heimmarkt. Clean24 reinigt Wohnungen in Dietikon, Schlieren, Urdorf, Spreitenbach, Weiningen und der gesamten Limmattaler Region – mit Abgabegarantie und lokaler Erfahrung.",
    keywords: [
      "Umzugsreinigung Limmattal",
      "Endreinigung Limmattal",
      "Reinigungsfirma Limmattal",
      "Umzugsreinigung Dietikon Schlieren",
    ],
  },
};
