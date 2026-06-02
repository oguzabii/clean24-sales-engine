import { COMPANY } from "./constants";

export function buildWhatsAppUrl(message?: string): string {
  const number = COMPANY.whatsapp.replace(/\D/g, "");
  const defaultMessage =
    "Guten Tag, ich interessiere mich für eine Umzugsreinigung mit Abgabegarantie.";
  const text = encodeURIComponent(message ?? defaultMessage);
  return `https://wa.me/${number}?text=${text}`;
}

export function buildWhatsAppOfferUrl(
  name: string,
  apartmentSize: string,
  city: string
): string {
  const message = `Guten Tag, ich bin ${name} und suche eine Umzugsreinigung für eine ${apartmentSize}-Zimmer-Wohnung in ${city}. Können Sie mir ein Angebot machen?`;
  return buildWhatsAppUrl(message);
}
