/**
 * Lifecycle helper para SaasSubscription — pure, sin acceso a DB.
 *
 * Reglas:
 *  - ACTIVE con currentPeriodEnd <= now → PAST_DUE
 *  - PAST_DUE con currentPeriodEnd + grace < now → EXPIRED
 *  - PENDING / CANCELLED / EXPIRED no se mueven
 *  - Sin currentPeriodEnd no se transita (datos inconsistentes)
 */

export const SAAS_GRACE_PERIOD_DAYS = 7;

export type SaasSubLifecycleStatus =
  | "PENDING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELLED"
  | "EXPIRED";

export type SaasSubLifecycleInput = {
  status: SaasSubLifecycleStatus;
  currentPeriodEnd: Date | null;
};

export type SaasSubLifecycleResult = {
  nextStatus: SaasSubLifecycleStatus;
  changed: boolean;
};

export function evaluateLifecycle(
  input: SaasSubLifecycleInput,
  now: Date = new Date(),
  gracePeriodDays: number = SAAS_GRACE_PERIOD_DAYS,
): SaasSubLifecycleResult {
  const { status, currentPeriodEnd } = input;

  if (status === "PENDING" || status === "CANCELLED" || status === "EXPIRED") {
    return { nextStatus: status, changed: false };
  }

  if (!currentPeriodEnd) {
    return { nextStatus: status, changed: false };
  }

  if (status === "ACTIVE") {
    if (currentPeriodEnd.getTime() <= now.getTime()) {
      return { nextStatus: "PAST_DUE", changed: true };
    }
    return { nextStatus: "ACTIVE", changed: false };
  }

  // PAST_DUE: si superó grace period → EXPIRED
  const graceMs = gracePeriodDays * 24 * 60 * 60 * 1000;
  if (currentPeriodEnd.getTime() + graceMs < now.getTime()) {
    return { nextStatus: "EXPIRED", changed: true };
  }
  return { nextStatus: "PAST_DUE", changed: false };
}

export type TrialLifecycleInput = {
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  trialEndsAt: Date | null;
};

export function evaluateTrialLifecycle(
  input: TrialLifecycleInput,
  now: Date = new Date(),
): { nextStatus: TrialLifecycleInput["subscriptionStatus"]; changed: boolean } {
  if (input.subscriptionStatus !== "TRIAL") {
    return { nextStatus: input.subscriptionStatus, changed: false };
  }
  if (!input.trialEndsAt) {
    return { nextStatus: "TRIAL", changed: false };
  }
  if (input.trialEndsAt.getTime() <= now.getTime()) {
    return { nextStatus: "EXPIRED", changed: true };
  }
  return { nextStatus: "TRIAL", changed: false };
}

/**
 * Decide si enviar el email "Trial por terminar" para un Box en estado TRIAL.
 * Ventana: trial vence entre +1d y +3d desde ahora. Idempotente: si lastNotifiedAt
 * está dentro de las últimas 24h, no re-notifica.
 */
/**
 * Decide si una SaasSubscription debe renovar automáticamente.
 *
 * Solo ACTIVE con currentPeriodEnd <= now califica. CANCELLED/EXPIRED/PAST_DUE/PENDING
 * no se renuevan (PAST_DUE entra al lifecycle de grace + EXPIRED por separado).
 *
 * El consumidor decide CÓMO renovar (mock vs MP preapproval real). Este helper
 * solo dice "sí debe" + cuál sería el siguiente periodo.
 */
export function evaluateRenewal(input: {
  status: SaasSubLifecycleStatus;
  currentPeriodEnd: Date | null;
  now?: Date;
}): { shouldRenew: boolean; nextPeriodEnd: Date | null } {
  const now = input.now ?? new Date();

  if (input.status !== "ACTIVE" || !input.currentPeriodEnd) {
    return { shouldRenew: false, nextPeriodEnd: null };
  }

  if (input.currentPeriodEnd.getTime() > now.getTime()) {
    return { shouldRenew: false, nextPeriodEnd: null };
  }

  const next = new Date(input.currentPeriodEnd);
  next.setMonth(next.getMonth() + 1);
  return { shouldRenew: true, nextPeriodEnd: next };
}

export function shouldNotifyTrialExpiring(input: {
  trialEndsAt: Date | null;
  lastNotifiedAt: Date | null;
  now?: Date;
}): { notify: boolean; daysRemaining?: number } {
  const now = input.now ?? new Date();
  if (!input.trialEndsAt) return { notify: false };

  const msUntilEnd = input.trialEndsAt.getTime() - now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const daysUntilEnd = msUntilEnd / dayMs;

  // Ventana: vence en (0, 3] días
  if (daysUntilEnd <= 0 || daysUntilEnd > 3) return { notify: false };

  if (input.lastNotifiedAt) {
    const sinceNotified = now.getTime() - input.lastNotifiedAt.getTime();
    if (sinceNotified < dayMs) return { notify: false };
  }

  const daysRemaining = Math.max(1, Math.ceil(daysUntilEnd));
  return { notify: true, daysRemaining };
}
