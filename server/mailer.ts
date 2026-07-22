import nodemailer, { type Transporter } from "nodemailer";

/**
 * SMTP mailer for transactional email (booking confirmations + admin notices).
 *
 * ── Configuration (set these in your .env / Render environment) ──────────────
 *   SMTP_HOST      e.g. smtp.gmail.com | smtp.sendgrid.net | smtp.mailgun.org
 *   SMTP_PORT      587 (STARTTLS, default) or 465 (implicit TLS)
 *   SMTP_SECURE    "true" for port 465, otherwise "false"/unset for 587
 *   SMTP_USER      SMTP username (for SendGrid this is the literal "apikey")
 *   SMTP_PASS      SMTP password / API key
 *   SMTP_FROM      the From address, e.g. "VA Claim Navigator <no-reply@vaclaimnavigator.com>"
 *
 * If SMTP is not configured the app still runs — booking calls return a clear
 * "email not configured" result instead of crashing.
 */

const FROM_FALLBACK = "VA Claim Navigator <no-reply@vaclaimnavigator.com>";

let cachedTransport: Transporter | null = null;

/** True when the minimum SMTP settings are present. */
export function isMailerConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Lazily build (and cache) the Nodemailer transport from environment variables. */
function getTransport(): Transporter {
  if (cachedTransport) return cachedTransport;

  const port = Number(process.env.SMTP_PORT) || 587;
  // Port 465 uses implicit TLS; 587 uses STARTTLS. Allow explicit override.
  const secure =
    process.env.SMTP_SECURE != null
      ? process.env.SMTP_SECURE === "true"
      : port === 465;

  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return cachedTransport;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send a single email. Resolves to { ok } — never throws — so callers can
 * degrade gracefully if SMTP is unavailable.
 */
export async function sendMail(input: MailInput): Promise<{ ok: boolean; error?: string }> {
  if (!isMailerConfigured()) {
    console.warn("[MAILER] SMTP not configured — skipping email to", input.to);
    return { ok: false, error: "SMTP not configured" };
  }
  try {
    await getTransport().sendMail({
      from: process.env.SMTP_FROM || FROM_FALLBACK,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });
    return { ok: true };
  } catch (err: any) {
    console.error("[MAILER] Failed to send email:", err?.message || err);
    return { ok: false, error: err?.message || "send failed" };
  }
}
