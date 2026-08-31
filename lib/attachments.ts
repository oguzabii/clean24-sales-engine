export interface LocalLeadFile {
  file: File;
  upload_id: string;
}

export interface UploadedLeadAttachment {
  upload_id: string;
  attachment_id: string;
  status: "created" | "duplicate";
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
}

export const MAX_LEAD_FILES = 10;
export const MAX_LEAD_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_LEAD_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
export const ALLOWED_LEAD_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

export function validateLeadFiles(files: File[]): string | null {
  if (files.length > MAX_LEAD_FILES) {
    return `Maximal ${MAX_LEAD_FILES} Dateien möglich.`;
  }

  for (const file of files) {
    const lowerName = file.name.toLowerCase();
    const hasAllowedExtension = ALLOWED_LEAD_FILE_EXTENSIONS.some((extension) =>
      lowerName.endsWith(extension)
    );
    const hasAllowedType = ALLOWED_LEAD_FILE_TYPES.includes(file.type);

    if (!hasAllowedExtension || !hasAllowedType) {
      return "Erlaubt sind JPG, JPEG, PNG, WEBP und PDF.";
    }

    if (file.size > MAX_LEAD_FILE_BYTES) {
      return "Eine Datei ist grösser als 10 MB.";
    }
  }

  return null;
}

export async function uploadLeadFiles(
  files: LocalLeadFile[],
  uploadUrl = "/api/attachments",
  fetchImpl: typeof fetch = fetch
): Promise<UploadedLeadAttachment[]> {
  if (files.length === 0) return [];

  const validationError = validateLeadFiles(files.map((entry) => entry.file));
  if (validationError) {
    throw new Error(validationError);
  }

  const uploaded: UploadedLeadAttachment[] = [];
  for (const entry of files) {
    uploaded.push(await uploadOne(entry, uploadUrl, fetchImpl));
  }
  return uploaded;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}

async function uploadOne(
  entry: LocalLeadFile,
  uploadUrl: string,
  fetchImpl: typeof fetch
): Promise<UploadedLeadAttachment> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const formData = new FormData();
    formData.append("contract", "clean24_sales_attachment_upload_v1");
    formData.append("upload_id", entry.upload_id);
    formData.append("file", entry.file, entry.file.name);

    try {
      const response = await fetchImpl(uploadUrl, { method: "POST", body: formData });
      const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      if (response.ok) return normalizeAttachmentResponse(data);

      if (response.status === 503 && attempt === 0) {
        lastError = new Error(customerSafeUploadError(response.status, str(data.code)));
        continue;
      }

      throw new Error(customerSafeUploadError(response.status, str(data.code)));
    } catch (error) {
      if (attempt === 0 && isTransientUploadError(error)) {
        lastError = error;
        continue;
      }
      throw error instanceof Error
        ? error
        : new Error("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
}

function normalizeAttachmentResponse(data: Record<string, unknown>): UploadedLeadAttachment {
  const uploadId = str(data.upload_id);
  const attachmentId = str(data.attachment_id);
  const filename = str(data.filename);
  const mimeType = str(data.mime_type);
  const sizeBytes = num(data.size_bytes);
  const sha256 = str(data.sha256);
  const status = data.status === "duplicate" ? "duplicate" : data.status === "created" ? "created" : null;

  if (!uploadId || !attachmentId || !filename || !mimeType || sizeBytes === null || !sha256 || !status) {
    throw new Error("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
  }

  return {
    upload_id: uploadId,
    attachment_id: attachmentId,
    status,
    filename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
    sha256,
  };
}

function isTransientUploadError(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof Error && /network|fetch|timeout/i.test(error.message));
}

function customerSafeUploadError(status: number, code: string | null): string {
  if (status === 413 || code === "FILE_TOO_LARGE") return "Eine Datei ist grösser als 10 MB.";
  if (status === 415 || code === "FILE_TYPE_NOT_ALLOWED" || code === "FILE_CONTENT_MISMATCH") {
    return "Eine Datei wurde nicht angenommen. Erlaubt sind JPG, JPEG, PNG, WEBP und PDF.";
  }
  if (status === 409 || code === "IDEMPOTENCY_MISMATCH") {
    return "Der Upload konnte nicht eindeutig zugeordnet werden. Bitte wählen Sie die betroffene Datei erneut aus.";
  }
  if (status === 401 || code === "UNAUTHORIZED") {
    return "Upload ist aktuell nicht verfügbar. Bitte versuchen Sie es später erneut.";
  }
  if (code?.startsWith("FILE_") || status === 422) return "Eine Datei wurde nicht angenommen. Bitte prüfen Sie Ihre Dateien.";
  if (status === 503 || code === "STORAGE_UNAVAILABLE" || code === "OS_UNAVAILABLE" || code === "OS_TIMEOUT") {
    return "Upload ist momentan nicht verfügbar. Bitte versuchen Sie es erneut.";
  }
  return "Upload fehlgeschlagen. Bitte versuchen Sie es erneut.";
}
