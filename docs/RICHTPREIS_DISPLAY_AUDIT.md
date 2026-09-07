# Richtpreis Display Audit

Move-out source: approved live Formular ab7011d18b886c7c641759db5faea2052ced4b9e, lib/constants.ts + lib/pricing.ts (unchanged).
Other services source: read-only OS 4a1aadda2f0175384c5e4fae535c0920a4457c2b, src/domain/pricing/multi-service/config-catalog.ts and engine.ts.

The OS rows below are offline reference outputs from approved shipped defaults, not a read of the active production DB revision. Runtime ranges come only from OS quote responses. No new-service price table is shipped to the browser.

## Move-out

| SERVICE | FORM_VARIANT | INPUTS | RANGE_MIN | RANGE_MAX | AUTOMATIC_OR_MANUAL | SOURCE |
|---|---|---|---:|---:|---|---|
| move_out_cleaning | wohnung, 1-1.5 | `{"apartment_size":"1-1.5","property_type":"wohnung"}` | 710 | 790 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 1-1.5 | `{"apartment_size":"1-1.5","property_type":"haus"}` | 910 | 990 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | wohnung, 2.5 | `{"apartment_size":"2.5","property_type":"wohnung"}` | 770 | 860 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 2.5 | `{"apartment_size":"2.5","property_type":"haus"}` | 970 | 1060 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | wohnung, 3.5 | `{"apartment_size":"3.5","property_type":"wohnung"}` | 890 | 990 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 3.5 | `{"apartment_size":"3.5","property_type":"haus"}` | 1090 | 1190 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | wohnung, 4.5 | `{"apartment_size":"4.5","property_type":"wohnung"}` | 1130 | 1250 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 4.5 | `{"apartment_size":"4.5","property_type":"haus"}` | 1330 | 1450 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | wohnung, 5.5 | `{"apartment_size":"5.5","property_type":"wohnung"}` | 1250 | 1380 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 5.5 | `{"apartment_size":"5.5","property_type":"haus"}` | 1450 | 1580 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | wohnung, 6.5+ | `{"apartment_size":"6.5+","property_type":"wohnung"}` | 1490 | 1640 | automatic | Historical approved live Formular guidance; OS binding price |
| move_out_cleaning | haus, 6.5+ | `{"apartment_size":"6.5+","property_type":"haus"}` | 1690 | 1840 | automatic | Historical approved live Formular guidance; OS binding price |

All seven selected addon surcharges and the endpoint-based Express rounding reuse the unchanged historical function. No local discount is applied. Display ranges are never sent as an Offer price.

## Service Range Matrix

Each row is checked through actual form-value mapping, the Formular quote adapter, the frozen OS input schema, and the pure OS pricing engine. The full form values are retained in tests/fixtures/richtpreis-os.json.

| SERVICE | FORM_VARIANT | INPUTS | RANGE_MIN | RANGE_MAX | AUTOMATIC_OR_MANUAL | SOURCE | WHY_MANUAL / OS_RULE_EVIDENCE |
|---|---|---|---:|---:|---|---|---|
| window_cleaning | normal, 18 m2, lamella=false | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"normal","lamella_blinds":false}]}` | 200 | 225 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | normal, 18 m2, lamella=true | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"normal","lamella_blinds":true}]}` | 560 | 615 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | balcony_door, 18 m2, lamella=false | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"balcony_door","lamella_blinds":false}]}` | 200 | 225 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | balcony_door, 18 m2, lamella=true | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"balcony_door","lamella_blinds":true}]}` | 560 | 615 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | floor_to_ceiling, 18 m2, lamella=false | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"floor_to_ceiling","lamella_blinds":false}]}` | 200 | 225 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | floor_to_ceiling, 18 m2, lamella=true | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"floor_to_ceiling","lamella_blinds":true}]}` | 560 | 615 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | other, 18 m2, lamella=false | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"other","lamella_blinds":false}]}` | 200 | 225 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | other, 18 m2, lamella=true | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":6,"window_type":"other","lamella_blinds":true}]}` | 560 | 615 | automatic | OS config-catalog.ts + engine.ts | - |
| window_cleaning | minimum job | `{"groups":[{"width_m":1,"height_m":1,"quantity":1,"window_type":"normal"}]}` | 200 | 225 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | 145 m2, 3 bathrooms, 4 floors, 1/month (monthly) | `{"floor_area_m2":145,"bathrooms":3,"floors":4,"visits_per_month":1}` | 325 | 360 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | 145 m2, 3 bathrooms, 4 floors, 2/month (monthly) | `{"floor_area_m2":145,"bathrooms":3,"floors":4,"visits_per_month":2}` | 650 | 720 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | 145 m2, 3 bathrooms, 4 floors, 4/month (monthly) | `{"floor_area_m2":145,"bathrooms":3,"floors":4,"visits_per_month":4}` | 1300 | 1435 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | 145 m2, 3 bathrooms, 4 floors, 8/month (monthly) | `{"floor_area_m2":145,"bathrooms":3,"floors":4,"visits_per_month":8}` | 2600 | 2865 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 1x_month (monthly) | `{"floor_area_m2":120,"recurrence":"1x_month"}` | 95 | 105 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 1x_month (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"1x_month"}` | 85 | 95 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 1x_month (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"1x_month"}` | 245 | 270 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 2x_month (monthly) | `{"floor_area_m2":120,"recurrence":"2x_month"}` | 190 | 210 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 2x_month (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"2x_month"}` | 170 | 190 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 2x_month (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"2x_month"}` | 330 | 360 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 1x_week (monthly) | `{"floor_area_m2":120,"recurrence":"1x_week"}` | 410 | 450 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 1x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"1x_week"}` | 370 | 410 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 1x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"1x_week"}` | 530 | 580 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 2x_week (monthly) | `{"floor_area_m2":120,"recurrence":"2x_week"}` | 815 | 895 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 2x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"2x_week"}` | 740 | 815 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 2x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"2x_week"}` | 895 | 985 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 3x_week (monthly) | `{"floor_area_m2":120,"recurrence":"3x_week"}` | 1220 | 1345 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 3x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"3x_week"}` | 1105 | 1220 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 3x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"3x_week"}` | 1265 | 1390 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 4x_week (monthly) | `{"floor_area_m2":120,"recurrence":"4x_week"}` | 1625 | 1790 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 4x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"4x_week"}` | 1475 | 1625 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 4x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"4x_week"}` | 1635 | 1795 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | 120 m2, 5x_week (monthly) | `{"floor_area_m2":120,"recurrence":"5x_week"}` | 2035 | 2235 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | staircase, 1 entrance, 3 floors, 6 units, 5x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"5x_week"}` | 1845 | 2030 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, 1 entrance, 3 floors, 6 units, 5x_week (monthly) | `{"entrances":1,"floors":3,"residential_units":6,"recurrence":"5x_week"}` | 2000 | 2200 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 1-1.5 rooms, 45 m2 | `{"object_type":"apartment","rooms":"1-1.5","floor_area_m2":45}` | 750 | 825 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 2-2.5 rooms, 70 m2 | `{"object_type":"apartment","rooms":"2-2.5","floor_area_m2":70}` | 850 | 935 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 3-3.5 rooms, 95 m2 | `{"object_type":"apartment","rooms":"3-3.5","floor_area_m2":95}` | 1000 | 1100 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 4-4.5 rooms, 120 m2 | `{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120}` | 1150 | 1265 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 5-5.5 rooms, 150 m2 | `{"object_type":"apartment","rooms":"5-5.5","floor_area_m2":150}` | 1400 | 1540 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | apartment, 6-6.5 rooms, 180 m2 | `{"object_type":"apartment","rooms":"6-6.5","floor_area_m2":180}` | 1600 | 1760 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | house, 3-3.5 rooms, 150 m2 | `{"object_type":"house","rooms":"3-3.5","floor_area_m2":150}` | 1400 | 1540 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | house, 4-4.5 rooms, 150 m2 | `{"object_type":"house","rooms":"4-4.5","floor_area_m2":150}` | 1600 | 1760 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | house, 5-5.5 rooms, 150 m2 | `{"object_type":"house","rooms":"5-5.5","floor_area_m2":150}` | 1900 | 2090 | automatic | OS config-catalog.ts + engine.ts | - |
| construction_cleaning | house, 6-6.5 rooms, 150 m2 | `{"object_type":"house","rooms":"6-6.5","floor_area_m2":150}` | 2200 | 2420 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 1-1.5 rooms, 45 m2 | `{"object_type":"apartment","rooms":"1-1.5","floor_area_m2":45}` | 500 | 550 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 2-2.5 rooms, 70 m2 | `{"object_type":"apartment","rooms":"2-2.5","floor_area_m2":70}` | 650 | 715 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 3-3.5 rooms, 95 m2 | `{"object_type":"apartment","rooms":"3-3.5","floor_area_m2":95}` | 850 | 935 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 4-4.5 rooms, 120 m2 | `{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120}` | 1100 | 1210 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 5-5.5 rooms, 150 m2 | `{"object_type":"apartment","rooms":"5-5.5","floor_area_m2":150}` | 1300 | 1430 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | apartment, 6-6.5 rooms, 180 m2 | `{"object_type":"apartment","rooms":"6-6.5","floor_area_m2":180}` | 1500 | 1650 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | house, 2-2.5 rooms, 150 m2 | `{"object_type":"house","rooms":"2-2.5","floor_area_m2":150}` | 1150 | 1265 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | house, 3-3.5 rooms, 150 m2 | `{"object_type":"house","rooms":"3-3.5","floor_area_m2":150}` | 1350 | 1485 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | house, 4-4.5 rooms, 150 m2 | `{"object_type":"house","rooms":"4-4.5","floor_area_m2":150}` | 1600 | 1760 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | house, 5-5.5 rooms, 150 m2 | `{"object_type":"house","rooms":"5-5.5","floor_area_m2":150}` | 1900 | 2090 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | house, 6-6.5 rooms, 150 m2 | `{"object_type":"house","rooms":"6-6.5","floor_area_m2":150}` | 2200 | 2420 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | commercial, 100 m2 | `{"object_type":"commercial","floor_area_m2":100}` | 750 | 830 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | commercial, strong, fully furnished, 100 m2 | `{"object_type":"commercial","floor_area_m2":100,"dirtiness":"strong","furnishing":"fully_furnished"}` | 1080 | 1190 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 1 m3, ground floor | `{"volume_m3":1}` | 450 | 500 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 25 m3, ground floor | `{"volume_m3":25}` | 2125 | 2340 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 25 m3, floor 1, no lift | `{"volume_m3":25,"floor_without_lift":1}` | 2235 | 2455 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 25 m3, floor 2, no lift | `{"volume_m3":25,"floor_without_lift":2}` | 2340 | 2575 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 25 m3, floor 3, no lift | `{"volume_m3":25,"floor_without_lift":3}` | 2445 | 2690 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | 25 m3, floor 4, no lift | `{"volume_m3":25,"floor_without_lift":4}` | 2550 | 2805 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | carpet, 40 m2 | `{"subtype":"carpet","area_m2":40}` | 480 | 530 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | carpet, 40 m2, stains and heavy dirt | `{"subtype":"carpet","area_m2":40,"strong_stains_pet_odor":true,"very_dirty":true}` | 880 | 970 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | high pressure, 30 m2 | `{"subtype":"high_pressure","area_m2":30}` | 300 | 330 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | garage, 300 m2, 2 oil spots | `{"subtype":"garage","area_m2":300,"oil_spots":2}` | 1660 | 1830 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | nicotine, apartment, 4-4.5 rooms, 120 m2 | `{"subtype":"nicotine","nicotine_base":{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120}}` | 1490 | 1640 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | mold | `{"subtype":"mold"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | mold_manual_review (engine.ts decision branch) |
| special_cleaning | disinfection | `{"subtype":"disinfection"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | disinfection_manual_review (engine.ts decision branch) |
| special_cleaning | graffiti_facade | `{"subtype":"graffiti_facade"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | graffiti_facade_manual_review (engine.ts decision branch) |
| window_cleaning | lift required | `{"groups":[{"width_m":1,"height_m":1,"quantity":1,"window_type":"normal"}],"lift_required":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | lift_required (engine.ts decision branch) |
| construction_cleaning | heavy cement | `{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120,"heavy_cement":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | heavy_cement (engine.ts decision branch) |
| deep_cleaning | extreme clutter | `{"object_type":"commercial","floor_area_m2":100,"extreme_clutter":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | extreme_clutter (engine.ts decision branch) |
| clearance_disposal | piano | `{"volume_m3":10,"piano":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | piano (engine.ts decision branch) |
| other_cleaning | unknown scope | `{}` | - | - | manual_review | OS config-catalog.ts + engine.ts | other_cleaning (engine.ts decision branch) |
| window_cleaning | mixed window groups with selected extras | `{"groups":[{"width_m":1.5,"height_m":1,"quantity":4,"window_type":"normal","lamella_blinds":true,"heavy_limescale_count":1},{"width_m":1,"height_m":2,"quantity":2,"window_type":"balcony_door","mold_count":1}]}` | 555 | 610 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | private selected extras (monthly) | `{"floor_area_m2":90,"visits_per_month":4,"oven_inside":true,"bed_count":2}` | 960 | 1060 | automatic | OS config-catalog.ts + engine.ts | - |
| private_cleaning | private area beyond configured band | `{"floor_area_m2":301,"visits_per_month":2}` | - | - | manual_review | OS config-catalog.ts + engine.ts | floor_area_over_300 (engine.ts decision branch) |
| private_cleaning | private mold | `{"floor_area_m2":90,"visits_per_month":2,"mold":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | mold (engine.ts decision branch) |
| office_cleaning | office selected rooms and workplaces (monthly) | `{"floor_area_m2":120,"recurrence":"2x_week","wc_count":2,"shower_count":1,"kitchen_count":1,"meeting_room_count":2,"workplaces":18,"floors":2,"reception_area":true,"high_traffic_customer_area":true}` | 1490 | 1640 | automatic | OS config-catalog.ts + engine.ts | - |
| office_cleaning | office medical hygiene | `{"floor_area_m2":120,"recurrence":"1x_week","medical_hygiene":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | medical_hygiene (engine.ts decision branch) |
| office_cleaning | office area beyond configured band | `{"floor_area_m2":1001,"recurrence":"1x_week"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | area_over_1000 (engine.ts decision branch) |
| construction_cleaning | construction unsupported house room band | `{"object_type":"house","rooms":"1-1.5","floor_area_m2":45}` | - | - | manual_review | OS config-catalog.ts + engine.ts | unsupported_house_room_band (engine.ts decision branch) |
| construction_cleaning | construction area beyond configured band | `{"object_type":"apartment","rooms":"6-6.5","floor_area_m2":1001}` | - | - | manual_review | OS config-catalog.ts + engine.ts | area_over_1000_or_invalid (engine.ts decision branch) |
| deep_cleaning | deep selected extras | `{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120,"furnishing":"partly_furnished","dirtiness":"strong","addons":["oven_inside","pet_hair"]}` | 1715 | 1885 | automatic | OS config-catalog.ts + engine.ts | - |
| deep_cleaning | deep unsupported house room band | `{"object_type":"house","rooms":"1-1.5","floor_area_m2":45}` | - | - | manual_review | OS config-catalog.ts + engine.ts | unsupported_object_or_room_band (engine.ts decision branch) |
| deep_cleaning | deep very strong or unclear | `{"object_type":"commercial","floor_area_m2":100,"dirtiness":"very_strong_unclear"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | very_strong_unclear (engine.ts decision branch) |
| facility_staircase_cleaning | staircase, selected shared areas (monthly) | `{"entrances":2,"floors":4,"residential_units":12,"recurrence":"2x_week","lift_cabin":true,"basement_corridor":true,"laundry_room":true,"bike_room":true,"exterior_entrance_area":true}` | 1835 | 2015 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility_basis, selected shared areas (monthly) | `{"entrances":2,"floors":4,"residential_units":12,"recurrence":"2x_week","lift_cabin":true,"basement_corridor":true,"laundry_room":true,"bike_room":true,"exterior_entrance_area":true}` | 2145 | 2360 | automatic | OS config-catalog.ts + engine.ts | - |
| facility_staircase_cleaning | facility winter service | `{"entrances":1,"floors":3,"recurrence":"1x_week","winter_service":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | winter_service (engine.ts decision branch) |
| clearance_disposal | clearance carrying and dismantling | `{"volume_m3":10,"floor_without_lift":2,"carrying_distance":"over_20m","complex_dismantling":true}` | 1105 | 1220 | automatic | OS config-catalog.ts + engine.ts | - |
| clearance_disposal | clearance volume beyond configured band | `{"volume_m3":41}` | - | - | manual_review | OS config-catalog.ts + engine.ts | unsupported_volume_or_access (engine.ts decision branch) |
| clearance_disposal | clearance fifth floor without lift | `{"volume_m3":10,"floor_without_lift":5}` | - | - | manual_review | OS config-catalog.ts + engine.ts | unsupported_volume_or_access (engine.ts decision branch) |
| clearance_disposal | clearance carrying over 50m | `{"volume_m3":10,"carrying_distance":"over_50m"}` | - | - | manual_review | OS config-catalog.ts + engine.ts | unsupported_volume_or_access (engine.ts decision branch) |
| special_cleaning | special delicate carpet | `{"subtype":"carpet","area_m2":40,"wool_delicate":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | wool_or_delicate_carpet (engine.ts decision branch) |
| special_cleaning | special natural stone | `{"subtype":"high_pressure","area_m2":30,"natural_stone":true}` | - | - | manual_review | OS config-catalog.ts + engine.ts | sensitive_or_unsupported_surface (engine.ts decision branch) |
| special_cleaning | special garage beyond configured band | `{"subtype":"garage","area_m2":1501}` | - | - | manual_review | OS config-catalog.ts + engine.ts | garage_manual_review (engine.ts decision branch) |
| special_cleaning | nicotine commercial | `{"subtype":"nicotine","nicotine_base":{"object_type":"commercial","floor_area_m2":100,"furnishing":"fully_furnished"}}` | 1290 | 1420 | automatic | OS config-catalog.ts + engine.ts | - |
| special_cleaning | very severe nicotine | `{"subtype":"nicotine","very_severe_nicotine":true,"nicotine_base":{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120}}` | - | - | manual_review | OS config-catalog.ts + engine.ts | nicotine_manual_review (engine.ts decision branch) |
| special_cleaning | nicotine extensive mold | `{"subtype":"nicotine","nicotine_base":{"object_type":"apartment","rooms":"4-4.5","floor_area_m2":120,"extensive_mold":true}}` | - | - | manual_review | OS config-catalog.ts + engine.ts | extensive_mold (engine.ts decision branch) |

## Input Coverage

Before-edit gap matrix: [RICHTPREIS_INPUT_GAPS.md](RICHTPREIS_INPUT_GAPS.md). All nine automatic categories (including unchanged move-out) now have complete customer input paths. ACCIDENTAL_MANUAL_REVIEW_GAPS=0.

Added only OS input questions: window groups/dimensions/type/lamella; supported recurring choices; construction/deep room bands; condition/furnishing; facility product/entrances/floors/units/shared areas; clearance volume/access; special subtype/area/nicotine base. Price-affecting extras and business exceptions use optional disclosure sections. Existing page, step flow, move-out controls and visual classes are retained.

Private offers exactly 1/2/4/8 visits per calendar month. Neither the frozen schema nor pricePrivate() supports calendar-week/fortnightly private contracts, so no weekly cadence is falsely relabelled as a fixed monthly count. Office/staircase/facility offer all seven OS recurrence keys; 52/12 normalization stays entirely in OS.

Missing/invalid required fields show an incomplete state and send no quote. Completed exceptions are sent to OS, not locally labelled manual. Manual-only special subtypes (mold, disinfection, graffiti_facade) and other_cleaning receive OS manual quotes with null endpoints. Evidence: priceSpecial() final branch and priceService() other_cleaning branch; no configured automatic formula exists for those cases at the frozen HEAD.

## Privacy and Authority

Public quotes allow only contract/category/variant/state and CHF range endpoints with their one-off/monthly basis. Exact totals, per-visit/monthly exact amounts, raw breakdown, discount calculations, scope, revisions and internal fields are not serialized. Manual quotes have null endpoints. OS failures return errors, never local offers or false submission success.

## Submission Boundary

Intake, private attachment delivery, address/Haus forwarding, discount transport, stable signed submission IDs, 8/60/30-second client timeouts and 90-second intake route remain unchanged. New service inputs and facility variant travel identically through quote and intake. No legacy dual-write or lifecycle SMTP is introduced.

This section records the original quote/input-only pass, not a production lifecycle E2E. Its optional-date mismatch is resolved in the subsequent [Final Contract Alignment And Capture E2E](FINAL_CONTRACT_CAPTURE_AUDIT.md) pass without changing prices. Private unsupported calendar-week intent still requires a separate OS product decision, not a Formular approximation.

## Verification In This Pass

- `npm test`: 161 tests passed, 0 failed, 0 skipped, across four test files. Includes 101 actual form-to-quote-to-mocked-intake cases, each with a repeated submission carrying one stable logical submission ID; all six move-out room bands and 3,072 room/property/addon/Express combinations.
- `scripts/audit-richtpreis.mjs`: 101 OS cases (76 automatic, 25 intentional manual), validated against the read-only OS schema and pure pricing code; plus 12 unchanged move-out property/room range rows. All nine automatic service categories are reachable, including both facility products and all four automatic special subtypes.
- `scripts/verify-richtpreis.mjs`: 424 checks passed at 1440x1000 desktop and 390x844 mobile. All 101 service cases passed on both viewports. Zero submissions, zero uploads, zero invalid OS quote requests, zero page errors. API responses were intercepted and produced by the real OS pure schema/engine, with no DB or mail access.
- Browser checks include incomplete inputs, clearing stale ranges, every supported recurrence, selected extras, manual exceptions, delayed stale responses, OS failures and no exact binding price display. Quote/intake response privacy is additionally tested through the real Formular server route handlers with mocked OS transport.
- Move-out button text and classes match the approved baseline exactly; control geometry matches within 0.02 CSS pixels (floating-point measurement tolerance). Homepage, global CSS, header/footer, public assets, move-out constants and pricing function are byte-for-byte unchanged from `ab7011d`.
- Screenshots were inspected for the existing design and readable desktop/mobile controls. Evidence remains in `.git/richtpreis-qa/`, outside the commit and deployment.
- `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check`: passed. Build generated 12 static pages. Existing parent-lockfile workspace-root warning remains; no parent files were changed.
- Attachment reference/retry, MIME/size/count, server-only authentication, address/Haus/discount, and 8/60/30-second timeout regressions pass. The intake route remains at 90 seconds. No lifecycle SMTP or legacy delivery path was added.
- OS remains read-only at `4a1aadda2f0175384c5e4fae535c0920a4457c2b`. No production DB writes, real email, migrations, production deployment, promotion, DNS or environment changes.

Input coverage is ready for a safe isolated E2E with synthetic data and capture delivery, not a production cutover. This pass deliberately did not exercise live customer intake or change its behavior.

Reproduce from the read-only OS directory using `node --import tsx <Formular>/scripts/audit-richtpreis.mjs <OS>` and `node --import tsx <Formular>/scripts/verify-richtpreis.mjs http://127.0.0.1:3168 <playwright-module> <OS>`. Browser verification requires a local Formular server and never submits forms. The audit regenerates the range matrix; the verification section above records this completed run.
