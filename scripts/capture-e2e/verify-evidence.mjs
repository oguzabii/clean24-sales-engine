// Read-only verification of a completed local run. Never creates another lead.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [outputArg, osRepoArg] = process.argv.slice(2);
if (!outputArg || !osRepoArg) throw new Error("Usage: node verify-evidence.mjs RUN_EVIDENCE_DIRECTORY READ_ONLY_OS_REPO");
const output = resolve(outputArg), osRepo = resolve(osRepoArg);
const report = JSON.parse(readFileSync(join(output, "report.json"), "utf8"));
assert.ok(["PASS", "FAIL"].includes(report.result), "A real completed attempt is required, not a blocked setup");
assert.equal(report.executed, true);
assert.equal(report.cleanup, true);
const evidence = report.evidence;
assert.deepEqual(evidence.calls, { quote: 1, intake: 2, forbidden: 0 });
assert.deepEqual(evidence.counts, { leads: 1, pricing_quotes: 1, offers: 1, outbound_messages: 1,
  jobs: 0, partner_job_requests: 0, invoices: 0, offer_followups: 3 });
assert.equal(evidence.deliveries[0].status, "captured");
assert.equal(evidence.deliveries[0].attempt_count, 1);
assert.equal(evidence.deliveries[0].sent_at, null);
assert.equal(evidence.deliveries[0].provider_message_id, null);
assert.equal(evidence.network.providerCalls, 0);
assert.equal(evidence.network.deniedConnections, 0);
const networkPath = join(output, "formular-network.json");
const formularNetwork = report.formularNetwork ?? (existsSync(networkPath) ? JSON.parse(readFileSync(networkPath, "utf8")) : null);
if (formularNetwork) {
  assert.equal(formularNetwork.providerCalls, 0);
  assert.equal(formularNetwork.deniedConnections, 0);
}
const offer = evidence.offers[0], delivery = evidence.deliveries[0];
assert.equal(evidence.submissions[0].submission_id, evidence.submissions[1].submission_id);
assert.equal(evidence.responses[1].body.status, "created");
assert.equal(evidence.responses[2].body.status, "duplicate");
assert.equal(evidence.responses[1].body.lead_id, evidence.responses[2].body.lead_id);
assert.equal(evidence.responses[1].body.offer.offer_id, evidence.responses[2].body.offer.offer_id);
assert.equal(offer.accepted_at, null);
assert.equal(offer.declined_at, null);
assert.ok(offer.issued_at);
assert.equal(evidence.quotes[0].calculated_customer_gross, offer.customer_total_chf);
assert.equal(evidence.leads[0].binding_price_chf, offer.customer_total_chf);
assert.equal(evidence.leads[0].binding_price_chf, "940.00");
assert.equal(evidence.leads[0].object_address_line, "Teststrasse 123");
assert.equal(evidence.leads[0].cleaning_date, evidence.submissions[0].object.cleaning_date);
assert.equal(evidence.leads[0].current_offer_id, offer.id);
assert.equal(delivery.kind, "offer_issued");
assert.equal(delivery.delivery_mode, "capture");
assert.equal(delivery.recipient, "clean24-e2e@example.invalid");
assert.ok(delivery.rendered_subject.includes(offer.offer_number));
assert.match(delivery.rendered_subject, /Offerte.*Clean24/);
assert.equal(evidence.documents.length, 1);
assert.equal(evidence.documents[0].type, "offerte");
assert.equal(evidence.attachments.length, 1);
assert.equal(evidence.attachments[0].outbound_message_id, delivery.id);
assert.equal(evidence.attachments[0].document_id, evidence.documents[0].id);
assert.equal(evidence.automation[0].status, "succeeded");
for (const [index, hours] of [24, 48, 120].entries()) {
  assert.equal(evidence.followups[index].step, index + 1);
  assert.equal(evidence.followups[index].status, "pending");
  assert.equal(Date.parse(evidence.followups[index].scheduled_for) - Date.parse(offer.sent_at ?? offer.issued_at), hours * 3_600_000);
}
const publicQuote = report.publicResponses.quote;
assert.deepEqual(publicQuote.pricing, { currency: "CHF", estimated_price_min: 890, estimated_price_max: 990, amount_basis: "one_off" });
assert.doesNotMatch(JSON.stringify(publicQuote), /partner|margin|tariff|revision|breakdown|calculated_customer|total_customer|quote_id|lead_id/i);
assert.deepEqual(report.publicResponses.first, { success: true, pricing_mode: "automatic", status: "created" });
assert.doesNotMatch(`${delivery.rendered_body_text} ${delivery.rendered_body_html}`, /Partnerverg\u00fctung|Partnerkosten|Partnerpreis|Marge|partner_payout|margin_chf|pricing_configuration/i);

// Native V8 counters prove the real capture send ran once; SMTP never ran.
const transport = { captureFactory: 0, captureSend: 0, smtpFactory: 0, smtpSend: 0 };
for (const file of readdirSync(join(output, "os-coverage")).filter((name) => name.endsWith(".json"))) {
  const coverage = JSON.parse(readFileSync(join(output, "os-coverage", file), "utf8"));
  for (const script of coverage.result.filter((s) => s.url.replaceAll("\\", "/").endsWith("/src/lib/mail/transport.ts"))) {
    for (const [factoryName, prefix] of [["captureTransport", "capture"], ["smtpTransport", "smtp"]]) {
      // tsx also emits tiny export getters with the same names. Select the
      // implementation span, not a getter that merely exposes the function.
      const factory = script.functions.filter((f) => f.functionName === factoryName)
        .sort((a, b) => (b.ranges[0].endOffset - b.ranges[0].startOffset) - (a.ranges[0].endOffset - a.ranges[0].startOffset))[0];
      if (!factory) continue;
      const range = factory.ranges[0];
      transport[`${prefix}Factory`] += range.count;
      for (const fn of script.functions.filter((f) => f.functionName === "send" && f.ranges[0].startOffset > range.startOffset && f.ranges[0].endOffset < range.endOffset)) {
        transport[`${prefix}Send`] += fn.ranges[0].count;
      }
    }
  }
}
assert.ok(transport.captureFactory >= 1);
assert.equal(transport.captureSend, 1);
assert.equal(transport.smtpFactory, 0);
assert.equal(transport.smtpSend, 0);

const requireOs = createRequire(join(osRepo, "package.json"));
const canvas = requireOs("@napi-rs/canvas");
globalThis.DOMMatrix = canvas.DOMMatrix;
globalThis.Path2D = canvas.Path2D;
globalThis.ImageData = canvas.ImageData;
const { getDocument } = await import(pathToFileURL(requireOs.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href);
const bytes = readFileSync(join(output, "offer.pdf"));
assert.equal(createHash("sha256").update(bytes).digest("hex"), evidence.pdfs[0].sha256);
const pdf = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: false, useWorkerFetch: false, isEvalSupported: false,
  standardFontDataUrl: `${join(dirname(requireOs.resolve("pdfjs-dist/package.json")), "standard_fonts")}/` }).promise;
let text = "";
const images = [];
try {
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    text += (await page.getTextContent()).items.map((item) => item.str ?? "").join(" ") + "\n";
    const viewport = page.getViewport({ scale: 1.4 });
    const surface = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = surface.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, surface.width, surface.height);
    await page.render({ canvasContext: context, viewport, canvas: surface }).promise;
    const path = join(output, `offer-page-${number}.png`);
    writeFileSync(path, surface.toBuffer("image/png"));
    images.push(path);
  }
  assert.ok(text.includes(evidence.offers[0].offer_number));
  assert.ok(text.includes(Number(offer.customer_total_chf).toFixed(2)), "PDF must match the persisted offer");
  assert.match(text, /Clean24 E2E Test/);
  assert.match(text, /Umzugsreinigung/);
  assert.doesNotMatch(text, /Partnerverg\u00fctung|Partnerkosten|Partnerpreis|Marge|partner_payout|margin_chf|pricing_configuration/i);
  writeFileSync(join(output, "offer-text.txt"), text);
  const expectedGross = "940.00";
  const priceMatches = offer.customer_total_chf === expectedGross;
  const result = { result: priceMatches ? "PASS" : "FAIL", expectedGross, actualGross: offer.customer_total_chf,
    leadBindingGross: evidence.leads[0].binding_price_chf,
    blockers: priceMatches ? [] : [`Pinned OS produced CHF ${offer.customer_total_chf}, expected CHF ${expectedGross}. Pricing was not changed.`],
    submissionId: evidence.submissions[0].submission_id, counts: evidence.counts, calls: evidence.calls,
    pages: pdf.numPages, pdfMatchesPersistedOffer: true, transport, idempotency: "PASS", privacy: "PASS",
    followupHours: [24, 48, 120], capturedMessages: 1, realSmtpMessages: 0, cleanup: true,
    formularNetworkCounters: formularNetwork,
    warnings: formularNetwork ? [] : ["Formular exit counters were not flushed on Windows termination; OS transport counters and runtime network guard remain the delivery evidence."], images };
  writeFileSync(join(output, "verified-evidence.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (!priceMatches) process.exitCode = 1;
} finally { await pdf.destroy(); }
