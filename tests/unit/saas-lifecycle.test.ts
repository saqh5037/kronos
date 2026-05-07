import { describe, it, expect } from "vitest";
import {
  evaluateLifecycle,
  evaluateTrialLifecycle,
  shouldNotifyTrialExpiring,
  SAAS_GRACE_PERIOD_DAYS,
} from "@/server/saas-billing/lifecycle";

const NOW = new Date("2026-05-07T12:00:00Z");
const FUTURE = new Date("2026-06-07T12:00:00Z");
const YESTERDAY = new Date("2026-05-06T12:00:00Z");
const PAST_8_DAYS = new Date("2026-04-29T12:00:00Z");

describe("evaluateLifecycle", () => {
  it("ACTIVE con currentPeriodEnd futuro → no change", () => {
    expect(
      evaluateLifecycle({ status: "ACTIVE", currentPeriodEnd: FUTURE }, NOW),
    ).toEqual({ nextStatus: "ACTIVE", changed: false });
  });

  it("ACTIVE con currentPeriodEnd <= now → PAST_DUE", () => {
    expect(
      evaluateLifecycle({ status: "ACTIVE", currentPeriodEnd: YESTERDAY }, NOW),
    ).toEqual({ nextStatus: "PAST_DUE", changed: true });
  });

  it("ACTIVE en el límite exacto (currentPeriodEnd == now) → PAST_DUE", () => {
    expect(
      evaluateLifecycle({ status: "ACTIVE", currentPeriodEnd: NOW }, NOW),
    ).toEqual({ nextStatus: "PAST_DUE", changed: true });
  });

  it("PAST_DUE con currentPeriodEnd + grace > now → no change", () => {
    // ayer + 7d > now (todavía en grace period)
    expect(
      evaluateLifecycle(
        { status: "PAST_DUE", currentPeriodEnd: YESTERDAY },
        NOW,
      ),
    ).toEqual({ nextStatus: "PAST_DUE", changed: false });
  });

  it("PAST_DUE con currentPeriodEnd + grace < now → EXPIRED", () => {
    // 8 días atrás → grace de 7 días ya superado
    expect(
      evaluateLifecycle(
        { status: "PAST_DUE", currentPeriodEnd: PAST_8_DAYS },
        NOW,
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: true });
  });

  it("PENDING no se mueve (espera confirmación de pago)", () => {
    expect(
      evaluateLifecycle({ status: "PENDING", currentPeriodEnd: null }, NOW),
    ).toEqual({ nextStatus: "PENDING", changed: false });
  });

  it("CANCELLED no se mueve", () => {
    expect(
      evaluateLifecycle(
        { status: "CANCELLED", currentPeriodEnd: YESTERDAY },
        NOW,
      ),
    ).toEqual({ nextStatus: "CANCELLED", changed: false });
  });

  it("EXPIRED no se mueve (terminal state)", () => {
    expect(
      evaluateLifecycle(
        { status: "EXPIRED", currentPeriodEnd: PAST_8_DAYS },
        NOW,
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: false });
  });

  it("ACTIVE sin currentPeriodEnd no se mueve (datos incompletos)", () => {
    expect(
      evaluateLifecycle({ status: "ACTIVE", currentPeriodEnd: null }, NOW),
    ).toEqual({ nextStatus: "ACTIVE", changed: false });
  });

  it("respeta gracePeriodDays custom", () => {
    // PAST_DUE con period 5 días atrás, grace = 3 → EXPIRED
    const past5 = new Date("2026-05-02T12:00:00Z");
    expect(
      evaluateLifecycle(
        { status: "PAST_DUE", currentPeriodEnd: past5 },
        NOW,
        3,
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: true });

    // grace = 10 → todavía PAST_DUE
    expect(
      evaluateLifecycle(
        { status: "PAST_DUE", currentPeriodEnd: past5 },
        NOW,
        10,
      ),
    ).toEqual({ nextStatus: "PAST_DUE", changed: false });
  });

  it("SAAS_GRACE_PERIOD_DAYS = 7", () => {
    expect(SAAS_GRACE_PERIOD_DAYS).toBe(7);
  });
});

describe("evaluateTrialLifecycle", () => {
  it("TRIAL con trialEndsAt futuro → no change", () => {
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "TRIAL", trialEndsAt: FUTURE },
        NOW,
      ),
    ).toEqual({ nextStatus: "TRIAL", changed: false });
  });

  it("TRIAL con trialEndsAt vencido → EXPIRED", () => {
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "TRIAL", trialEndsAt: YESTERDAY },
        NOW,
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: true });
  });

  it("TRIAL sin trialEndsAt → no change (datos incompletos)", () => {
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "TRIAL", trialEndsAt: null },
        NOW,
      ),
    ).toEqual({ nextStatus: "TRIAL", changed: false });
  });

  it("ACTIVE no se mueve aunque trialEndsAt esté seteado", () => {
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "ACTIVE", trialEndsAt: YESTERDAY },
        NOW,
      ),
    ).toEqual({ nextStatus: "ACTIVE", changed: false });
  });

  it("EXPIRED ya no transita", () => {
    expect(
      evaluateTrialLifecycle(
        { subscriptionStatus: "EXPIRED", trialEndsAt: YESTERDAY },
        NOW,
      ),
    ).toEqual({ nextStatus: "EXPIRED", changed: false });
  });
});

describe("shouldNotifyTrialExpiring", () => {
  const dayMs = 24 * 60 * 60 * 1000;

  it("notify true cuando trial vence en 2 días sin notificación previa", () => {
    const trialEndsAt = new Date(NOW.getTime() + 2 * dayMs);
    const result = shouldNotifyTrialExpiring({
      trialEndsAt,
      lastNotifiedAt: null,
      now: NOW,
    });
    expect(result.notify).toBe(true);
    expect(result.daysRemaining).toBe(2);
  });

  it("notify false cuando trial vence en 5 días (fuera de ventana)", () => {
    const trialEndsAt = new Date(NOW.getTime() + 5 * dayMs);
    expect(
      shouldNotifyTrialExpiring({
        trialEndsAt,
        lastNotifiedAt: null,
        now: NOW,
      }),
    ).toEqual({ notify: false });
  });

  it("notify false cuando trial ya venció", () => {
    const trialEndsAt = new Date(NOW.getTime() - dayMs);
    expect(
      shouldNotifyTrialExpiring({
        trialEndsAt,
        lastNotifiedAt: null,
        now: NOW,
      }),
    ).toEqual({ notify: false });
  });

  it("notify false cuando ya se notificó en últimas 24h", () => {
    const trialEndsAt = new Date(NOW.getTime() + 2 * dayMs);
    const lastNotifiedAt = new Date(NOW.getTime() - 12 * 60 * 60 * 1000);
    expect(
      shouldNotifyTrialExpiring({
        trialEndsAt,
        lastNotifiedAt,
        now: NOW,
      }),
    ).toEqual({ notify: false });
  });

  it("notify true cuando última notificación fue hace > 24h", () => {
    const trialEndsAt = new Date(NOW.getTime() + 1 * dayMs);
    const lastNotifiedAt = new Date(NOW.getTime() - 25 * 60 * 60 * 1000);
    expect(
      shouldNotifyTrialExpiring({
        trialEndsAt,
        lastNotifiedAt,
        now: NOW,
      }),
    ).toEqual({ notify: true, daysRemaining: 1 });
  });

  it("notify false sin trialEndsAt", () => {
    expect(
      shouldNotifyTrialExpiring({
        trialEndsAt: null,
        lastNotifiedAt: null,
        now: NOW,
      }),
    ).toEqual({ notify: false });
  });

  it("daysRemaining redondea hacia arriba (1.4 → 2)", () => {
    const trialEndsAt = new Date(NOW.getTime() + 1.4 * dayMs);
    const result = shouldNotifyTrialExpiring({
      trialEndsAt,
      lastNotifiedAt: null,
      now: NOW,
    });
    expect(result.daysRemaining).toBe(2);
  });
});
