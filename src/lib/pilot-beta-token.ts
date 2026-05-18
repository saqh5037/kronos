/**
 * Tokens firmados HMAC-SHA256 para el magic link de firma de contrato
 * piloto-beta. Estructura compacta tipo "JWT-lite": no usamos jsonwebtoken
 * para no agregar dependencia — sólo necesitamos verify + expiry check.
 *
 * Token format: base64url(payload).hex(hmac-sha256)
 *
 * Payload: { boxId, exp, jti? } donde exp = unix seconds y jti = UUID v4.
 * jti es opcional en el payload para compatibilidad con tokens emitidos antes
 * de esta versión. Tokens sin jti saltan el chequeo de revocación.
 *
 * Uso: Samuel genera el link manualmente (CLI script o admin tool futuro)
 * con `signPilotBetaToken({ boxId, expiresInSec })`, manda al owner.
 * El owner abre `/piloto-beta?token=...`, la página valida con
 * `verifyPilotBetaToken(token)`, muestra info del Box y deja firmar.
 *
 * Secret: `PILOT_BETA_TOKEN_SECRET` env var (separado de NEXTAUTH_SECRET
 * para que no pueda forjarse session tokens si se filtra).
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { db } from "@/server/db";

export type PilotBetaTokenPayload = {
  boxId: string;
  exp: number; // unix seconds
  jti?: string; // UUID v4 — presente en tokens emitidos desde esta versión
};

export type VerifyResult =
  | { ok: true; payload: PilotBetaTokenPayload }
  | {
      ok: false;
      reason:
        | "INVALID_FORMAT"
        | "INVALID_SIGNATURE"
        | "EXPIRED"
        | "MISSING_SECRET"
        | "REVOKED";
    };

function getSecret(): string | null {
  const s = process.env.PILOT_BETA_TOKEN_SECRET;
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

export function signPilotBetaToken(args: {
  boxId: string;
  expiresInSec: number;
  now?: Date;
}): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error(
      "PILOT_BETA_TOKEN_SECRET no configurado (mínimo 16 chars).",
    );
  }
  const nowSec = Math.floor((args.now ?? new Date()).getTime() / 1000);
  const payload: PilotBetaTokenPayload = {
    boxId: args.boxId,
    exp: nowSec + args.expiresInSec,
    jti: randomUUID(),
  };
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const sig = hmacHex(encoded, secret);
  return `${encoded}.${sig}`;
}

export async function verifyPilotBetaToken(
  token: string,
  now: Date = new Date(),
): Promise<VerifyResult> {
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

  let payload: PilotBetaTokenPayload;
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

  // Revocation check: tokens sin jti (legacy) saltan este paso.
  if (payload.jti) {
    const revoked = await db.revokedPilotBetaJti.findUnique({
      where: { jti: payload.jti },
    });
    if (revoked) return { ok: false, reason: "REVOKED" };
  }

  return { ok: true, payload };
}

export async function revokePilotBetaToken(
  jti: string,
  boxId: string,
  reason?: string,
): Promise<void> {
  await db.revokedPilotBetaJti.create({
    data: { jti, boxId, reason },
  });
}
