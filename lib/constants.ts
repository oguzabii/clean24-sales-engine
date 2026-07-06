export const COMPANY = {
  name: "Clean24 Memis GmbH",
  address: "Glanzenbergstrasse 26",
  city: "8953 Dietikon",
  email: "info@clean-24.ch",
  phone: "+41 44 516 19 23",
  phoneDisplay: "+41 44 516 19 23",
  whatsapp: "+41766080055",
  website: "www.clean-24.ch",
  mwst: "CHE-260.909.323",
} as const;

/** Base prices per apartment size, incl. 8.1% MwSt. */
export const BASE_PRICES: Record<string, number> = {
  "1-1.5": 750,
  "2.5": 880,
  "3.5": 1150,
  "4.5": 1290,
  "5.5": 1360,
  "6.5+": 1630,
};

export const APARTMENT_SIZE_LABELS: Record<string, string> = {
  "1-1.5": "1–1.5 Zimmer",
  "2.5": "2.5 Zimmer",
  "3.5": "3.5 Zimmer",
  "4.5": "4.5 Zimmer",
  "5.5": "5.5 Zimmer",
  "6.5+": "6.5+ Zimmer",
};

/**
 * Add-on catalogue. Fixed surcharges, incl. 8.1% MwSt.
 */
export interface AddOn {
  key: string;
  label: string;
  description: string;
  price: number;
}

export const ADDONS: AddOn[] = [
  {
    key: "terrace_pressure",
    label: "Hochdruckreinigung Terrasse / Aussenbereich",
    description: "Für stark verschmutzte Aussenflächen, Terrassen oder Balkonböden.",
    price: 200,
  },
  {
    key: "limescale_heavy",
    label: "Starke Kalkablagerungen / Spezial-Entkalkung",
    description: "Bei sehr hartem Wasser oder stark verkalkten Bereichen.",
    price: 150,
  },
  {
    key: "smoker",
    label: "Raucherwohnung / Nikotinrückstände",
    description: "Spezialbehandlung bei Nikotinverfärbungen und Geruchsrückständen.",
    price: 390,
  },
  {
    key: "pet",
    label: "Haustier-Spezialreinigung",
    description: "Entfernung von Tierhaaren und Geruch in normalem Ausmass.",
    price: 200,
  },
  {
    key: "carpet",
    label: "Teppich- oder Spannteppichreinigung",
    description: "Tiefenreinigung von Teppichböden, Preis je nach Fläche.",
    price: 120,
  },
  {
    key: "large_cellar",
    label: "Grosser Keller / Hobbyraum / Nebenraum",
    description: "Für überdurchschnittlich grosse oder zusätzliche Nebenräume.",
    price: 100,
  },
  {
    key: "wintergarden",
    label: "Wintergarten / sehr viele Fensterflächen",
    description: "Bei überdurchschnittlich vielen Fensterflächen oder Wintergarten.",
    price: 250,
  },
];

export const ADDON_KEYS: string[] = ADDONS.map((a) => a.key);

/** Map of key -> AddOn for O(1) lookups in pricing. */
export const ADDONS_BY_KEY: Record<string, AddOn> = ADDONS.reduce(
  (acc, a) => {
    acc[a.key] = a;
    return acc;
  },
  {} as Record<string, AddOn>
);

/**
 * Legacy add-on price map. Retained for any older imports — current calculator
 * reads from `ADDONS` / `ADDONS_BY_KEY` directly. Do not extend this map.
 */
export const ADDON_PRICES = {
  balcony: 80,
  cellar: 80,
  oven_heavy: 60,
  blinds: 120,
} as const;

export const EXPRESS_SURCHARGE = 0.15;

/**
 * Fixed surcharge (CHF, incl. MwSt.) added to BOTH ends of the displayed
 * Richtpreis range when the object is a house instead of an apartment.
 */
export const HOUSE_SURCHARGE = 200;

export const PRICE_RANGE_MARGIN = 0.1;

export const CITIES = [
  "Zürich",
  "Dietikon",
  "Schlieren",
  "Urdorf",
  "Spreitenbach",
  "Weiningen",
  "Geroldswil",
  "Oberengstringen",
  "Uitikon",
  "Birmensdorf",
  "Aesch",
  "Rudolfstetten",
  "Baden",
  "Wettingen",
  "Zürich-Altstetten",
  "Zürich-Höngg",
  "Zürich-Wiedikon",
] as const;

/**
 * Service positioning – schweizweit. Used by the region chip section.
 * `primary` marks the regions we name first; the rest signal national reach.
 */
export const SERVICE_AREAS: { label: string; primary?: boolean }[] = [
  { label: "Zürich", primary: true },
  { label: "Bern", primary: true },
  { label: "Basel", primary: true },
  { label: "Luzern", primary: true },
  { label: "St. Gallen", primary: true },
  { label: "Aargau" },
  { label: "Zug" },
  { label: "Solothurn" },
  { label: "Schwyz" },
  { label: "Thurgau" },
  { label: "Winterthur" },
  { label: "Limmattal" },
];

/**
 * Manually configurable marketing/status values for the "Heute bei Clean24"
 * operations card. These are NOT live system metrics.
 *
 * The three `today*` fields represent the END-OF-DAY TARGET. The dashboard
 * scales them linearly from 0 → target across business hours so totals appear
 * to rise through the day. After hours, totals stay at target and active
 * teams drop to 0. See `components/LiveOperations.tsx` for the math.
 */
export const LIVE_OPS = {
  todayCleaningsCompleted: 8,
  todayOffersSent: 21,
  todayRequestsReceived: 29,
  teamsCurrentlyActiveDaytime: 5,
  nextAvailableSlotText: "morgen ab 08:00",
  businessHoursStart: 8, // 08:00
  businessHoursEnd: 20, // 20:00
} as const;

/**
 * Static activity feed entries shown in the live ticker. Generic by design —
 * no customer names, no specific addresses. Edit copy here to refresh.
 */
export const ACTIVITY_FEED: { label: string; detail: string; timeAgo: string }[] = [
  { label: "Offerte vorbereitet", detail: "Umzugsreinigung 3.5 Zimmer", timeAgo: "vor wenigen Minuten" },
  { label: "WhatsApp-Anfrage erhalten", detail: "Fotos zur Ersteinschätzung", timeAgo: "vor 9 Minuten" },
  { label: "Checkliste versendet", detail: "Wohnungsabgabe-Checkliste", timeAgo: "vor 17 Minuten" },
  { label: "Team eingeplant", detail: "Endreinigung mit Abgabebegleitung", timeAgo: "vor 24 Minuten" },
  { label: "Umzugsreinigung bestätigt", detail: "Termin koordiniert", timeAgo: "vor 36 Minuten" },
  { label: "Neue Anfrage erhalten", detail: "Wohnungsabgabe in der Schweiz", timeAgo: "vor 48 Minuten" },
  { label: "Foto-Einschätzung versendet", detail: "Richtpreis nach Prüfung", timeAgo: "vor 1 Stunde" },
  { label: "Offerte versendet", detail: "Umzugsreinigung 2.5 Zimmer", timeAgo: "vor 1 Stunde 20 Min." },
];

export const SEO_KEYWORDS = {
  primary: [
    "Umzugsreinigung Zürich",
    "Endreinigung Zürich",
    "Wohnungsreinigung Abgabe",
    "Reinigung mit Abgabegarantie",
    "Reinigungsfirma Dietikon",
    "Umzugsreinigung Schlieren",
    "Umzugsreinigung Limmattal",
    "Umzugsreinigung Aargau",
    "Umzugsreinigung Zug",
  ],
};
