/**
 * Audit log readability contract (audit 2026-09-15, admin-management P1).
 *
 * The log has to read like Spanish, not like a database: a humanised headline,
 * the athlete, the plan and the amount through `formatMXN`; no opaque
 * "Payment #8-active" when a name exists; "Hoy" never holding future rows; and
 * the "Sensible" flag reserved for actions that are gated by a `PermissionAction`.
 */
import { describe, it, expect } from "vitest";
import type { AuditAction, PermissionAction } from "@prisma/client";
import {
  AUDIT_ACTION_PERMISSION,
  AUDIT_ALL_ACTIONS,
  auditHeadline,
  composeAuditLine,
  dropFutureAuditEvents,
  groupAuditEventsByDay,
  humanizeAuditEvent,
  humanizeAuditTargetLabel,
  isOpaqueEntityLabel,
} from "@/lib/audit-humanize";
import { permissionActionLabel } from "@/lib/labels";

describe("composeAuditLine", () => {
  it("reads 'Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN'", () => {
    expect(
      composeAuditLine({
        label: "Cobro en efectivo",
        athleteName: "Mía Moreno",
        planName: "Mensual Ilimitado",
        amount: 2500,
        currency: "MXN",
      }),
    ).toBe("Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN");
  });

  it("formats money through formatMXN — never '$24000.00'", () => {
    const line = composeAuditLine({
      label: "Pago confirmado",
      amount: 24000,
      currency: "MXN",
    });
    expect(line).toContain("$24,000 MXN");
    expect(line).not.toContain("24000.00");
  });

  it("keeps cents when the amount is not whole", () => {
    expect(
      composeAuditLine({ label: "Pago", amount: 1500.5, currency: "MXN" }),
    ).toBe("Pago · $1,500.50 MXN");
  });

  it("omits missing parts instead of printing placeholders", () => {
    expect(
      composeAuditLine({
        label: "Reserva creada",
        athleteName: null,
        planName: undefined,
        amount: null,
      }),
    ).toBe("Reserva creada");
  });

  it("renders a non-MXN currency without faking pesos", () => {
    expect(
      composeAuditLine({ label: "Pago", amount: 99, currency: "USD" }),
    ).toBe("Pago · 99 USD");
  });
});

describe("auditHeadline", () => {
  it("names the method for a cash payment", () => {
    expect(
      auditHeadline({ action: "PAYMENT_REGISTERED", gateway: "CASH" }),
    ).toBe("Cobro en efectivo");
  });

  it("names the method for Mercado Pago and card", () => {
    expect(
      auditHeadline({ action: "PAYMENT_REGISTERED", gateway: "MERCADOPAGO" }),
    ).toBe("Cobro por Mercado Pago");
    expect(
      auditHeadline({ action: "PAYMENT_CONFIRMED", gateway: "STRIPE" }),
    ).toBe("Cobro con tarjeta");
  });

  it("falls back to the action label when there is no gateway", () => {
    expect(auditHeadline({ action: "BOOKING_CHECKIN" })).toBe(
      "Check-in registrado",
    );
  });

  it("never returns a raw enum for a known action", () => {
    for (const action of AUDIT_ALL_ACTIONS) {
      const headline = auditHeadline({ action });
      expect(headline, action).not.toMatch(/^[A-Z][A-Z0-9_]+$/);
    }
  });
});

describe("severity is gated by PermissionAction", () => {
  it("every mapped permission is a real PermissionAction", () => {
    for (const [action, permission] of Object.entries(
      AUDIT_ACTION_PERMISSION,
    )) {
      expect(
        permissionActionLabel[permission as PermissionAction],
        `${action} → ${permission}`,
      ).toBeTruthy();
    }
  });

  it("cash payment registration is sensitive (REGISTER_CASH_PAYMENT)", () => {
    const r = humanizeAuditEvent({ action: "PAYMENT_REGISTERED" });
    expect(r.permission).toBe("REGISTER_CASH_PAYMENT");
    expect(r.severity).toBe("sensitive");
  });

  it("voiding a payment is sensitive (REFUND_PAYMENT)", () => {
    const r = humanizeAuditEvent({ action: "PAYMENT_VOIDED" });
    expect(r.permission).toBe("REFUND_PAYMENT");
    expect(r.severity).toBe("sensitive");
  });

  it("a gateway-confirmed payment is NOT sensitive — no permission gates it", () => {
    const r = humanizeAuditEvent({ action: "PAYMENT_CONFIRMED" });
    expect(r.permission).toBeUndefined();
    expect(r.severity).not.toBe("sensitive");
  });

  it("cancelling a membership is a warning, not sensitive", () => {
    const r = humanizeAuditEvent({ action: "MEMBERSHIP_CANCELLED" });
    expect(r.severity).toBe("warning");
  });

  it("every AuditAction resolves to a Spanish label", () => {
    for (const action of AUDIT_ALL_ACTIONS) {
      const r = humanizeAuditEvent({ action });
      expect(r.label, action).not.toBe(action);
    }
  });
});

describe("humanizeAuditEvent detail", () => {
  it("builds the full line from metadata plus the resolved subject", () => {
    const r = humanizeAuditEvent({
      action: "PAYMENT_REGISTERED",
      metadata: { gateway: "CASH", amount: 2500, currency: "MXN" },
      subject: { athleteName: "Mía Moreno", planName: "Mensual Ilimitado" },
    });
    expect(r.detail).toBe(
      "Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN",
    );
  });

  it("leaves detail undefined when nothing enriches the headline", () => {
    const r = humanizeAuditEvent({ action: "USER_LOGIN" });
    expect(r.detail).toBeUndefined();
  });
});

describe("humanizeAuditTargetLabel", () => {
  it("detects opaque entity labels", () => {
    expect(isOpaqueEntityLabel("Payment #8-active")).toBe(true);
    expect(isOpaqueEntityLabel("User #163d4tti")).toBe(true);
    expect(isOpaqueEntityLabel("Score #0vcblq")).toBe(true);
    expect(isOpaqueEntityLabel("Mía Moreno — Mensual Ilimitado")).toBe(false);
  });

  it("uses the actor name instead of 'User #163d4tti'", () => {
    expect(
      humanizeAuditTargetLabel({
        targetType: "User",
        label: "User #163d4tti",
        actorName: "Isabela Ochoa",
      }),
    ).toBe("Isabela Ochoa");
  });

  it("falls back to a Spanish entity name, never the raw id", () => {
    const out = humanizeAuditTargetLabel({
      targetType: "Score",
      label: "Score #0vcblq",
    });
    expect(out).toBe("Score del atleta");
    expect(out).not.toContain("#");
  });

  it("keeps a real label untouched", () => {
    expect(
      humanizeAuditTargetLabel({
        targetType: "Membership",
        label: "Mía Moreno — Mensual Ilimitado",
      }),
    ).toBe("Mía Moreno — Mensual Ilimitado");
  });

  it("returns an empty string for an unknown opaque type with no name", () => {
    expect(
      humanizeAuditTargetLabel({
        targetType: "SomethingElse",
        label: "SomethingElse #abc12345",
      }),
    ).toBe("");
  });
});

describe("groupAuditEventsByDay", () => {
  const now = new Date("2026-09-15T18:00:00.000Z"); // 12:00 in America/Mexico_City

  const ev = (iso: string, id = iso) => ({ id, when: new Date(iso) });

  it("never puts a future row under 'Hoy'", () => {
    const groups = groupAuditEventsByDay(
      [
        ev("2026-09-27T18:00:00.000Z"),
        ev("2026-09-16T18:00:00.000Z"),
        ev("2026-09-15T17:00:00.000Z"),
      ],
      now,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe("Hoy");
    expect(groups[0].events).toHaveLength(1);
  });

  it("drops future events", () => {
    const kept = dropFutureAuditEvents(
      [ev("2026-09-16T00:00:00.000Z"), ev("2026-09-15T10:00:00.000Z")],
      now,
    );
    expect(kept).toHaveLength(1);
  });

  it("labels today and yesterday, then dates", () => {
    const groups = groupAuditEventsByDay(
      [
        ev("2026-09-15T17:00:00.000Z"),
        ev("2026-09-14T17:00:00.000Z"),
        ev("2026-09-12T17:00:00.000Z"),
      ],
      now,
    );
    expect(groups.map((g) => g.label)).toEqual([
      "Hoy",
      "Ayer",
      expect.stringContaining("12"),
    ]);
  });

  it("sorts groups newest first and events newest first inside a group", () => {
    const groups = groupAuditEventsByDay(
      [
        ev("2026-09-13T17:00:00.000Z", "old"),
        ev("2026-09-15T14:00:00.000Z", "today-early"),
        ev("2026-09-15T17:00:00.000Z", "today-late"),
      ],
      now,
    );
    expect(groups.map((g) => g.key)).toEqual(["2026-09-15", "2026-09-13"]);
    expect(groups[0].events.map((e) => e.id)).toEqual([
      "today-late",
      "today-early",
    ]);
  });

  it("returns no groups for an empty feed", () => {
    expect(groupAuditEventsByDay([], now)).toEqual([]);
  });
});

describe("AUDIT_ALL_ACTIONS", () => {
  it("covers the AuditAction enum used by the feed", () => {
    const sample: AuditAction[] = [
      "PAYMENT_REGISTERED",
      "BOOKING_CHECKIN",
      "WEARABLE_CONNECTED",
      "PASSWORD_SET",
    ];
    for (const a of sample) expect(AUDIT_ALL_ACTIONS).toContain(a);
  });
});
