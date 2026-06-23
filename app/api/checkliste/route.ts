import { NextRequest, NextResponse } from "next/server";
import { isSmtpConfigured, sendMail } from "@/lib/mail/smtp";
import {
  buildChecklistEmail,
  buildChecklistAdminNotification,
} from "@/lib/mail/emails";
import { generateChecklistPdf } from "@/lib/mail/checklist-pdf";
import { CHECKLIST_PDF_FILENAME } from "@/lib/mail/checklist-data";
import type { MailAttachment } from "@/lib/mail/smtp";

// nodemailer requires the Node.js runtime (not Edge).
export const runtime = "nodejs";

interface ChecklistRequest {
  email?: string;
  page_path?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: ChecklistRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Bitte geben Sie eine gültige E-Mail-Adresse ein." },
      { status: 400 }
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[Clean24 Checkliste] Request from:", email);
  }

  // ---- Deliver the checklist to the customer (the critical action) ----
  if (!isSmtpConfigured()) {
    console.error(
      "[Clean24 Checkliste] SMTP is not configured — cannot send checklist."
    );
    return NextResponse.json(
      { error: "Versand momentan nicht möglich." },
      { status: 502 }
    );
  }

  // Generate the PDF attachment. If generation ever fails, fall back to the
  // HTML/text body (which still contains the full checklist) rather than
  // failing the whole send — the customer still receives the checklist.
  let attachments: MailAttachment[] | undefined;
  try {
    const pdf = await generateChecklistPdf();
    attachments = [
      {
        filename: CHECKLIST_PDF_FILENAME,
        content: pdf,
        contentType: "application/pdf",
      },
    ];
  } catch (err) {
    console.error(
      "[Clean24 Checkliste] PDF generation failed — sending without attachment:",
      err instanceof Error ? err.message : err
    );
  }

  try {
    const { subject, html, text } = buildChecklistEmail();
    await sendMail({ to: email, subject, html, text, attachments });
  } catch (err) {
    console.error(
      "[Clean24 Checkliste] Failed to send checklist email:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { error: "Versand konnte nicht bestätigt werden." },
      { status: 502 }
    );
  }

  // ---- Optional internal notification (best-effort, non-blocking) -----
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (adminEmail) {
    try {
      const { subject, html, text } = buildChecklistAdminNotification(
        email,
        body.page_path
      );
      await sendMail({ to: adminEmail, subject, html, text, replyTo: email });
    } catch (err) {
      console.warn(
        "[Clean24 Checkliste] Admin notification failed:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return NextResponse.json({ success: true });
}
