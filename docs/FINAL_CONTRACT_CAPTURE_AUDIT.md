# Final Contract Alignment And Capture E2E

## Scope

- Formular start: `bda6c6da6dba4b4f09b43806e3d984c7a8d64da2`, clean `feature/formular-live-ui-os-engine-v1`.
- Read-only OS: `4a1aadda2f0175384c5e4fae535c0920a4457c2b`.
- No production cutover, production database access, real email, acceptance, job, partner request, invoice, or legacy changes.

## Release Decision

**NOT READY for controlled production cutover.** The required no-discount 3.5-room binding price is CHF 940, but the pinned OS produces **CHF 890** with its canonical test configuration. The displayed CHF 890-990 range is correct and unchanged. Formular must not override the OS result to make this check pass.

At the pinned OS commit, `src/domain/pricing/binding-price.ts:82` selects `visibleMin` when `confirmedDiscount` is false; its module documentation explicitly distinguishes minimum without discount from midpoint with confirmed discount. `src/domain/pricing/lead-pricing.ts:150` passes that condition, and `src/lib/services/pricing-quotes.ts:283` persists the resulting binding gross. The observed quote, accepted intake, offer, PDF and captured message all agree on CHF 890. No OS pricing formula or test price was changed.

Resolution requires an explicit OS commercial-contract decision or a corrected acceptance expectation, followed by another separately authorized isolated run. It cannot safely be resolved by adding a Formular price override.

## Date Contract

The actual OS Sales Engine envelope in `src/lib/integrations/sales-engine/intake-contract.ts` permits a null/missing `object.cleaning_date`. The older `docs/17_FORMULAR_INTAKE_CONTRACT.md` describes a different endpoint and is not the authority for this integration.

Formular's existing `app/api/leads/website/route.ts` already requires `cleaning_date` for every category. That was the mismatch: the inquiry UI called a date optional even though Formular itself would reject the submission.

The existing requirement is preserved. Both date inputs have associated labels, the existing required-star style, and native `required` validation. The submit handler also rejects a blank date before uploads, and the API rejects blank/non-string dates before OS access. The initial value remains empty. A minimum selectable date is not an automatically chosen date. Optional move-out handover date/time remain optional; no date is fabricated.

## Recurrence Contract

| Service | Canonical OS input | Customer label |
| --- | --- | --- |
| Private | `visits_per_month: 1` | `1x pro Monat` |
| Private | `visits_per_month: 2` | `2x pro Monat` |
| Private | `visits_per_month: 4` | `4x pro Monat` |
| Private | `visits_per_month: 8` | `8x pro Monat` |
| Office / staircase / facility | `1x_month`, `2x_month`, `1x_week` through `5x_week` | Matching month/week labels |

These private labels were already correct at the starting commit. No pricing or recurrence runtime change was necessary. Four separate route-level regressions prove that the exact private count and chosen date reach OS. Weekly/fortnightly private values are rejected as incomplete, never approximated as 4/2 monthly visits. Office and facility retain the separate weekly keys explicitly supported by OS; any 52/12 normalization remains inside OS.

## Isolated Test Architecture

`scripts/capture-e2e/run.mjs` is explicit opt-in tooling, not an application route. It:

1. Verifies the clean, pinned OS commit and the existing local test database identity: loopback port 55432, `clean24-os-local-test`, schema generation 20, 36 migration entries. It never loads OS `.env.local`.
2. Creates a new `clean24_formular_capture_<random>` database from the local schema only. No source business/configuration rows are copied. The existing local database and legacy stack on port 54322 remain untouched.
3. Calls OS's existing `seedTestConfiguration` and enables automatic offers only in that new database. No pricing constants are changed.
4. Imports OS's unchanged quote/intake route handlers and exposes only those two endpoints through a loopback HTTP adapter. Auth, quote persistence, intake transactions, automatic offer orchestration, PDF generation, private local document storage, capture delivery and follow-up scheduling are real OS code, not mocks. This does not claim to test Vercel OIDC or the deployed OS Next.js proxy.
5. Starts the built Formular with process-only local connection settings. A preload denies every non-allowlisted network destination and any SMTP provider call. No production credentials are inherited. OS's local storage guard independently requires a local test database.
6. Confirms every business table is empty before the synthetic case. The longer desktop/mobile matrix runs separately with intercepted APIs and has no database access.
7. Allows exactly one actual quote, one synthetic browser submission and one retry of the same submission ID. No acceptance endpoint is exposed. The customer is `Clean24 E2E Test`, `clean24-e2e@example.invalid`, phone `+41000000000`, address `Teststrasse 123`, `8000 Zuerich`. A future date is explicitly selected by the test; the UI initially has no date.
8. Checks the persisted offer, document hash and delivery attachment, pending follow-ups, actual captured outbox row, null provider/sent markers, and zero job/partner-request/invoice rows. The database is dropped after the check, with an existence check confirming cleanup. Only ignored local evidence remains under `.git/capture-e2e/`.

The test preload resolves only the OS `server-only` marker to its server entry, matching the existing OS Vitest alias. It deliberately does not apply a global `react-server` condition, which breaks React-PDF's reconciler. The optional local tsx parent IPC probe is disabled and counted separately; unapproved sockets and SMTP remain blocked. A pure synthetic PDF render preflight runs before any business records are created.

`verify-evidence.mjs` reads a completed run without accessing a database. It checks native V8 execution counters for the actual OS capture transport, verifies that SMTP never ran, extracts the finished PDF, checks its consistency with the persisted price and customer/offer identity, rejects internal-finance labels, and renders every page with local standard fonts. It independently retains the strict CHF 940 release check and exits nonzero on the observed CHF 890 result.

## Reproduction

Use the installed Playwright module and the read-only OS repository path. Run a fresh lifecycle only with explicit authorization:

```text
npm test
npm run typecheck
npm run lint
npm run build
node scripts/capture-e2e/run.mjs <READ_ONLY_OS_REPO> <PLAYWRIGHT_MODULE> --execute-one
node scripts/capture-e2e/verify-evidence.mjs <RUN_EVIDENCE_DIRECTORY> <READ_ONLY_OS_REPO>
node scripts/capture-e2e/run-ui.mjs <READ_ONLY_OS_REPO> <PLAYWRIGHT_MODULE>
git diff --check
```

The UI wrapper starts and stops a loopback Formular server with OS/SMTP settings empty and a network guard. Its matrix uses `scripts/verify-richtpreis.mjs`, intercepts APIs, and blocks nonlocal browser requests. It deliberately submits only invalid empty-date forms to test client validation; these attempts must produce zero API intake/upload calls. Its quote responses use the real OS pure schema/engine without database access.

## Results

### Complete Isolated Scenario

- Evidence directory: `.git/capture-e2e/clean24_formular_capture_102ed6b8f43f/`.
- Submission ID: `submission:b24c6db1-bb3f-40a6-b67a-4fe2c0967cee`.
- Customer date selected: `2026-09-26`; initial field empty.
- Actual OS quote calls: 1. Actual OS intake calls: 2 (initial plus exactly one same-ID retry).
- Initial intake: HTTP 201, `created`; retry: HTTP 200, `duplicate`, same lead and offer IDs.
- Final persisted counts before cleanup: 1 Lead, 1 Pricing Quote, 1 Offer, 1 outbound message, 3 follow-ups; 0 Jobs, 0 Partner Requests, 0 Invoices.
- Offer number: `OF-3526-6001`; generated and issued, never accepted or declined.
- Actual gross: **CHF 890.00**. Required CHF 940.00 assertion: **FAIL**.
- Offer PDF: one page, 167,627 bytes, SHA-256 `fba1153cd8314817b6623cd75ef08a218e772e8cb33899cedb942eeaf64e65d3`. Correct synthetic customer, offer number, actual CHF 890.00 gross, and no partner/margin labels. Rendered page visually inspected.
- Delivery: `offer_issued`, `captured`, `delivery_mode=capture`, exactly 1 attempt, recipient `clean24-e2e@example.invalid`, null `sent_at` and provider message ID. Exactly 1 PDF attachment relationship.
- Native runtime coverage: capture factory called 2 times (preflight and delivery), **capture send called 1 time**, SMTP factory and SMTP send both **0**. OS network evidence: 0 forbidden network attempts, 0 provider calls; 2 optional local tsx IPC probes disabled.
- Follow-ups: exactly 3 pending steps at +24h, +48h, +120h from offer issuance. No follow-up runner/cron was executed.
- Browser quote exposes the CHF 890-990 range and safe metadata only. First public intake response is exactly `{ success: true, pricing_mode: "automatic", status: "created" }`; retry returns the corresponding `duplicate` state. No internal financial/DB fields reach the customer.
- Cleanup confirmed: the disposable database no longer exists. A local PostgreSQL query found no remaining `clean24_formular_capture_*` databases.

The Windows termination of the Formular process did not flush its original exit-only counter file. This is disclosed rather than represented as a recorded zero. Its process had the active socket/provider guard and blank OS-external SMTP/legacy configuration; OS's transport counters, captured outbox row and provider-call guard are persisted. The harness now persists counters at initialization and on every attempted connection, so it does not depend on a graceful exit.

### Existing Customer Copy Risk

Visual inspection also found that the unchanged `app/danke/page.tsx` default success copy says a receipt email with a Richtpreis has already been sent. The integration's public success response guarantees intake acceptance, not successful live mail, and this run intentionally captured an offer rather than sending an email. That inherited copy must be reconciled with OS delivery semantics before cutover. It was not rewritten in this date/recurrence-only UI pass. A captured offer is not evidence that the legacy receipt-mail promise is true.

### Attempt History

Three setup-only attempts created no business rows: one Windows preload-path issue, one stopped UI-only run, and one UI matrix timeout. The UI matrix is now separate from the business scenario.

One initial lifecycle attempt (`clean24_formular_capture_22bd1013fa4d`) reached 1 Lead, 1 Quote and 1 Offer, then failed PDF rendering under the harness's global React server condition. It produced 0 captured messages/follow-ups and was disposed. A database-free probe identified and corrected that harness problem; OS code was not changed. Its pre-retry detail evidence was not retained before cleanup, a harness limitation now fixed.

The same single requested scenario was then run in the fresh database above, completed through capture/follow-ups and the one retry, and failed only the required price check. No further lifecycle attempts were made after discovering that OS contract conflict. These setup/partial attempts are not counted as successful E2E runs or hidden behind the final per-database counts.

### Repository And Browser Gates

- `npm test`: 180 passed, 0 failed, 0 skipped, across 6 test files. Includes 15 date/recurrence tests and 4 capture-guard tests added in this pass.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run build`: PASS, Next.js 16.2.6, 12 static pages. The existing parent-directory lockfile/root warning remains; no parent files or package locks were changed.
- Browser matrix: **444 checks passed**, 101 service cases per viewport (desktop 1440x1000 and mobile 390x844). All nine automatic categories retain Richtpreis coverage; no accidental manual-review gaps. Both date states, all four private monthly labels, stale/error behavior and layout constraints pass. Zero API intake/upload calls or real emails; UI server socket/provider counters are all zero.
- `git diff --check`: PASS. New files are also checked in the staged diff before commit.
- No changes to pricing/formula/range modules, `PriceCalculator`, recurrence definitions, hero, header, footer, page CSS or visual assets relative to the start commit.
- The capture E2E and independent saved-evidence verifier both correctly exit 1 for the CHF 940 expectation. Unit-test success must not be read as a passing release gate.

### Preview Boundary

The linked Vercel project is the existing `clean24-sales-engine`; no Git remote is configured or added. Read-only preview environment inspection shows only the pre-existing `NEXT_PUBLIC_CLEAN24_LEAD_UPLOAD_URL`, not an OS base URL or integration/quote secret. The new preview is therefore visual-only and fail-closed for OS quote/intake, not a hosted capture environment. No production OS connection or live email is enabled to compensate.

Production must remain deployment `dpl_5E2WiUC5GuYLCgcg2HeJnNLnpqAo` at `formular.clean-24.ch`. Preview URL and final production-alias verification are returned in the task report. No legacy, DNS, cron, production environment, or OS files are changed.
