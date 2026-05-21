import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const STATE_TTL_MS = 10 * 60 * 1000;

export type WearableStatePayload = {
  athleteId: string;
  nonce: string;
  issuedAt: number;
};

function getSecret(): string {
  const secret = process.env.WHOOP_STATE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "WHOOP_STATE_SECRET must be set (32+ chars). Generate with: openssl rand -hex 32",
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(s: string): Buffer {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

export function signState(athleteId: string): string {
  const payload: WearableStatePayload = {
    athleteId,
    nonce: randomBytes(16).toString("hex"),
    issuedAt: Date.now(),
  };
  const body = b64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const mac = createHmac("sha256", getSecret()).update(body).digest();
  return `${body}.${b64url(mac)}`;
}

export type VerifyStateResult =
  | { ok: true; payload: WearableStatePayload }
  | { ok: false; reason: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" };

export function verifyState(
  input: string | null | undefined,
): VerifyStateResult {
  if (!input || typeof input !== "string" || !input.includes(".")) {
    return { ok: false, reason: "MALFORMED" };
  }
  const [body, sig] = input.split(".");
  if (!body || !sig) return { ok: false, reason: "MALFORMED" };

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = createHmac("sha256", getSecret()).update(body).digest();
    actual = b64urlDecode(sig);
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
  if (expected.length !== actual.length)
    return { ok: false, reason: "BAD_SIGNATURE" };
  if (!timingSafeEqual(expected, actual))
    return { ok: false, reason: "BAD_SIGNATURE" };

  let payload: WearableStatePayload;
  try {
    payload = JSON.parse(
      b64urlDecode(body).toString("utf8"),
    ) as WearableStatePayload;
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }
  if (
    !payload ||
    typeof payload.athleteId !== "string" ||
    typeof payload.issuedAt !== "number"
  ) {
    return { ok: false, reason: "MALFORMED" };
  }
  if (Date.now() - payload.issuedAt > STATE_TTL_MS) {
    return { ok: false, reason: "EXPIRED" };
  }
  return { ok: true, payload };
}

export const WEARABLE_STATE_TTL_MS = STATE_TTL_MS;
export const WEARABLE_STATE_COOKIE = "__Host-whoop_state";
