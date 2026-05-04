/**
 * Email sending — mock implementation that logs to console in dev/test.
 * Real Resend/SendGrid/SMTP integration replaces sendEmail() body in Fase 3.
 */

export type EmailMessage = {
  to: string[];
  subject: string;
  html: string;
  from?: string;
};

export type EmailResult = {
  ok: boolean;
  delivered: number;
  failed: number;
  error?: string;
};

/**
 * Mock implementation. Returns success based on `to` length.
 * In production we'll route through Resend (or whichever provider Samuel
 * chooses) — see EMAIL_PROVIDER env var planned for Fase 3.
 */
export async function sendEmail(msg: EmailMessage): Promise<EmailResult> {
  if (process.env.NODE_ENV !== "test") {
    console.log(
      `[email:mock] → ${msg.to.length} recipients · "${msg.subject}"`,
    );
  }
  // Simulate "delivery"
  return {
    ok: true,
    delivered: msg.to.length,
    failed: 0,
  };
}
