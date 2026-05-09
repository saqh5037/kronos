/**
 * OTP fallback al magic link de NextAuth EmailProvider.
 *
 * El email de magic link incluye AMBOS: el link tradicional y un código de
 * 6 dígitos derivado del mismo VerificationToken. Si el atleta no puede usar
 * el link (cross-browser iOS, webview Gmail, link expirado), mete el código
 * en un input y obtiene la misma sesión.
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
 *  - El token raw vive en VerificationToken.token (default NextAuth/Prisma adapter),
 *    así que para validar OTP buscamos por identifier=email + expires>now y
 *    derivamos el código de cada uno hasta encontrar match.
 */
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";

const OTP_LENGTH = 6;

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
 * Usa Buffer porque ambos strings serán de 6 dígitos.
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
 * Si encuentra, devuelve el token raw (para que el caller lo consuma).
 *
 * NOTA: NO consume el token aquí. El consumo (delete) es responsabilidad del
 * caller después de crear la sesión, para mantener atomic la sequence
 * "match → consume → cookie".
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
  const active = candidates.filter((t) => t.expires > now);
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

export async function consumeOtpToken(
  identifier: string,
  token: string,
): Promise<void> {
  await db.verificationToken
    .delete({
      where: { identifier_token: { identifier, token } },
    })
    .catch(() => {
      // Idempotent: si ya fue borrado por otro proceso, ignorar.
    });
}
