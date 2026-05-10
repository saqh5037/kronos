/**
 * OTP del email atleta — código de 6 dígitos derivado del VerificationToken.
 *
 * Cada email enviado por NextAuth EmailProvider incluye un magic link y, en
 * paralelo, un código numérico derivado determinísticamente del token raw
 * almacenado en VerificationToken. El usuario puede entrar tipeando el código
 * en `/api/auth/otp/verify` (mismo efecto que clickear el link, pero sin la
 * fricción cross-browser de iOS).
 *
 * Derivación del código:
 *  - HMAC-SHA256(token, NEXTAUTH_SECRET) → digest
 *  - Truncación tipo HOTP (RFC 4226) → entero 31 bits
 *  - mod 1_000_000 → 6 dígitos con zero-padding
 *
 * Propiedades:
 *  - Determinístico: mismo token siempre produce mismo código
 *  - Sin secret server, no se puede derivar (HMAC + secret)
 *  - Sin token, no se puede derivar (HMAC requiere los dos)
 *
 * Reusabilidad (cross-browser, eliminada fricción iPhone Chrome ↔ Safari):
 *  - El código vive `expires` (1h por config en EmailProvider).
 *  - Al primer uso (`markOtpConsumed`) se marca `consumedAt` pero NO se borra.
 *  - Durante los siguientes `REUSE_GRACE_MS` (5 min), el mismo código sigue
 *    siendo válido — el atleta puede usarlo en Chrome y luego en Safari sin
 *    pedir uno nuevo.
 *  - Pasada la ventana de gracia, `findOtpMatch` lo trata como inválido y lo
 *    borra inline (housekeeping). El magic link tradicional sigue siendo
 *    hard-delete (consumido vía PrismaAdapter.verifyEmail de NextAuth).
 */
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

const OTP_LENGTH = 6;
export const REUSE_GRACE_MS = 5 * 60_000; // 5 min de reuso post-primer-uso

export function deriveOtpFromToken(token: string, secret: string): string {
  const hmac = createHmac("sha256", secret);
  hmac.update(token);
  const digest = hmac.digest();
  // RFC 4226 HOTP-style dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f;
  const code =
    (((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff)) %
    1_000_000;
  return code.toString().padStart(OTP_LENGTH, "0");
}

export function isValidOtpFormat(input: string): boolean {
  return /^\d{6}$/.test(input.trim());
}

/**
 * Compara dos strings de igual longitud en tiempo constante (anti timing attack).
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

export type OtpMatchResult =
  | { ok: true; token: string; identifier: string }
  | { ok: false; reason: "NO_TOKEN" | "MISMATCH" | "EXPIRED" };

/**
 * Busca un VerificationToken activo para `email` que matchee con el OTP `code`.
 * Acepta tokens nunca consumidos o consumidos hace ≤ REUSE_GRACE_MS.
 *
 * NO consume el token aquí. El consumo (mark) es responsabilidad del caller
 * después de crear la sesión, para mantener atomic la sequence
 * "match → mark → cookie".
 */
export async function findOtpMatch(
  email: string,
  code: string,
  secret: string,
): Promise<OtpMatchResult> {
  if (!isValidOtpFormat(code)) {
    return { ok: false, reason: "MISMATCH" };
  }
  const normalizedEmail = email.trim().toLowerCase();
  const now = new Date();
  const candidates = await db.verificationToken.findMany({
    where: { identifier: normalizedEmail },
    orderBy: { expires: "desc" },
  });
  if (candidates.length === 0) {
    return { ok: false, reason: "NO_TOKEN" };
  }
  const active = candidates.filter((t) => {
    if (t.expires <= now) return false;
    if (
      t.consumedAt &&
      now.getTime() - t.consumedAt.getTime() > REUSE_GRACE_MS
    ) {
      // Pasó la ventana de gracia: GC inline, best-effort.
      db.verificationToken
        .delete({
          where: {
            identifier_token: { identifier: t.identifier, token: t.token },
          },
        })
        .catch(() => {});
      return false;
    }
    return true;
  });
  if (active.length === 0) {
    return { ok: false, reason: "EXPIRED" };
  }
  for (const t of active) {
    const derived = deriveOtpFromToken(t.token, secret);
    if (constantTimeEqual(derived, code.trim())) {
      return { ok: true, token: t.token, identifier: t.identifier };
    }
  }
  return { ok: false, reason: "MISMATCH" };
}

/**
 * Marca un VerificationToken como consumido (soft). Idempotente:
 *   - primer call: setea consumedAt = now
 *   - calls subsiguientes (mismo token): no cambian el timestamp original,
 *     porque updateMany filtra por consumedAt: null.
 *
 * Se mantiene en DB hasta que `findOtpMatch` lo GC al pasar la ventana de
 * gracia, o hasta que el `expires` lo invalide.
 */
export async function markOtpConsumed(
  identifier: string,
  token: string,
): Promise<void> {
  await db.verificationToken
    .updateMany({
      where: { identifier, token, consumedAt: null },
      data: { consumedAt: new Date() },
    })
    .catch(() => {
      // Idempotente: si ya fue marcado o borrado, ignorar.
    });
}
