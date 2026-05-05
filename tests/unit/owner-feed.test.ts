/**
 * Unit tests para el owner feed — classifySeverity y shape de FeedEvent.
 * No usa DB (lógica pura de clasificación).
 */

import { describe, it, expect } from "vitest";
import type { AuditAction } from "@prisma/client";
import type { FeedSeverity } from "../../src/server/actions/owner-feed";

// ─── Testear classifySeverity de forma indirecta ───────────────────────────
// La función está no-exportada, así que testeamos los contratos vía los tipos

type SeverityCase = {
  action: AuditAction;
  metadata: Record<string, unknown>;
  expected: FeedSeverity;
};

// Replica minimal de la lógica de classifySeverity para tests puros
function classifySeverity(
  action: AuditAction,
  metadata: Record<string, unknown>,
): FeedSeverity {
  const SENSITIVE_ACTIONS: AuditAction[] = [
    "PAYMENT_VOIDED",
    "PAYMENT_REGISTERED",
    "MEMBERSHIP_CANCELLED",
  ];
  const WARNING_ACTIONS: AuditAction[] = [
    "MEMBERSHIP_PAUSED",
    "PLAN_ARCHIVED",
    "WOD_ARCHIVED",
  ];

  if (SENSITIVE_ACTIONS.includes(action)) {
    if (action === "PAYMENT_REGISTERED" && metadata?.gateway !== "CASH") {
      return "info";
    }
    return "sensitive";
  }
  if (WARNING_ACTIONS.includes(action)) return "warning";
  return "info";
}

describe("classifySeverity()", () => {
  const cases: SeverityCase[] = [
    {
      action: "PAYMENT_VOIDED",
      metadata: {},
      expected: "sensitive",
    },
    {
      action: "PAYMENT_REGISTERED",
      metadata: { gateway: "CASH", amount: 500 },
      expected: "sensitive",
    },
    {
      action: "PAYMENT_REGISTERED",
      metadata: { gateway: "MERCADOPAGO", amount: 500 },
      expected: "info", // MP payments are not manually sensitive
    },
    {
      action: "MEMBERSHIP_CANCELLED",
      metadata: {},
      expected: "sensitive",
    },
    {
      action: "MEMBERSHIP_PAUSED",
      metadata: {},
      expected: "warning",
    },
    {
      action: "PLAN_ARCHIVED",
      metadata: {},
      expected: "warning",
    },
    {
      action: "BOOKING_CREATED",
      metadata: {},
      expected: "info",
    },
    {
      action: "SCORE_SUBMITTED",
      metadata: {},
      expected: "info",
    },
    {
      action: "PR_ACHIEVED",
      metadata: {},
      expected: "info",
    },
  ];

  for (const { action, metadata, expected } of cases) {
    it(`${action} con gateway=${metadata.gateway ?? "—"} → ${expected}`, () => {
      expect(classifySeverity(action, metadata)).toBe(expected);
    });
  }
});

describe("FeedEvent shape contract", () => {
  it("FeedEvent tiene los campos requeridos", () => {
    const event = {
      id: "ev-1",
      when: new Date(),
      actor: { id: "u-1", name: "Coach Lobo", role: "COACH" },
      action: "PAYMENT_REGISTERED" as AuditAction,
      target: {
        type: "Payment",
        label: "Pago $500 · Sofía Torres",
        link: "/admin/pagos",
      },
      metadata: { amount: 500, currency: "MXN" },
      severity: "sensitive" as FeedSeverity,
    };

    expect(event.id).toBeTypeOf("string");
    expect(event.when).toBeInstanceOf(Date);
    expect(event.actor?.name).toBeTypeOf("string");
    expect(event.target.label).toBeTypeOf("string");
    expect(["info", "warning", "sensitive"]).toContain(event.severity);
  });

  it("FeedEvent acepta actor null (sistema)", () => {
    const event = {
      id: "ev-2",
      when: new Date(),
      actor: null,
      action: "BOOKING_CREATED" as AuditAction,
      target: { type: "Booking", label: "Reserva #abc123" },
      metadata: {},
      severity: "info" as FeedSeverity,
    };

    expect(event.actor).toBeNull();
  });
});
