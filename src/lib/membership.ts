/**
 * Pure membership domain helpers — no DB, no auth.
 */
import type { MembershipStatus, PlanType } from "./validations/membership";

export type MembershipSnapshot = {
  status: MembershipStatus;
  startDate: Date;
  endDate: Date | null;
};

export type PlanSnapshot = {
  type: PlanType;
  classesPerMonth: number | null;
  durationDays: number | null;
};

/**
 * A membership is "active" when status=ACTIVE and now is within
 * [startDate, endDate]. endDate=null means open-ended (UNLIMITED-style).
 */
export function isMembershipActive(
  m: MembershipSnapshot,
  now: Date = new Date(),
): boolean {
  if (m.status !== "ACTIVE") return false;
  if (now.getTime() < m.startDate.getTime()) return false;
  if (m.endDate && now.getTime() > m.endDate.getTime()) return false;
  return true;
}

/**
 * Compute endDate when assigning a membership, given plan duration.
 * - durationDays defined → start + durationDays
 * - PlanType MONTHLY (no durationDays) → +30 days as default
 * - PlanType ANNUAL (no durationDays) → +365 days as default
 * - DROPIN → same day end (single-class pass)
 * - PACKAGE / UNLIMITED / FAMILY without durationDays → null (open-ended)
 */
export function computeMembershipEndDate(
  startDate: Date,
  plan: PlanSnapshot,
): Date | null {
  if (plan.durationDays && plan.durationDays > 0) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + plan.durationDays);
    return end;
  }
  switch (plan.type) {
    case "MONTHLY": {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 30);
      return end;
    }
    case "ANNUAL": {
      const end = new Date(startDate);
      end.setDate(end.getDate() + 365);
      return end;
    }
    case "DROPIN": {
      const end = new Date(startDate);
      end.setHours(23, 59, 59, 999);
      return end;
    }
    default:
      return null; // PACKAGE / UNLIMITED / FAMILY → open-ended unless explicit durationDays
  }
}

/**
 * Days remaining until expiry. Returns null when membership is open-ended
 * or already expired. Negative value when past endDate.
 */
export function daysUntilExpiry(
  m: MembershipSnapshot,
  now: Date = new Date(),
): number | null {
  if (!m.endDate) return null;
  const ms = m.endDate.getTime() - now.getTime();
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

/**
 * For class-package plans: how many classes the athlete has left this period.
 * Returns null for unlimited plans (no cap).
 */
export function classesRemaining(
  plan: PlanSnapshot,
  attendedCountThisPeriod: number,
): number | null {
  if (plan.type === "UNLIMITED") return null;
  if (plan.classesPerMonth == null) return null;
  return Math.max(0, plan.classesPerMonth - attendedCountThisPeriod);
}
