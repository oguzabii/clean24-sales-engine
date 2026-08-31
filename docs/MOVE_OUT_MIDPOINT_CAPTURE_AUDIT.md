# Move-Out Midpoint And Capture Audit

Date: 2026-08-27, Europe/Zurich.

## Scope And Snapshots

- OS start: `4a1aadda2f0175384c5e4fae535c0920a4457c2b`.
- OS release: `4312d7eecc630083921d1249c895e53cd626fd91`, committed as
  `fix: use midpoint for move-out binding price` and pushed normally to `origin/main`.
- OS repository: `C:\Users\Gökcen Asel\OneDrive\Desktop\clean24-os`.
- Formular application source: `0a72895f3e01c71eb0cb6a9192ae7a6460ed500d`.
- Formular branch: `feature/formular-live-ui-os-engine-v1`.
- Formular repository: `C:\Users\Gökcen Asel\clean24-sales-engine`.
- Formular has no Git remote. No remote was added and no Formular push or deployment occurred.
- Only capture scripts, capture-safety tests and this audit changed in Formular.
  No application, component, pricing UI, stylesheet, asset, package or environment file changed.

The capture report records the unchanged application HEAD above. Its verification-only
harness changes are included with this audit; they do not change the browser application.

## Approved Binding Rule

For the legacy move-out range path, the candidate is now the midpoint of both visible
gross endpoints, regardless of discount selection. One endpoint is preserved; no endpoints
produce no price. Discounts already included in the range are not applied a second time.

The existing partner-cost-plus-minimum-margin floor remains unchanged. It can raise the
candidate only within the visible maximum. A floor above that maximum still produces
attention/manual review, never an automatic price above the advertised range.

Exact-price multi-service engines, visible room ranges, house/addon/express calculations,
discount rules, VAT, partner payouts and pricing constants were not changed. Historical
offer snapshots retain their stored amounts; old minimum reasons are labelled historical.

| Regression | Visible CHF range | Binding CHF |
|---|---:|---:|
| 3.5 Wohnung, no extras or discount | 890-990 | 940 |
| 4.5 Wohnung | 1'130-1'250 | 1'190 |
| Required standalone midpoint example | 1'120-1'240 | 1'180 |
| 3.5 Haus, existing CHF 200 surcharge | 1'090-1'190 | 1'140 |
| 4.5 with terrace and large cellar | 1'490-1'610 | 1'550 |
| 3.5 Express | 1'020-1'140 | 1'080 |
| 3.5 with confirmed 20% discount | 710-790 | 750 |

Margin tests cover floors below/equal to the midpoint, above the midpoint but within the
maximum, and above the maximum. Single-endpoint protection and Money rounding are covered.

## OS Quality Gates

| Gate | Result |
|---|---|
| Full `npm test` | 1,941 passed, 0 failed, 24 explicitly skipped; 88 files |
| Non-integration portion of full run | 1,169 passed |
| `npm run test:db:local` | 796 passed, 0 failed, 24 explicitly skipped; 37 files |
| Focused binding/parity/fixture/pricing tests | 112 passed across 4 files |
| Focused sales-flow/quote-API/customer-document tests | 63 passed |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS, Next 16.3.1, 3 static pages |
| `git diff --check` and staged equivalent | PASS |

Counts are not additive: the dedicated integration script also selects the 24 tests in
`integration-auth.test.ts`. It contains 772 database integration tests plus those 24 auth
tests. Pricing and focused suites are subsets of the full run.

The 24 unavailable hosted checks were not claimed as passed: 20 PostgREST/API-security
tests, 3 hosted-storage document-platform tests, and 1 hosted-storage invoice-document test.
No production credentials were supplied to make those tests run.

Each database gate used a fresh schema-only disposable database on the verified local
PostgreSQL container at `127.0.0.1:55432`. Delivery was capture-only; nonlocal sockets and
real SMTP provider creation were blocked. The successful gates recorded zero denied
connections and zero SMTP-provider calls, then removed their own databases.

Final OS evidence, relative to the OS repository:

- Full suite: `.git/midpoint-gates/clean24_midpoint_gate_c8ac3210165c/report.json`.
- Dedicated integration: `.git/midpoint-gates/clean24_midpoint_gate_318e3ae9505b/report.json`.
- Focused integration: `.git/midpoint-gates/clean24_midpoint_gate_ec015f05fa4c/report.json`.

Earlier failed attempts remain in the same ignored evidence directory. Launcher-only
issues included a synthetic public key activating unavailable hosted API tests and a
truncated worker counter file. One attempt also mixed an already-loaded module with an
edited test; the final runs used fixed source. Two subsequent Node 24.15 runs had opaque
worker exits, so they were not counted as passing. The dedicated integration gate passed
on Node 24.15; the complete suite passed on the already-installed Node 24.19 runtime, with
all planned tests completed or explicitly skipped and no abnormal worker exits. No
dependency versions, assertions, test exclusions or production runtime settings were
changed to obtain that result.

The final runtime source was fixed during the passing full suite. Two additional
documentation passages were corrected afterward; typecheck, lint, build and diff checks
were then repeated. The OS commit contains 13 files, 263 insertions and 108 deletions.

## OS Production

- Deployment: `dpl_EsVyHtJzYjSXR9gtPDBm3JppuDkp`.
- Commit: `4312d7eecc630083921d1249c895e53cd626fd91`.
- Target/state: production / READY.
- URL: <https://clean24-al6tg59hg-oguzabiis-projects.vercel.app>.
- <https://os.clean-24.ch> resolves to that deployment; `aliasAssigned` is true.
- Read-only login smoke check: HTTP 200.

The existing Git integration deployed the pushed commit. No duplicate deployment,
environment edit, migration, configuration-data edit or production test submission was made.

## Single Capture Scenario

The rebuilt customer UI used the real Formular routes and the pinned OS quote/intake
handlers against a new disposable local database. Pricing, intake, offer generation,
private document storage, PDF rendering, outbox capture and follow-up scheduling were real.
No mock pricing response or production service was substituted.

Input: `move_out_cleaning`, `property_type=wohnung`, `rooms_key=3.5`, no addons,
no discount, no express. The customer selected `2026-09-26`; the synthetic object address
was `Teststrasse 123`, `8000 Zuerich`. Recipient: `clean24-e2e@example.invalid`.

Submission ID: `submission:2f231d9b-374d-4736-8b16-088eb5093456`.

| Evidence | Result |
|---|---|
| Browser-visible range | CHF 890-990 |
| Persisted quote gross | CHF 940.00 |
| `leads.binding_price_chf` | CHF 940.00 |
| Offer | `OF-3526-6001`, CHF 940.00 |
| Actual PDF | 1 page, total including VAT CHF 940.00 |
| Leads / quotes / offers / PDFs | 1 / 1 / 1 / 1 |
| Captured offer messages | 1 |
| Actual capture transport sends | 1, verified from V8 counters |
| SMTP factory / SMTP send / provider calls | 0 / 0 / 0 |
| Initial submission | HTTP 201, `created` |
| One retry, same submission ID | HTTP 200, `duplicate`, same lead and offer IDs |
| Duplicate leads / offers / deliveries | 0 / 0 / 0 |
| Jobs / partner requests / invoices | 0 / 0 / 0 |
| Follow-ups | 3 pending, existing 24/48/120-hour cadence |
| Quote/intake HTTP calls | 1 quote, 2 intake, no forbidden route |
| Public response / email / PDF privacy | PASS, no partner pricing or margin |
| Disposable capture database | Removed and independently checked absent |

The PDF was text-extracted, hash-checked and rendered for visual inspection. The total is
legible, matches the stored offer, and contains no partner or margin fields. Seller/contact
details in the document are intentionally synthetic local-test configuration.

PDF size: 167,626 bytes.
SHA-256: `35c9d63cdf8ee530066adc19ac11d561f3f7fe1a4c02ee9c1082b2280fe60523`.

Evidence root:
`C:\Users\Gökcen Asel\clean24-sales-engine\.git\capture-e2e\clean24_formular_capture_813a64f57d39`.

It contains `report.json`, `verified-evidence.json`, `offer.pdf`, `offer-text.txt`,
`offer-page-1.png`, desktop/mobile screenshots, transport coverage and network counters.

### Cleanup Intervention And Regression

The business assertions and retry passed before cleanup. On Node 24.19/Windows, the
already-stopped Formular child had `exitCode=null` and `signalCode=SIGTERM`. The old helper
checked only `exitCode`, so the second cleanup call waited for an exit event that had
already happened.

The existing run was resumed through its own local debugger by notifying that already
terminated child of its recorded exit, releasing only the duplicate cleanup wait. The
original runner then stopped OS, removed its database and wrote its final report. No
price assertion was bypassed, evidence value rewritten, or additional quote/intake created.
`cleanup-recovery.json` records this intervention. The debugger and both test servers are
closed; the disposable database was independently confirmed absent.

The helper now recognizes both numeric and signal exits. Three regression tests cover
already-ended processes, stopping one harmless local process twice, and graceful IPC
shutdown. The full Formular suite now passes 183 tests, with lint, build and typecheck also
green. The business scenario was not submitted again after this cleanup-only fix; its
independent PDF/transport verifier passed against the original completed run.

## Email Copy Blocker

`app/danke/page.tsx:60` says a receipt email containing the Richtpreis has already been
sent. Its default step list promises that receipt followed by a later fixed price; the
manual-review copy also promises a receipt. Intake success guarantees acceptance of the
submission, not successful live email delivery. A captured offer is not a sent receipt.

This is inherited Formular success-page wording, not an OS offer-template defect.
The authoritative OS offer template in `src/domain/communication/email-templates.ts`
correctly describes the attached offer and its action link. Changing that template cannot
make the Formular page's receipt-mail promise true. No second email was added.

The requested scope prohibits Formular UI changes, so this wording remains unchanged.
It needs a separately authorized success-copy correction before customer cutover.
`EMAIL_COPY_RISK_RESOLVED=NO`.

## Preserved Production Boundaries

- Formular production remains deployment `dpl_5E2WiUC5GuYLCgcg2HeJnNLnpqAo`, commit
  `ab7011d18b886c7c641759db5faea2052ced4b9e`, at <https://formular.clean-24.ch>.
- No Formular production deployment, alias change, promotion or cutover.
- No legacy repository, intake, cron or mail setting was modified or disabled.
- Legacy's deployment and intake route remain reachable; no production lead was submitted.
- No real test email, production partner request or production invoice was created.
- No migrations, production data mutation by the tests, DNS edits or force pushes.
- The pre-existing parent lockfile warning was not addressed by modifying that file.

`READY_FOR_CONTROLLED_PRODUCTION_CUTOVER=NO`: the midpoint and capture business chain
pass, but the customer success-page email promise remains unresolved outside this scope.
