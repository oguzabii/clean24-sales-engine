import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { POST as attachmentPost } from "../app/api/attachments/route";
import { maxDuration } from "../app/api/leads/website/route";
import { MAX_LEAD_FILE_BYTES, uploadLeadFiles, validateLeadFiles } from "../lib/attachments";
import { Clean24OsClient, Clean24OsClientError } from "../lib/clean24-os-client";
import { inquiryPricingInput } from "../lib/inquiry-pricing-input";
import { buildIntakeRequest, buildQuoteRequest } from "../lib/sales-engine-contract";

const customer = { customer_name: "Local Contract Test", email: "test@example.invalid", phone: "+41790000000",
  address: "Pruefstrasse 12", zip: "8953", city: "Dietikon", cleaning_date: "2026-12-21", discount_code: "OS-ONLY" };

test("private OS upload keeps stable references through retry and new-service intake", async () => {
  const originalFetch = globalThis.fetch;
  const names = ["CLEAN24_OS_BASE_URL", "SALES_ENGINE_INTEGRATION_SECRET"];
  const old = names.map((name) => process.env[name]);
  process.env.CLEAN24_OS_BASE_URL = "https://os.example.invalid";
  process.env.SALES_ENGINE_INTEGRATION_SECRET = "local-attachment-contract-secret";
  const file = new File(["%PDF-1.7\nlocal-test-only"], "object.pdf", { type: "application/pdf" });
  const upload_id = "upload:local-attachment-regression-001";
  const attachment_id = "12345678-1234-4123-8123-123456789abc";
  let calls = 0;
  const logicalUploads = new Set<string>();
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://os.example.invalid/api/integrations/sales-engine/attachments");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer local-attachment-contract-secret");
    const data = init?.body as FormData;
    assert.equal(data.get("upload_id"), upload_id);
    assert.equal(data.get("contract"), "clean24_sales_attachment_upload_v1");
    assert.equal(await (data.get("file") as File).text(), await file.text());
    calls++;
    logicalUploads.add(String(data.get("upload_id")));
    if (calls === 1) return Response.json({ contract: "clean24_api_error_v1", code: "STORAGE_UNAVAILABLE", message: "temporary" }, { status: 503 });
    return Response.json({ contract: "clean24_sales_attachment_response_v1", upload_id, attachment_id,
      status: "duplicate", filename: file.name, mime_type: file.type, size_bytes: file.size, sha256: "a".repeat(64) });
  };
  try {
    const attachments = await uploadLeadFiles([{ file, upload_id }], "/api/attachments", async (url, init) => {
      assert.equal(url, "/api/attachments");
      return attachmentPost(new Request("http://formular.local/api/attachments", init));
    });
    assert.equal(calls, 2);
    assert.equal(logicalUploads.size, 1);
    const input = inquiryPricingInput({ service_category: "deep_cleaning", object_type: "buero_gewerbe", square_meters: "100" })!;
    const body = buildIntakeRequest({ ...customer, service_category: "deep_cleaning", pricing_inputs: input,
      attachments: attachments.map((a) => a.attachment_id) }, "offline-quote", "submission:attachment-test-0001");
    assert.deepEqual(body.attachments, [attachment_id]);
    assert.equal(body.object.address_line, customer.address);
    assert.equal(body.commercial_context?.discount_code, "OS-ONLY");
    assert.doesNotMatch(JSON.stringify(body), /%PDF|base64|public_url|storage_path|sha256|partner|margin/);
  } finally {
    globalThis.fetch = originalFetch;
    names.forEach((name, i) => old[i] === undefined ? delete process.env[name] : process.env[name] = old[i]);
  }
});

test("attachment type, size and count validation stays in force", async () => {
  assert.ok(validateLeadFiles([new File(["x"], "image.gif", { type: "image/gif" })]));
  assert.ok(validateLeadFiles([new File([new Uint8Array(MAX_LEAD_FILE_BYTES + 1)], "large.pdf", { type: "application/pdf" })]));
  const pdf = new File(["test"], "object.pdf", { type: "application/pdf" });
  assert.ok(validateLeadFiles(Array.from({ length: 11 }, () => pdf)));
  assert.equal(validateLeadFiles([pdf]), null);
  let calls = 0;
  await assert.rejects(uploadLeadFiles([{ file: new File(["x"], "x.exe"), upload_id: "upload:invalid-file-0001" }], "/api/attachments",
    async () => { calls++; return Response.json({}); }));
  assert.equal(calls, 0);
});

for (const [operation, duration] of [["quote", 8_000], ["intake", 60_000], ["attachment", 30_000]] as const) {
  test(`${operation} retains the ${duration / 1000}s deadline and returns a truthful timeout`, async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    let signal: AbortSignal | undefined;
    const client = new Clean24OsClient({ baseUrl: "https://os.example.invalid", secret: "local-only",
      fetchImpl: async (_url, init) => {
        signal = init?.signal as AbortSignal;
        return new Promise<Response>((_resolve, reject) => signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
      } });
    const data = { ...customer, service_category: "other_cleaning", pricing_inputs: {} };
    const pending = (operation === "quote" ? client.quote(buildQuoteRequest(data, "quote:timer-test-0001"))
      : operation === "intake" ? client.intake(buildIntakeRequest(data, "offline", "submission:timer-test-0001"))
      : client.attachment(new FormData())).catch((error: unknown) => error);
    await Promise.resolve();
    assert.ok(signal);
    t.mock.timers.tick(duration - 1);
    assert.equal(signal.aborted, false);
    t.mock.timers.tick(1);
    const error = await pending;
    assert.ok(error instanceof Clean24OsClientError);
    assert.equal(error.code, "OS_TIMEOUT");
    assert.equal(error.status, 504);
  });
}

test("intake duration and exclusive OS delivery remain unchanged", () => {
  assert.equal(maxDuration, 90);
  for (const path of ["app/api/quotes/route.ts", "app/api/leads/website/route.ts", "app/api/attachments/route.ts", "lib/clean24-os-client.ts"]) {
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, /sendMail|nodemailer|CLEAN24_LEAD_WEBHOOK_URL|postLeadWebhook|generatePdf|BASE_PRICE_RANGES/);
  }
});
