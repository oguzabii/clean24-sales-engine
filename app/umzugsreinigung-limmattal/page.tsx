import type { Metadata } from "next";
import LocalSeoPage from "@/components/LocalSeoPage";
import { LOCAL_SEO_PAGES, buildMetadata } from "@/lib/seo";

const page = LOCAL_SEO_PAGES.limmattal;

export const metadata: Metadata = buildMetadata({
  title: page.title,
  description: page.description,
  keywords: page.keywords,
  path: `/${page.slug}`,
});

export default function UmzugsreinigungLimmattlPage() {
  return (
    <LocalSeoPage
      city={page.city}
      slug={page.slug}
      headline="Umzugsreinigung mit Abgabegarantie im Limmattal"
      intro={page.intro}
    />
  );
}
