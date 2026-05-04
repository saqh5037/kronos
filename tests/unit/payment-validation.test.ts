import { describe, it, expect } from "vitest";
import {
  initCheckoutSchema,
  cashPaymentSchema,
} from "@/lib/validations/payment";
import { membershipAssignSchema } from "@/lib/validations/membership";

describe("initCheckoutSchema", () => {
  it("acepta membershipId no vacío", () => {
    const r = initCheckoutSchema.parse({ membershipId: "abc123" });
    expect(r.membershipId).toBe("abc123");
  });

  it("rechaza membershipId vacío", () => {
    expect(() => initCheckoutSchema.parse({ membershipId: "" })).toThrow();
  });

  it("rechaza si falta membershipId", () => {
    expect(() => initCheckoutSchema.parse({})).toThrow();
  });
});

describe("cashPaymentSchema (regresión)", () => {
  it("default currency MXN", () => {
    const r = cashPaymentSchema.parse({
      membershipId: "m1",
      amount: 1500,
    });
    expect(r.currency).toBe("MXN");
    expect(r.paidAt).toBeInstanceOf(Date);
  });
});

describe("membershipAssignSchema con pendingPayment", () => {
  it("default pendingPayment es false", () => {
    const r = membershipAssignSchema.parse({
      athleteId: "a1",
      planId: "p1",
      startDate: "2026-05-04",
    });
    expect(r.pendingPayment).toBe(false);
    expect(r.autoRenew).toBe(true);
  });

  it("acepta pendingPayment true", () => {
    const r = membershipAssignSchema.parse({
      athleteId: "a1",
      planId: "p1",
      startDate: "2026-05-04",
      pendingPayment: true,
    });
    expect(r.pendingPayment).toBe(true);
  });

  it("coerciona pendingPayment desde string 'true'", () => {
    const r = membershipAssignSchema.parse({
      athleteId: "a1",
      planId: "p1",
      startDate: "2026-05-04",
      pendingPayment: "true",
    });
    expect(r.pendingPayment).toBe(true);
  });
});
