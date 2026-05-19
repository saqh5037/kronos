import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_HEADER = "x-whoop-signature";
const TIMESTAMP_HEADER = "x-whoop-signature-timestamp";
const MAX_SKEW_MS = 5 * 60 * 1000;

export {
  SIGNATURE_HEADER as WHOOP_WEBHOOK_SIGNATURE_HEADER,
  TIMESTAMP_HEADER as WHOOP_WEBHOOK_TIMESTAMP_HEADER,
};

function getSecret(): string {
  const secret = process.env.WHOOP_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "WHOOP_WEBHOOK_SECRET must be set (16+ chars). Configure in Whoop developer dashboard.",
    );
  }
  return secret;
}

export type WebhookVerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason: "MISSING_HEADERS" | "BAD_SIGNATURE" | "SKEW_TOO_LARGE";
    };

export function verifyWebhookSignature(opts: {
  rawBody: string;
  signature: string | null | undefined;
  timestamp: string | null | undefined;
  now?: number;
  maxSkewMs?: number;
}): WebhookVerifyResult {
  const { rawBody, signature, timestamp } = opts;
  if (!signature || !timestamp) return { ok: false, reason: "MISSING_HEADERS" };

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: "MISSING_HEADERS" };

  const now = opts.now ?? Date.now();
  const skew = opts.maxSkewMs ?? MAX_SKEW_MS;
  if (Math.abs(now - ts) > skew) {
    return { ok: false, reason: "SKEW_TOO_LARGE" };
  }

  const expected = createHmac("sha256", getSecret())
    .update(String(ts) + rawBody)
    .digest("base64");

  const expectedBuf = Buffer.from(expected, "utf8");
  const actualBuf = Buffer.from(signature, "utf8");
  if (expectedBuf.length !== actualBuf.length) {
    return { ok: false, reason: "BAD_SIGNATURE" };
  }
  if (!timingSafeEqual(expectedBuf, actualBuf)) {
    return { ok: false, reason: "BAD_SIGNATURE" };
  }
  return { ok: true };
}

export type WhoopWebhookEventType =
  | "workout.updated"
  | "workout.deleted"
  | "sleep.updated"
  | "sleep.deleted"
  | "recovery.updated"
  | "recovery.deleted"
  | "user_profile.updated"
  | "user.updated";

export type WhoopWebhookEvent = {
  user_id: number;
  id: number;
  type: WhoopWebhookEventType;
  trace_id?: string;
};

export function parseWebhookBody(rawBody: string): WhoopWebhookEvent {
  const parsed: unknown = JSON.parse(rawBody);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { user_id?: unknown }).user_id !== "number" ||
    typeof (parsed as { id?: unknown }).id !== "number" ||
    typeof (parsed as { type?: unknown }).type !== "string"
  ) {
    throw new Error("Malformed Whoop webhook body");
  }
  return parsed as WhoopWebhookEvent;
}
