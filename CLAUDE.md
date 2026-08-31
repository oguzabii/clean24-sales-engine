# Clean24 Sales Engine – CLAUDE.md

## Project Purpose

This is the public website and lead-generation funnel for **Clean24 Memis GmbH** (Dietikon, Switzerland). It is a Next.js App Router application that serves as a customer acquisition system for Umzugsreinigung (apartment moving-out cleaning) with Abgabegarantie (handover guarantee).

**Primary goal:** Generate qualified Umzugsreinigung leads and route them to the existing Clean24 Lead Autopilot system via webhook.

## Company Data

```
Clean24 Memis GmbH
Glanzenbergstrasse 26, 8953 Dietikon
info@clean-24.ch | +41 44 516 19 23
MwSt Nr.: CHE-260.909.323
```

## Architecture

```
clean24-sales-engine/
├── app/                         # Next.js App Router pages
│   ├── layout.tsx               # Root layout (Header, Footer)
│   ├── page.tsx                 # Homepage /
│   ├── umzugsreinigung/         # Main sales page
│   ├── umzugsreinigung-zuerich/ # Local SEO – Zürich
│   ├── umzugsreinigung-dietikon/# Local SEO – Dietikon
│   ├── umzugsreinigung-schlieren/
│   ├── umzugsreinigung-limmattal/
│   ├── checkliste-wohnungsabgabe/ # Lead magnet page
│   ├── danke/                   # Thank-you page after form submit
│   └── api/leads/website/       # POST route.ts – lead ingestion API
├── components/                  # Modular UI components
│   ├── Header.tsx               # Minimal fixed header (logo only)
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── TrustBadges.tsx
│   ├── ServiceCards.tsx
│   ├── PriceCalculator.tsx      # 3-step wizard (size → addons → contact)
│   ├── AddOnSelector.tsx
│   ├── LeadForm.tsx             # Contact + date form, POSTs to /api/leads/website
│   ├── FAQ.tsx                  # Accordion FAQ
│   ├── ProcessSteps.tsx
│   ├── CTASection.tsx
│   ├── ReviewPlaceholder.tsx
│   ├── LocalSeoPage.tsx         # Shared template for all local SEO pages
│   └── ChecklistMagnet.tsx      # Checklist email capture, POSTs to /api/checkliste
├── lib/
│   ├── constants.ts             # Company data, pricing, cities
│   ├── pricing.ts               # Price calculation logic
│   ├── lead-payload.ts          # Lead payload builder
│   └── seo.ts                   # Metadata helpers, LOCAL_SEO_PAGES config
└── .env.example                 # Env var documentation
```

## Business Rules

- **Abgabegarantie**: If the apartment fails the handover inspection due to our cleaning, we return at no charge. This must always be prominently featured.
- **Richtpreis, never Fixpreis**: The calculator always shows "Richtpreis". Final price is confirmed only after review. Always include the disclaimer: *"Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt."*
- **No unrealistic promises**: Copywriting must be trustworthy. Do not promise specific guarantees that aren't backed by business process.
- **German Swiss business tone**: Formal (Sie-Form), clear, premium.

## Pricing Rules

All prices incl. 8.1% MwSt. ("Alle Preise inkl. 8.1% MwSt.").

Base prices (ab = starting from):
| Zimmer | CHF  |
|--------|------|
| 1–1.5  | 750  |
| 2.5    | 880  |
| 3.5    | 1150 |
| 4.5    | 1290 |
| 5.5    | 1360 |
| 6.5+   | 1630 |

Add-ons (fixed surcharges):
- Hochdruckreinigung Terrasse / Aussenbereich: +200
- Starke Kalkablagerungen / Spezial-Entkalkung: +150
- Raucherwohnung / Nikotinrückstände: +390
- Haustier-Spezialreinigung: +200
- Teppich- oder Spannteppichreinigung: +120
- Grosser Keller / Hobbyraum / Nebenraum: +100
- Wintergarten / sehr viele Fensterflächen: +250
- Express: +15% on subtotal

Price range displayed = [subtotal, subtotal × 1.1] rounded to nearest 10.

All pricing logic lives in `lib/pricing.ts`. Prices in `lib/constants.ts`. **Never hardcode prices in components.**

## Lead Flow

1. User interacts with `PriceCalculator` or `LeadForm`
2. Form POSTs to `POST /api/leads/website`
3. API validates required fields, builds payload via `lib/lead-payload.ts`
4. In development: logs payload to console
5. If `CLEAN24_LEAD_WEBHOOK_URL` is set: POSTs to webhook with `x-webhook-secret` header
6. Webhook errors are caught and logged — they do NOT cause user-facing errors
7. User is redirected to `/danke`

Lead payload includes: source, service_type, customer data, apartment details, addons, estimated price range, UTM params, created_at.

## Webhook Integration

```bash
# .env.local (never commit)
CLEAN24_LEAD_WEBHOOK_URL=https://your-autopilot-endpoint
CLEAN24_LEAD_WEBHOOK_SECRET=your-secret
```

The webhook receiver should expect `POST` with `Content-Type: application/json` and `x-webhook-secret` header.

## SEO Strategy

Target keywords: Umzugsreinigung Zürich, Endreinigung Zürich, Reinigung mit Abgabegarantie, Reinigungsfirma Dietikon, Umzugsreinigung Limmattal.

Local SEO pages share layout via `LocalSeoPage.tsx`. Add new cities by extending `LOCAL_SEO_PAGES` in `lib/seo.ts`.

## Tracking Placeholders

All tracking is placeholder-only in v0.1. See `app/layout.tsx` for comments. Activate in v0.2 by:
1. Adding `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var
2. Adding Google Ads conversion tag
3. Adding `NEXT_PUBLIC_FB_PIXEL_ID` for Meta Pixel

## DO NOT TOUCH

**This project must never modify or interfere with the Clean24 Lead Autopilot admin system.** The webhook integration is one-way: this site POSTs lead data outbound. It does not read from or write to the admin database.

## v0.2 Roadmap

- Automatic confirmation email to customer after lead submission
- PDF Offerte draft generation
- Review funnel (post-service email asking for Google review)
- Google Ads conversion tracking (GA4 + gAds tag)
- Meta Pixel retargeting
- Online deposit / booking confirmation flow
- Add-on checkout (e.g. pay for express online)
- A/B testing on hero CTAs
