/**
 * Pure helper para idempotencia del digest semanal.
 * Cooldown default 6 días: como el cron corre semanalmente,
 * 6 días deja margen para que un retry el mismo día no duplique,
 * pero permite que la semana siguiente sí envíe.
 */
export const DIGEST_COOLDOWN_DAYS = 6;

export function shouldSendOwnerDigest(input: {
  lastSentAt: Date | null;
  now?: Date;
  cooldownDays?: number;
}): boolean {
  const now = input.now ?? new Date();
  const cooldownDays = input.cooldownDays ?? DIGEST_COOLDOWN_DAYS;

  if (!input.lastSentAt) return true;

  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
  const elapsed = now.getTime() - input.lastSentAt.getTime();
  return elapsed >= cooldownMs;
}
