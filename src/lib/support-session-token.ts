/**
 * HMAC-signed cookie token for super-admin support sessions.
 *
 * Pattern mirrors src/lib/pilot-beta-token.ts — "JWT-lite" with no extra deps.
 * Token format: base64url(payload).hex(hmac-sha256)
 *
 * Payload: { sessionId, boxId, agentId, exp }
 *   - exp: unix seconds
 *   - This token is a POINTER only. The source of truth is the SupportSession
 *     table row. On every request, requireSupportSession() verifies:
 *     1. HMAC signature
 *     2. exp field (fast local check)
 *     3. DB row exists + closedAt is null + expiresAt > now (authoritative)
 *
 * Secret: SUPPORT_SESSION_SECRET env var (min 16 chars).
 *   Set this in .env.local (dev) and Vercel env (prod).
 *   Keep it separate from NEXTAUTH_SECRET so a leak of one doesn't compromise both.
 *
 * Cookie: httpOnly, sameSite=lax, path=/admin/super, secure in production.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const SUPPORT_SESSION_COOKIE = "kronos_support_session";

export type SupportSessionTokenPayload = {
  sessionId: string;
  boxId: string;
  agentId: string;
  exp: number; // unix seconds
};

export type SupportTokenVerifyResult =
  | { ok: true; payload: SupportSessionTokenPayload }
  | {
      ok: false;
      reason:
        | "INVALID_FORMAT"
        | "INVALID_SIGNATURE"
        | "EXPIRED"
        | "MISSING_SECRET";
    };

function getSecret(): string | null {
  const s = process.env.SUPPORT_SESSION_SECRET;
  if (!s || s.length < 16) return null;
  return s;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string | null {
  try {
    const padded = input.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    return null;
  }
}

function hmacHex(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function signSupportSessionToken(
  payload: SupportSessionTokenPayload,
): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "SUPPORT_SESSION_SECRET no configurado (mínimo 16 chars). " +
        "Agrega la variable en .env.local para desarrollo y en las env vars de Vercel para producción.",
    );
  }
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacHex(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifySupportSessionToken(
  token: string,
  now: Date = new Date(),
): SupportTokenVerifyResult {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: "MISSING_SECRET" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "INVALID_FORMAT" };
  const [encoded, sig] = parts;
  if (!encoded || !sig) return { ok: false, reason: "INVALID_FORMAT" };

  const expectedSig = hmacHex(encoded, secret);
  if (expectedSig.length !== sig.length) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }
  const equal = timingSafeEqual(
    Buffer.from(expectedSig, "hex"),
    Buffer.from(sig, "hex"),
  );
  if (!equal) return { ok: false, reason: "INVALID_SIGNATURE" };

  const decoded = base64UrlDecode(encoded);
  if (!decoded) return { ok: false, reason: "INVALID_FORMAT" };

  let payload: SupportSessionTokenPayload;
  try {
    payload = JSON.parse(decoded);
  } catch {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  if (
    typeof payload?.sessionId !== "string" ||
    typeof payload?.boxId !== "string" ||
    typeof payload?.agentId !== "string" ||
    typeof payload?.exp !== "number"
  ) {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  const nowSec = Math.floor(now.getTime() / 1000);
  if (payload.exp <= nowSec) return { ok: false, reason: "EXPIRED" };

  return { ok: true, payload };
}

// ─── VERIFICATION TOKEN (ephemeral, one-step, stateless) ─────────────────────
//
// Used to bridge findBoxBySupportCode → openSupportSession without letting
// a super-admin open a session on an arbitrary boxId that was never validated
// via the support code flow.
//
// Approach: HMAC-SHA256 stateless token with { boxId, exp } payload.
// TTL: 5 minutes. Trade-off: stateless means it can technically be replayed
// within the TTL window, but the exposure window between UI steps is ~30 sec
// in practice and the token is bound to a specific boxId. A DB-persisted nonce
// would prevent all replay but adds a write+delete per lookup — not worth it
// for this use case.

export type VerificationTokenPayload = {
  boxId: string;
  exp: number; // unix seconds
};

export type VerificationTokenResult =
  | { ok: true; payload: VerificationTokenPayload }
  | {
      ok: false;
      reason:
        | "INVALID_FORMAT"
        | "INVALID_SIGNATURE"
        | "EXPIRED"
        | "MISSING_SECRET"
        | "BOX_MISMATCH";
    };

const VERIFICATION_TOKEN_TTL_SEC = 5 * 60; // 5 minutes

export function signVerificationToken(boxId: string): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "SUPPORT_SESSION_SECRET not configured. Add it to .env.local for development.",
    );
  }
  const payload: VerificationTokenPayload = {
    boxId,
    exp: Math.floor(Date.now() / 1000) + VERIFICATION_TOKEN_TTL_SEC,
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacHex(encoded, secret);
  return `${encoded}.${sig}`;
}

export function verifyVerificationToken(
  token: string,
  expectedBoxId: string,
  now: Date = new Date(),
): VerificationTokenResult {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: "MISSING_SECRET" };

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "INVALID_FORMAT" };
  const [encoded, sig] = parts;
  if (!encoded || !sig) return { ok: false, reason: "INVALID_FORMAT" };

  const expectedSig = hmacHex(encoded, secret);
  if (expectedSig.length !== sig.length) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }
  const equal = timingSafeEqual(
    Buffer.from(expectedSig, "hex"),
    Buffer.from(sig, "hex"),
  );
  if (!equal) return { ok: false, reason: "INVALID_SIGNATURE" };

  const decoded = base64UrlDecode(encoded);
  if (!decoded) return { ok: false, reason: "INVALID_FORMAT" };

  let payload: VerificationTokenPayload;
  try {
    payload = JSON.parse(decoded);
  } catch {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  if (typeof payload?.boxId !== "string" || typeof payload?.exp !== "number") {
    return { ok: false, reason: "INVALID_FORMAT" };
  }

  const nowSec = Math.floor(now.getTime() / 1000);
  if (payload.exp <= nowSec) return { ok: false, reason: "EXPIRED" };

  if (payload.boxId !== expectedBoxId)
    return { ok: false, reason: "BOX_MISMATCH" };

  return { ok: true, payload };
}

/**
 * Builds Set-Cookie header value for the support session cookie.
 * Expires is set to the same exp as the token payload.
 */
export function buildSupportSessionCookie(
  token: string,
  expiresAt: Date,
): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${SUPPORT_SESSION_COOKIE}=${token}`,
    `Path=/admin/super`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Expires=${expiresAt.toUTCString()}`,
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}

/**
 * Builds a Set-Cookie header value that clears the support session cookie.
 */
export function clearSupportSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return [
    `${SUPPORT_SESSION_COOKIE}=`,
    `Path=/admin/super`,
    `HttpOnly`,
    `SameSite=Lax`,
    `Max-Age=0`,
    secure,
  ]
    .filter(Boolean)
    .join("; ");
}
