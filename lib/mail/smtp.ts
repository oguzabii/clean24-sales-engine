/**
 * Server-only SMTP helper for the Cyon mailbox (info@clean-24.ch).
 *
 * This module imports `nodemailer`, which is a Node-only package — importing it
 * from a Client Component ("use client") fails the build, so it must only ever
 * be used from Route Handlers / Server Components. Do NOT import it into client
 * code.
 *
 * Configuration is read exclusively from environment variables. The SMTP
 * password is never logged or returned to callers.
 */
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Variables that must be present for sending to be possible. `SMTP_SECURE` is
 * intentionally optional and defaults from the port (465 → SSL) so a missing
 * value can never silently break delivery.
 */
const REQUIRED_ENV = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
] as const;

function missingEnv(): string[] {
  return REQUIRED_ENV.filter((key) => !process.env[key]);
}

/** True when every variable required to send mail is present. */
export function isSmtpConfigured(): boolean {
  return missingEnv().length === 0;
}

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter {
  const missing = missingEnv();
  if (missing.length > 0) {
    throw new Error(
      `[smtp] Missing required environment variables: ${missing.join(", ")}`
    );
  }

  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT);
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error("[smtp] SMTP_PORT must be a positive number");
  }

  // Default: secure (SSL) for the implicit-TLS port 465, otherwise STARTTLS.
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE.toLowerCase() === "true"
      : port === 465;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    // Keep a hung SMTP server from blocking the serverless request forever.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return cachedTransport;
}

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface SendMailInput {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  /** Customer address used for Reply-To, e.g. so replies reach the customer. */
  replyTo?: string;
  /** Optional file attachments (e.g. the checklist PDF). */
  attachments?: MailAttachment[];
}

export interface SendMailResult {
  messageId: string;
}

/**
 * Send a HTML + plain-text email through the configured Cyon SMTP account.
 *
 * Throws a sanitized error (no credentials) when configuration is missing or
 * the SMTP server rejects the message. Callers decide how a failure maps to the
 * user-facing flow.
 */
export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const transport = getTransport();
  const from = process.env.EMAIL_FROM as string;

  try {
    const info = await transport.sendMail({
      from,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments,
    });
    return { messageId: info.messageId };
  } catch (err) {
    // Surface a clean message — nodemailer errors never contain the password,
    // but we wrap them anyway to guarantee nothing sensitive leaks.
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    throw new Error(`[smtp] Failed to send email: ${message}`);
  }
}
