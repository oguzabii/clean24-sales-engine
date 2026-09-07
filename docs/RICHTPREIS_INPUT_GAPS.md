# Richtpreis Input Gap Matrix

Recorded before implementation from clean Formular `5eb9e59e317023eac4e41c82b7fe730ff6d467eb` and read-only OS `4a1aadda2f0175384c5e4fae535c0920a4457c2b`.

Sources: OS `src/lib/integrations/sales-engine/quote-contract.ts` (accepted inputs), `src/domain/pricing/multi-service/engine.ts` (actual decision branches), `config-catalog.ts` (shipped configuration keys/bands). Active production database values are not read or changed. Runtime prices continue to come from OS.

| SERVICE | OS_PRICING_MODE | REQUIRED_OS_INPUTS | FORM_CURRENTLY_COLLECTS | MISSING_INPUTS | CURRENT_RESULT | TARGET_RESULT |
|---|---|---|---|---|---|---|
| move_out_cleaning | Automatic, existing engine | rooms_key; selected property/addons/express | All required selections | None | Approved historical ranges | Identical ranges, OS binding price |
| window_cleaning | Automatic; explicit risk flags manual | groups[].width_m, height_m, positive integer quantity, window_type; lamella selection affects price | Generic object/area | Actual window groups, dimensions/count/type/lamella | No quote, misleading manual notice | Quote as soon as groups are complete; exceptions decided by OS |
| private_cleaning | Automatic monthly; risk/area/effort exceptions manual | floor_area_m2; visits_per_month exactly 1/2/4/8 | Area, generic cadence/count | Clearly labelled supported monthly choices; optional bathroom/floor/extra effort inputs | Only explicit supported monthly combination quotes | All four supported monthly choices quote; no weekly/fortnightly equivalence invented |
| office_cleaning | Automatic monthly; risk/area exceptions manual | floor_area_m2; recurrence 1x/2x_month or 1x..5x_week | Area, generic cadence/count | Exact supported cadence options; selected room/workplace/floor effort inputs | Compatible combinations only | All seven recurrences quote; normalization stays in OS |
| construction_cleaning | Automatic; unsupported house bands, area, risks manual | object_type apartment/house; rooms (six schema bands); floor_area_m2 | Generic object/area | Residential object options + room band; construction condition | No quote | All configured apartment/house bands quote; unsupported bands reviewed by OS |
| deep_cleaning | Automatic; unsupported bands/condition/risk manual | object_type apartment/house/commercial; floor_area_m2; residential rooms | Object/area | Residential room band; condition/furnishing selections | Commercial only | Apartment, house and commercial quote; actual condition carried |
| facility_staircase_cleaning | Automatic monthly for staircase and facility_basis; facility exceptions manual | service_variant; entrances; floors; recurrence (same seven as office); units/shared areas affect effort | Generic object/area/cadence | Product, entrances/floors/units and shared areas; exact cadence | No quote | Both products and every supported cadence quote |
| clearance_disposal | Automatic; volume/access/risk exceptions manual | volume_m3; access/floor/dismantling affect price | Generic object/area | Volume, lift/floor/carrying access | No quote | Real volume/access quote; no guessed volume or unit conversion |
| special_cleaning | Automatic carpet/high_pressure/garage/nicotine; other three subtypes manual | subtype; area_m2 for first three; nicotine_base with deep object/area/residential rooms | Generic object/area | Subtype and matching dimensions/conditions; nicotine base | No quote | Four automatic subtypes reachable; mold/disinfection/graffiti_facade genuinely manual |
| other_cleaning | Manual only | No price dimensions | Generic inquiry context | No price question is missing | No quote token; generic manual notice | OS returns manual quote, null range, normal inquiry context retained |

## Recurrence Evidence

`quote-contract.ts` accepts only `1 | 2 | 4 | 8` for private `visits_per_month`. `pricePrivate()` uses that exact count and returns `recurrenceType: monthly`; it has no weekly or fortnightly normalization. Therefore labels must say visits per month, not silently translate calendar weeks. Office/staircase/facility use the seven `recurrenceKey` values and `monthlyFromWeekly()` in OS. Formular only transports those keys.

## Manual-Only Evidence

`priceSpecial()` has automatic branches only for `carpet`, `high_pressure`, `garage`, `nicotine`; its final branch returns `<subtype>_manual_review`. `priceService()` explicitly returns `manual_review_v1` for `other_cleaning`. Configuration thresholds and risk flags remain OS decisions; the form must not clamp inputs into priceable bands.

## Scope Of This Pass

Add customer inputs and canonical transport only. Preserve move-out prices/layout, private attachments, intake/token/idempotency/timeouts, and no legacy/SMTP delivery. Browser QA must never submit. Missing/invalid inputs are incomplete, not an invented manual quote. No OS edits, new prices, production writes or cutover.

Historical limitation in that input-only pass: the inquiry date was labelled optional but the Formular intake route required `cleaning_date`. The subsequent final contract pass aligns those labels/validation and verifies the isolated capture path; see [Final Contract Alignment And Capture E2E](FINAL_CONTRACT_CAPTURE_AUDIT.md). Pricing inputs and ranges remain unchanged.
