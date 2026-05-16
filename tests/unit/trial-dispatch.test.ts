/**
 * trial-dispatch.ts — cron handler para drip "trial expiring".
 *
 * Probamos:
 *  - Filtro de candidatos: solo Boxes TRIAL con trialEndsAt en ventana (0, 3d]
 *  - Throttle 24h via trialLastNotifiedAt (delegado a shouldNotifyTrialExpiring)
 *  - notifyTrialExpiring se llama con tenantId + daysRemaining correctos
 *  - summary cuenta scanned/notified/skipped/errors correctamente
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const { boxFindMany, notifyTrialExpiringMock } = vi.hoisted(() => ({
  boxFindMany: vi.fn(),
  notifyTrialExpiringMock: vi.fn(),
}));

vi.mock("../../src/server/db", () => ({
  db: {
    box: { findMany: boxFindMany },
  },
}));

vi.mock("../../src/server/saas-billing/notifications", () => ({
  notifyTrialExpiring: notifyTrialExpiringMock,
}));

import { dispatchTrialExpiringNotifications } from "../../src/server/saas-billing/trial-dispatch";

const NOW = new Date("2026-05-16T12:00:00Z");

function trialEndsInDays(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

describe("dispatchTrialExpiringNotifications", () => {
  beforeEach(() => {
    boxFindMany.mockReset();
    notifyTrialExpiringMock.mockReset();
    notifyTrialExpiringMock.mockResolvedValue(undefined);
  });

  it("aplica filtro DB: TRIAL + trialEndsAt en (now, now + 3d]", async () => {
    boxFindMany.mockResolvedValue([]);

    await dispatchTrialExpiringNotifications(NOW);

    const callArg = boxFindMany.mock.calls[0][0];
    expect(callArg.where.subscriptionStatus).toBe("TRIAL");
    expect(callArg.where.trialEndsAt.gt).toEqual(NOW);
    expect(callArg.where.trialEndsAt.lte).toEqual(trialEndsInDays(3));
  });

  it("notifica Boxes elegibles con daysRemaining correcto", async () => {
    boxFindMany.mockResolvedValue([
      {
        id: "box_a",
        trialEndsAt: trialEndsInDays(1),
        trialLastNotifiedAt: null,
      },
      {
        id: "box_b",
        trialEndsAt: trialEndsInDays(2),
        trialLastNotifiedAt: null,
      },
    ]);

    const summary = await dispatchTrialExpiringNotifications(NOW);

    expect(summary).toEqual({
      scanned: 2,
      notified: 2,
      skipped: 0,
      errors: [],
    });
    expect(notifyTrialExpiringMock).toHaveBeenCalledWith("box_a", 1);
    expect(notifyTrialExpiringMock).toHaveBeenCalledWith("box_b", 2);
  });

  it("salta Box que fue notificado hace <24h (throttle)", async () => {
    boxFindMany.mockResolvedValue([
      {
        id: "box_recent",
        trialEndsAt: trialEndsInDays(2),
        trialLastNotifiedAt: hoursAgo(6), // hace 6h, throttle activo
      },
    ]);

    const summary = await dispatchTrialExpiringNotifications(NOW);

    expect(summary.skipped).toBe(1);
    expect(summary.notified).toBe(0);
    expect(notifyTrialExpiringMock).not.toHaveBeenCalled();
  });

  it("notifica Box cuya última notificación fue hace >24h", async () => {
    boxFindMany.mockResolvedValue([
      {
        id: "box_old_notify",
        trialEndsAt: trialEndsInDays(1),
        trialLastNotifiedAt: hoursAgo(30), // throttle expirado
      },
    ]);

    const summary = await dispatchTrialExpiringNotifications(NOW);

    expect(summary.notified).toBe(1);
    expect(notifyTrialExpiringMock).toHaveBeenCalledWith("box_old_notify", 1);
  });

  it("captura errores de notifyTrialExpiring sin abortar el loop", async () => {
    boxFindMany.mockResolvedValue([
      {
        id: "box_fails",
        trialEndsAt: trialEndsInDays(1),
        trialLastNotifiedAt: null,
      },
      {
        id: "box_ok",
        trialEndsAt: trialEndsInDays(2),
        trialLastNotifiedAt: null,
      },
    ]);
    notifyTrialExpiringMock
      .mockRejectedValueOnce(new Error("resend 500"))
      .mockResolvedValueOnce(undefined);

    const summary = await dispatchTrialExpiringNotifications(NOW);

    expect(summary.scanned).toBe(2);
    expect(summary.notified).toBe(1);
    expect(summary.errors).toEqual([
      { tenantId: "box_fails", error: "resend 500" },
    ]);
  });

  it("summary vacío cuando no hay candidatos", async () => {
    boxFindMany.mockResolvedValue([]);

    const summary = await dispatchTrialExpiringNotifications(NOW);

    expect(summary).toEqual({
      scanned: 0,
      notified: 0,
      skipped: 0,
      errors: [],
    });
    expect(notifyTrialExpiringMock).not.toHaveBeenCalled();
  });
});
