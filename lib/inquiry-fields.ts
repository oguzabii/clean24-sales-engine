import type { LeadFormData } from "./lead-payload";

// Customer questions and enum values only. All tariffs, thresholds and effort
// calculations remain in OS at the frozen quote contract.
export interface InputOption { value: string; label: string }
export interface InquiryField {
  key: string;
  label: string;
  kind: "number" | "select" | "checkbox" | "multi";
  required?: boolean;
  min?: number;
  integer?: boolean;
  options?: InputOption[];
}
const number = (key: string, label: string, min = 0, required = false, integer = true): InquiryField =>
  ({ key, label, kind: "number", min, required, integer });
const select = (key: string, label: string, options: InputOption[], required = false): InquiryField =>
  ({ key, label, kind: "select", options, required });
const flag = (key: string, label: string): InquiryField => ({ key, label, kind: "checkbox" });
const flags = (items: [string, string][]): InquiryField[] => items.map(([key, label]) => flag(key, label));

export const ROOM_BANDS: InputOption[] = ["1-1.5", "2-2.5", "3-3.5", "4-4.5", "5-5.5", "6-6.5"]
  .map((value) => ({ value, label: `${value.replace("-", "\u2013")} Zimmer` }));
export const PRIVATE_RECURRENCES: InputOption[] = [1, 2, 4, 8]
  .map((n) => ({ value: `${n}x_month`, label: `${n}x pro Monat` }));
export const CONTRACT_RECURRENCES: InputOption[] = [
  ...PRIVATE_RECURRENCES.slice(0, 2),
  ...[1, 2, 3, 4, 5].map((n) => ({ value: `${n}x_week`, label: `${n}x pro Woche` })),
];
export const SPECIAL_SUBTYPES: InputOption[] = [
  { value: "carpet", label: "Teppichreinigung" },
  { value: "high_pressure", label: "Hochdruckreinigung" },
  { value: "garage", label: "Garage / Parking" },
  { value: "nicotine", label: "Nikotinreinigung" },
  { value: "mold", label: "Schimmelbehandlung" },
  { value: "disinfection", label: "Desinfektion" },
  { value: "graffiti_facade", label: "Graffiti / Fassade" },
];
export const WINDOW_GROUP_FIELDS: InquiryField[] = [
  number("width_m", "Breite pro Fenster in m", 0, true, false),
  number("height_m", "H\u00f6he pro Fenster in m", 0, true, false),
  number("quantity", "Anzahl gleich grosser Fenster", 1, true),
  select("window_type", "Fensterart", [
    { value: "normal", label: "Standardfenster" },
    { value: "balcony_door", label: "Balkont\u00fcr" },
    { value: "floor_to_ceiling", label: "Bodentiefes Fenster" },
    { value: "other", label: "Andere Fensterart" },
  ], true),
  flag("lamella_blinds", "Lamellenstoren mitreinigen"),
  number("heavy_limescale_count", "Fenster mit starken Kalkspuren"),
  number("mold_count", "Fenster mit lokalen Schimmelspuren"),
];

export function recurrenceOptionsFor(category: string): InputOption[] | null {
  if (category === "private_cleaning") return PRIVATE_RECURRENCES;
  return ["office_cleaning", "facility_staircase_cleaning"].includes(category) ? CONTRACT_RECURRENCES : null;
}

export function needsFloorArea(category: string, subtype?: unknown): boolean {
  return ["private_cleaning", "office_cleaning", "construction_cleaning", "deep_cleaning"].includes(category)
    || (category === "special_cleaning" && ["carpet", "high_pressure", "garage", "nicotine"].includes(String(subtype)));
}

const rooms = select("rooms", "Wie viele Zimmer?", ROOM_BANDS, true);
const deepFields: InquiryField[] = [
  select("dirtiness", "Verschmutzungsgrad", [
    { value: "normal", label: "Normal" }, { value: "strong", label: "Stark" },
    { value: "very_strong_unclear", label: "Sehr stark / unklar" },
  ]),
  select("furnishing", "M\u00f6blierung", [
    { value: "empty", label: "Leer" }, { value: "partly_furnished", label: "Teilm\u00f6bliert" },
    { value: "fully_furnished", label: "M\u00f6bliert" },
  ]),
];
const deepExtras: InquiryField = { key: "addons", label: "Zusatzleistungen", kind: "multi", options: [
  { value: "oven_inside", label: "Backofen innen" }, { value: "fridge_inside", label: "K\u00fchlschrank innen" },
  { value: "kitchen_cabinets_inside", label: "K\u00fcchenschr\u00e4nke innen" },
  { value: "strong_limescale", label: "Starke Kalkablagerungen" },
  { value: "strong_grease_kitchen", label: "Starke Fettablagerungen in der K\u00fcche" },
  { value: "pet_hair", label: "Tierhaare" }, { value: "nicotine", label: "Nikotin" },
  { value: "large_cellar_hobby", label: "Grosser Keller / Hobbyraum" },
  { value: "balcony_terrace_intensive", label: "Balkon / Terrasse intensiv" },
  { value: "pressure_wash_terrace", label: "Hochdruckreinigung Terrasse" },
] };

const DEEP_RISKS = flags([
  ["extreme_clutter", "Extrem zugestellt / Messie-Zustand"], ["extensive_mold", "Grossfl\u00e4chiger Schimmel"],
  ["fire_smoke_damage", "Brand- oder Rauchschaden"], ["unknown_chemicals", "Unbekannte Chemikalien"],
  ["special_floor", "Empfindlicher Spezialboden"], ["extreme_grease_limescale", "Extreme Fett- oder Kalkablagerungen"],
  ["large_furniture_movement", "Grosse M\u00f6bel m\u00fcssen verschoben werden"],
  ["industrial_equipment", "Industrieanlagen"], ["unclear_state", "Zustand unklar"],
]);
const RISKS: Record<string, InquiryField[]> = {
  window_cleaning: flags([
    ["lift_required", "Hebeb\u00fchne erforderlich"], ["inaccessible_outside", "Aussenseite nicht zug\u00e4nglich"],
    ["unusual_height", "Ungew\u00f6hnliche H\u00f6he"], ["facade_glazing", "Fassadenverglasung"],
    ["wintergarten", "Wintergarten"], ["construction_glue", "Baukleber"], ["silicone_residue", "Silikonreste"],
    ["paint_residue", "Farbreste"], ["cement_residue", "Zementreste"], ["damaged_frames", "Besch\u00e4digte Rahmen"],
    ["severe_or_unclear_mold", "Starker oder unklarer Schimmel"], ["special_glazing", "Spezialverglasung"],
    ["customer_unsure", "Zug\u00e4nglichkeit / Zustand unklar"],
  ]),
  private_cleaning: flags([
    ["strong_contamination", "Sehr starke Verschmutzung"], ["mold", "Schimmel"],
    ["extreme_clutter", "Extrem zugestellt"], ["construction_state", "Bau- oder Renovationszustand"],
    ["unusual_requirements", "Besondere Anforderungen"],
  ]),
  office_cleaning: flags([
    ["medical_hygiene", "Medizinische Hygieneanforderungen"], ["gastro_food", "Gastronomie / Lebensmittel"],
    ["industry_workshop", "Industrie / Werkstatt"], ["heavy_contamination", "Sehr starke Verschmutzung"],
    ["machine_cleaning", "Maschinelle Spezialreinigung"], ["special_disinfection", "Spezialdesinfektion"],
    ["complex_multibuilding", "Komplex mit mehreren Geb\u00e4uden"], ["special_security", "Besondere Sicherheitsvorgaben"],
    ["sensitive_floor", "Empfindlicher Boden"], ["unclear_scope", "Leistungsumfang unklar"],
  ]),
  construction_cleaning: flags([
    ["heavy_cement", "Starke Zementreste"], ["heavy_silicone", "Starke Silikonreste"],
    ["heavy_glue", "Starke Klebereste"], ["heavy_paint", "Starke Farbreste"],
    ["protective_film", "Schutzfolien entfernen"], ["damaged_sensitive_surfaces", "Besch\u00e4digte / empfindliche Fl\u00e4chen"],
    ["lift_required", "Hebeb\u00fchne erforderlich"], ["inaccessible_glass", "Nicht zug\u00e4ngliche Glasfl\u00e4chen"],
    ["facade_glazing", "Fassadenverglasung"], ["construction_waste", "Bauschutt entsorgen"],
    ["dangerous_substances", "Gefahrstoffe"], ["asbestos_suspicion", "Asbestverdacht"],
    ["fire_chemical_damage", "Brand- oder Chemieschaden"], ["industrial_facility", "Industrieanlage"],
    ["active_site", "Bauarbeiten noch im Gang"], ["unclear_scope", "Leistungsumfang unklar"],
  ]),
  deep_cleaning: DEEP_RISKS,
  facility_staircase_cleaning: flags([
    ["garden_maintenance", "Gartenpflege"], ["lawn_mowing", "Rasenm\u00e4hen"],
    ["winter_service", "Winterdienst"], ["snow_clearing", "Schneer\u00e4umung"],
    ["emergency_duty", "Pikettdienst"], ["technical_repairs", "Technische Reparaturen"],
    ["large_garage", "Grosse Tiefgarage"], ["complex_technical_services", "Komplexe technische Leistungen"],
  ]),
  clearance_disposal: flags([
    ["piano", "Klavier / Fl\u00fcgel"], ["safe", "Tresor"], ["heavy_machinery", "Schwere Maschinen"],
    ["chemicals", "Chemikalien"], ["paint_solvents", "Farben / L\u00f6sungsmittel"], ["asbestos", "Asbest"],
    ["medical_waste", "Medizinische Abf\u00e4lle"], ["industrial_appliances", "Industrieger\u00e4te"],
    ["extreme_waste", "Extreme Abfallmenge"], ["hygiene_contamination", "Hygienisch belastetes Material"],
    ["pests", "Sch\u00e4dlingsbefall"], ["construction_rubble", "Bauschutt"],
    ["unclear_volume", "Menge unklar"], ["difficult_access", "Besonders schwieriger Zugang"],
  ]),
};

export function inquiryFields(data: Partial<LeadFormData>): { main: InquiryField[]; extras: InquiryField[]; risks: InquiryField[] } {
  const category = data.service_category ?? "";
  const subtype = data.pricing_inputs?.subtype;
  let main: InquiryField[] = [], extras: InquiryField[] = [];
  let risks = RISKS[category] ?? [];
  if (category === "private_cleaning") {
    extras = [number("bathrooms", "Anzahl Badezimmer / WC", 1), number("floors", "Etagen im Objekt", 1),
      number("bed_count", "Betten frisch beziehen"), ...flags([
        ["oven_inside", "Backofen innen"], ["fridge_inside", "K\u00fchlschrank innen"],
        ["kitchen_cabinets_inside", "K\u00fcchenschr\u00e4nke innen"], ["cellar_hobby_up_to_20", "Keller / Hobbyraum bis 20 m\u00b2"],
        ["balcony_terrace_up_to_15", "Balkon / Terrasse bis 15 m\u00b2"], ["strong_pet_hair", "Starke Tierhaare"],
      ])];
  } else if (category === "office_cleaning") {
    extras = [number("wc_count", "Anzahl WC"), number("shower_count", "Anzahl Duschen"),
      number("kitchen_count", "Anzahl K\u00fcchen / Pausenr\u00e4ume"), number("meeting_room_count", "Anzahl Sitzungszimmer"),
      number("workplaces", "Anzahl Arbeitspl\u00e4tze"), number("floors", "Etagen im Objekt", 1),
      flag("reception_area", "Empfangsbereich"), flag("high_traffic_customer_area", "Stark besuchter Kundenbereich")];
  } else if (category === "construction_cleaning") {
    main = [rooms];
  } else if (category === "deep_cleaning" || (category === "special_cleaning" && subtype === "nicotine")) {
    main = [...(data.object_type && data.object_type !== "buero_gewerbe" ? [rooms] : []), ...deepFields];
    extras = [subtype === "nicotine" ? { ...deepExtras, options: deepExtras.options!.filter((o) => o.value !== "nicotine") } : deepExtras];
    risks = DEEP_RISKS;
  } else if (category === "facility_staircase_cleaning") {
    main = [number("entrances", "Anzahl Hauseing\u00e4nge", 1, true), number("floors", "Anzahl Etagen", 1, true),
      number("residential_units", "Anzahl Wohneinheiten")];
    extras = flags([["lift_cabin", "Liftkabine"], ["basement_corridor", "Kellergang"],
      ["laundry_room", "Waschk\u00fcche"], ["bike_room", "Veloraum"], ["exterior_entrance_area", "Eingangsbereich aussen"]]);
    if (data.facility_product !== "facility_basis") risks = [];
  } else if (category === "clearance_disposal") {
    main = [number("volume_m3", "Wie gross ist die Menge in m\u00b3?", 0, true, false),
      select("floor_without_lift", "Etage / Lift", [
        { value: "0", label: "Erdgeschoss / mit geeignetem Lift" },
        ...[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}. Etage ohne Lift` })),
        { value: "5", label: "5. Etage oder h\u00f6her ohne Lift" },
      ]), select("carrying_distance", "Trageweg zum Fahrzeug", [
        { value: "normal", label: "Bis 20 m" }, { value: "over_20m", label: "\u00dcber 20 bis 50 m" },
        { value: "over_50m", label: "\u00dcber 50 m" },
      ])];
    extras = [flag("complex_dismantling", "Aufwendige M\u00f6beldemontage")];
  } else if (category === "special_cleaning") {
    if (subtype === "carpet") {
      extras = flags([["strong_stains_pet_odor", "Starke Flecken / Tiergeruch"], ["very_dirty", "Starke Verschmutzung"]]);
      risks = [flag("wool_delicate", "Wolle / empfindlicher Teppich")];
    } else if (subtype === "high_pressure") {
      risks = flags([["natural_stone", "Naturstein"], ["wood", "Holz"],
        ["coated_sensitive", "Empfindlich beschichtete Fl\u00e4che"], ["facade", "Fassade"]]);
    } else if (subtype === "garage") {
      main = [number("oil_spots", "Anzahl lokaler \u00d6lflecken")];
      risks = flags([["heavy_oil_chemical", "Starke \u00d6l- / Chemier\u00fcckst\u00e4nde"], ["special_wastewater", "Spezielle Abwasserentsorgung"],
        ["sensitive_coating", "Empfindliche Beschichtung"], ["active_traffic", "Laufender Fahrbetrieb"],
        ["floor_marking", "Bodenmarkierungen bearbeiten"], ["extreme_contamination", "Extreme Verschmutzung"]]);
    }
  }
  return { main, extras, risks };
}
