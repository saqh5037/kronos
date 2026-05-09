/**
 * Email sending — Resend en producción, mock console.log si no hay API key.
 *
 * El fallback al mock garantiza que dev local no necesita Resend para correr;
 * solo cableando RESEND_API_KEY el envío real se activa.
 */

import { Resend } from "resend";

export type EmailMessage = {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
};

export type EmailResult = {
  ok: boolean;
  delivered: number;
  failed: number;
  error?: string;
};

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "Kronos <noreply@kronos.app>";

let _resend: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!_resend) _resend = new Resend(key);
  return _resend;
}

export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  const resend = getResend();

  // Fallback: sin API key → log y devolver "delivered" (dev/test)
  if (!resend) {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[email:mock] → ${msg.to.length} recipients · "${msg.subject}"`,
      );
    }
    return { ok: true, delivered: msg.to.length, failed: 0 };
  }

  try {
    const { error } = await resend.emails.send({
      from: msg.from ?? DEFAULT_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
      ...(msg.text ? { text: msg.text } : {}),
    });
    if (error) {
      return {
        ok: false,
        delivered: 0,
        failed: msg.to.length,
        error: error.message,
      };
    }
    return { ok: true, delivered: msg.to.length, failed: 0 };
  } catch (err) {
    return {
      ok: false,
      delivered: 0,
      failed: msg.to.length,
      error: err instanceof Error ? err.message : "Unknown email error",
    };
  }
}
