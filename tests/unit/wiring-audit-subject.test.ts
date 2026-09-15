/**
 * The composed audit line (audit 2026-09-15, S7).
 *
 * The feed used to read "Cobro en efectivo · $2500.00 MXN" — an amount with no
 * name and no shared money format, so the owner had to open the payment to
 * learn whose it was. `logAudit` now stamps `athleteName` and `planName` onto
 * payment metadata at write time, and these are the lines that come out.
 */
import { describe, it, expect } from "vitest";
import {
  auditDetailLine,
  readAuditSubject,
} from "@/components/admin/audit-subject";

describe("readAuditSubject", () => {
  it("reads the names a payment audit row now carries", () => {
    expect(
      readAuditSubject({
        athleteName: "Mía Moreno",
        planName: "Mensual Ilimitado",
        amount: 2500,
        currency: "MXN",
      }),
    ).toEqual({
      athleteName: "Mía Moreno",
      planName: "Mensual Ilimitado",
      amount: 2500,
      currency: "MXN",
    });
  });

  it("parses an amount that arrived as a string from the JSON column", () => {
    expect(readAuditSubject({ amount: "2500.50" }).amount).toBe(2500.5);
  });

  it("treats a blank name as absent rather than as an empty segment", () => {
    expect(readAuditSubject({ athleteName: "   " }).athleteName).toBeNull();
  });

  it("returns nulls for metadata that is missing entirely", () => {
    expect(readAuditSubject(null)).toEqual({
      athleteName: null,
      planName: null,
      amount: null,
      currency: null,
    });
  });

  it("ignores a non-numeric amount instead of rendering NaN", () => {
    expect(readAuditSubject({ amount: "dos mil" }).amount).toBeNull();
  });
});

describe("auditDetailLine", () => {
  it("names the athlete, the plan and the amount, in that order", () => {
    expect(
      auditDetailLine("Cobro en efectivo", {
        athleteName: "Mía Moreno",
        planName: "Mensual Ilimitado",
        amount: 2500,
        currency: "MXN",
      }),
    ).toBe("Cobro en efectivo · Mía Moreno · Mensual Ilimitado · $2,500 MXN");
  });

  it("formats whole pesos without cents", () => {
    const line = auditDetailLine("Cobro en efectivo", {
      athleteName: "Ana Ruiz",
      amount: 2500,
      currency: "MXN",
    });
    expect(line).toBe("Cobro en efectivo · Ana Ruiz · $2,500 MXN");
    expect(line).not.toContain(".00");
  });

  it("keeps cents when the amount has them", () => {
    expect(
      auditDetailLine("Cobro en efectivo", {
        amount: 2500.5,
        currency: "MXN",
      }),
    ).toContain("2,500.50");
  });

  it("names a foreign currency instead of pretending it is pesos", () => {
    expect(
      auditDetailLine("Cobro en efectivo", { amount: 120, currency: "USD" }),
    ).toContain("USD");
  });

  it("still names the athlete when the row carries no amount", () => {
    expect(
      auditDetailLine("Membresía asignada", { athleteName: "Luis Peña" }),
    ).toBe("Membresía asignada · Luis Peña");
  });

  it("returns null when the metadata adds nothing to the headline", () => {
    expect(
      auditDetailLine("Pizarra subida", { webhookEventId: "x" }),
    ).toBeNull();
  });

  it("returns null for an event with no metadata at all", () => {
    expect(auditDetailLine("Pizarra subida", null)).toBeNull();
  });
});
