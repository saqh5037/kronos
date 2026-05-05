/**
 * Unit tests for evaluateAndDispatch (AlertRule evaluator).
 * Uses vi.mock para evitar DB y Resend reales.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AuditPayload } from "../../src/server/audit";

// Hoist mocks before module loading
const sendEmailMock = vi.hoisted(() => vi.fn());
const alertRuleFindMany = vi.hoisted(() => vi.fn());
const userFindMany = vi.hoisted(() => vi.fn());

// Mock DB
vi.mock("../../src/server/db", () => ({
  db: {
    alertRule: {
      findMany: alertRuleFindMany,
    },
    user: {
      findMany: userFindMany,
    },
  },
  withTenant: vi.fn(),
}));

// Mock sendEmail
vi.mock("../../src/lib/email", () => ({
  sendEmail: sendEmailMock,
}));

// Mock next-auth and auth module to avoid nodemailer dependency in tests
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

// Mock next/cache (used by server actions)
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { evaluateAndDispatch } from "../../src/server/actions/alerts";

const baseEvent: AuditPayload = {
  tenantId: "tenant-1",
  actorId: "actor-1",
  action: "PAYMENT_REGISTERED",
  targetType: "Payment",
  targetId: "payment-1",
  metadata: { amount: 1500, currency: "MXN", gateway: "CASH" },
};

const ownerUser = { email: "owner@test.com" };

beforeEach(() => {
  vi.clearAllMocks();
  sendEmailMock.mockResolvedValue({ ok: true, delivered: 1, failed: 0 });
  userFindMany.mockResolvedValue([ownerUser] as never);
});

describe("evaluateAndDispatch()", () => {
  it("dispara email cuando regla habilitada y sin umbral", async () => {
    alertRuleFindMany.mockResolvedValueOnce([
      {
        id: "rule-1",
        action: "PAYMENT_REGISTERED",
        channel: "EMAIL",
        threshold: null,
        enabled: true,
        recipientIds: ["owner-1"],
        tenantId: "tenant-1",
      },
    ] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).toHaveBeenCalledOnce();
    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["owner@test.com"],
        subject: expect.stringContaining("Pago registrado"),
      }),
    );
  });

  it("dispara email cuando amount >= threshold", async () => {
    alertRuleFindMany.mockResolvedValueOnce([
      {
        id: "rule-2",
        action: "PAYMENT_REGISTERED",
        channel: "EMAIL",
        threshold: 1000, // event amount is 1500 — should trigger
        enabled: true,
        recipientIds: ["owner-1"],
        tenantId: "tenant-1",
      },
    ] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).toHaveBeenCalledOnce();
  });

  it("NO dispara cuando amount < threshold", async () => {
    alertRuleFindMany.mockResolvedValueOnce([
      {
        id: "rule-3",
        action: "PAYMENT_REGISTERED",
        channel: "EMAIL",
        threshold: 5000, // event amount is 1500 — below threshold
        enabled: true,
        recipientIds: ["owner-1"],
        tenantId: "tenant-1",
      },
    ] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("NO dispara cuando regla está deshabilitada (DB devuelve [] con enabled:true filter)", async () => {
    // DB query includes { enabled: true } in where clause.
    // Disabled rules are excluded by the DB — we simulate this with empty array.
    alertRuleFindMany.mockResolvedValueOnce([] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("NO dispara cuando no hay reglas para el action", async () => {
    alertRuleFindMany.mockResolvedValueOnce([] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("NO dispara cuando no hay destinatarios", async () => {
    alertRuleFindMany.mockResolvedValueOnce([
      {
        id: "rule-5",
        action: "PAYMENT_REGISTERED",
        channel: "EMAIL",
        threshold: null,
        enabled: true,
        recipientIds: [],
        tenantId: "tenant-1",
      },
    ] as never);

    await evaluateAndDispatch(baseEvent);

    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("regla con channel=EMAIL llama a sendEmail con subject humanizado", async () => {
    alertRuleFindMany.mockResolvedValueOnce([
      {
        id: "rule-6",
        action: "PAYMENT_VOIDED",
        channel: "EMAIL",
        threshold: null,
        enabled: true,
        recipientIds: ["owner-1"],
        tenantId: "tenant-1",
      },
    ] as never);

    const voidEvent: AuditPayload = {
      ...baseEvent,
      action: "PAYMENT_VOIDED",
    };

    await evaluateAndDispatch(voidEvent);

    expect(sendEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Pago anulado"),
      }),
    );
  });

  it("no lanza excepción cuando DB falla — best-effort", async () => {
    alertRuleFindMany.mockRejectedValueOnce(new Error("DB connection error"));

    // Should NOT throw — evaluateAndDispatch is best-effort
    await expect(evaluateAndDispatch(baseEvent)).resolves.toBeUndefined();
  });
});
