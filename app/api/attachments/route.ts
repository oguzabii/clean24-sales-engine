import { NextResponse } from "next/server";
import { Clean24OsClientError, createClean24OsClient } from "@/lib/clean24-os-client";
import { MAX_LEAD_FILE_BYTES } from "@/lib/attachments";

const UPLOAD_ID_PATTERN = /^[A-Za-z0-9._:-]{16,200}$/;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data/i.test(contentType)) {
    return NextResponse.json({ error: "Dateien werden als Formular erwartet.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_LEAD_FILE_BYTES) {
    return NextResponse.json({ error: "Eine Datei ist grösser als 10 MB.", code: "FILE_TOO_LARGE" }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungültiger Upload.", code: "INVALID_REQUEST" }, { status: 400 });
  }

  const uploadId = form.get("upload_id");
  const contract = form.get("contract");
  const file = form.get("file");

  if (contract !== "clean24_sales_attachment_upload_v1") {
    return NextResponse.json({ error: "Ungültiger Upload.", code: "INVALID_CONTRACT_VERSION" }, { status: 400 });
  }
  if (typeof uploadId !== "string" || !UPLOAD_ID_PATTERN.test(uploadId)) {
    return NextResponse.json({ error: "Ungültiger Upload.", code: "INVALID_REQUEST" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Es wurde keine Datei übermittelt.", code: "FILE_MISSING" }, { status: 400 });
  }

  try {
    const upload = await createClean24OsClient().attachment(form);
    return NextResponse.json(upload, { status: upload.status === "created" ? 201 : 200 });
  } catch (error) {
    if (error instanceof Clean24OsClientError) {
      return NextResponse.json(
        { error: customerSafeUploadError(error.code, error.status), code: error.code },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    return NextResponse.json({ error: "Upload fehlgeschlagen. Bitte versuchen Sie es erneut.", code: "OS_UNAVAILABLE" }, { status: 503 });
  }
}

function customerSafeUploadError(code: string, status: number): string {
  if (status === 413 || code === "FILE_TOO_LARGE") return "Eine Datei ist grösser als 10 MB.";
  if (status === 415 || code === "FILE_TYPE_NOT_ALLOWED" || code === "FILE_CONTENT_MISMATCH") {
    return "Eine Datei wurde nicht angenommen. Erlaubt sind JPG, JPEG, PNG, WEBP und PDF.";
  }
  if (status === 409 || code === "IDEMPOTENCY_MISMATCH") {
    return "Der Upload konnte nicht eindeutig zugeordnet werden. Bitte wählen Sie die betroffene Datei erneut aus.";
  }
  if (status === 401 || code === "UNAUTHORIZED" || code === "OS_CONFIG_MISSING") {
    return "Upload ist aktuell nicht verfügbar. Bitte versuchen Sie es später erneut.";
  }
  if (status === 503 || code === "STORAGE_UNAVAILABLE" || code === "OS_UNAVAILABLE" || code === "OS_TIMEOUT") {
    return "Upload ist momentan nicht verfügbar. Bitte versuchen Sie es erneut.";
  }
  return "Upload fehlgeschlagen. Bitte versuchen Sie es erneut.";
}
