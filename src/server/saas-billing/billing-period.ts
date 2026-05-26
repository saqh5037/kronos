/**
 * Pure billing period computation — no Prisma dependency.
 * Extracted for testability (C-2, W-2, W-3 surface).
 */

export type SubLike = {
  status: string;
  currentPeriodEnd: Date | null | undefined;
};

export type BillingPeriod = {
  periodStart: Date;
  periodEnd: Date;
  newCurrentPeriodEnd: Date;
};

/**
 * Compute billing period dates for a manual payment.
 *
 * - ACTIVE sub with currentPeriodEnd → period starts at currentPeriodEnd (no gap, no overlap)
 * - Any other status → period starts at now
 */
export function computeBillingPeriod(
  sub: SubLike,
  periodMonths: number,
  now: Date,
): BillingPeriod {
  const periodStart =
    sub.status === "ACTIVE" && sub.currentPeriodEnd
      ? new Date(sub.currentPeriodEnd)
      : new Date(now);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + periodMonths);

  return {
    periodStart,
    periodEnd,
    newCurrentPeriodEnd: periodEnd,
  };
}

/**
 * Validate periodMonths: must be integer 1-12.
 */
export function validatePeriodMonths(
  periodMonths: unknown,
): { ok: true; value: number } | { ok: false; message: string } {
  if (
    !Number.isInteger(periodMonths) ||
    (periodMonths as number) < 1 ||
    (periodMonths as number) > 12
  ) {
    return {
      ok: false,
      message: "El período debe estar entre 1 y 12 meses.",
    };
  }
  return { ok: true, value: periodMonths as number };
}

/**
 * Validate trial extension days: must be integer 1-365.
 */
export function validateTrialDays(
  days: unknown,
): { ok: true; value: number } | { ok: false; message: string } {
  if (
    !Number.isInteger(days) ||
    (days as number) < 1 ||
    (days as number) > 365
  ) {
    return {
      ok: false,
      message: "Los días deben estar entre 1 y 365.",
    };
  }
  return { ok: true, value: days as number };
}
