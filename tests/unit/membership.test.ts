import { describe, it, expect } from "vitest";
import {
  membershipPlanSchema,
  membershipAssignSchema,
} from "../../src/lib/validations/membership";
import { cashPaymentSchema } from "../../src/lib/validations/payment";
import {
  isMembershipActive,
  computeMembershipEndDate,
  daysUntilExpiry,
  classesRemaining,
} from "../../src/lib/membership";

describe("membershipPlanSchema", () => {
  it("parses minimal plan with defaults", () => {
    const p = membershipPlanSchema.parse({ name: "Mensual", price: 1500 });
    expect(p.type).toBe("MONTHLY");
    expect(p.currency).toBe("MXN");
    expect(p.isActive).toBe(true);
  });

  it("coerces strings (FormData)", () => {
    const p = membershipPlanSchema.parse({
      name: "x",
      price: "2500.50",
      classesPerMonth: "12",
      durationDays: "30",
    });
    expect(p.price).toBe(2500.5);
    expect(p.classesPerMonth).toBe(12);
    expect(p.durationDays).toBe(30);
  });

  it("rejects empty name", () => {
    expect(() =>
      membershipPlanSchema.parse({ name: "", price: 100 }),
    ).toThrow();
  });

  it("rejects negative price", () => {
    expect(() =>
      membershipPlanSchema.parse({ name: "x", price: -1 }),
    ).toThrow();
  });

  it("normalizes 0 classesPerMonth to null", () => {
    const p = membershipPlanSchema.parse({
      name: "x",
      price: 100,
      classesPerMonth: 0,
    });
    expect(p.classesPerMonth).toBeNull();
  });
});

describe("membershipAssignSchema", () => {
  it("parses with ISO startDate", () => {
    const m = membershipAssignSchema.parse({
      athleteId: "ath-1",
      planId: "plan-1",
      startDate: "2026-06-01",
    });
    expect(m.startDate).toBeInstanceOf(Date);
    expect(m.autoRenew).toBe(true);
  });

  it("rejects invalid dates", () => {
    expect(() =>
      membershipAssignSchema.parse({
        athleteId: "a",
        planId: "p",
        startDate: "not-a-date",
      }),
    ).toThrow();
  });
});

describe("cashPaymentSchema", () => {
  it("defaults paidAt to now when omitted", () => {
    const p = cashPaymentSchema.parse({
      membershipId: "m1",
      amount: 1500,
    });
    expect(p.paidAt).toBeInstanceOf(Date);
    expect(p.currency).toBe("MXN");
  });

  it("rejects 0 amount", () => {
    expect(() =>
      cashPaymentSchema.parse({ membershipId: "m1", amount: 0 }),
    ).toThrow();
  });

  it("normalizes empty notes to undefined", () => {
    const p = cashPaymentSchema.parse({
      membershipId: "m1",
      amount: 100,
      notes: "",
    });
    expect(p.notes).toBeUndefined();
  });
});

describe("isMembershipActive", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns true within range", () => {
    expect(
      isMembershipActive(
        {
          status: "ACTIVE",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-30"),
        },
        now,
      ),
    ).toBe(true);
  });

  it("returns false when status is PAUSED", () => {
    expect(
      isMembershipActive(
        {
          status: "PAUSED",
          startDate: new Date("2026-06-01"),
          endDate: new Date("2026-06-30"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("returns false when before start", () => {
    expect(
      isMembershipActive(
        {
          status: "ACTIVE",
          startDate: new Date("2026-07-01"),
          endDate: null,
        },
        now,
      ),
    ).toBe(false);
  });

  it("returns false when expired", () => {
    expect(
      isMembershipActive(
        {
          status: "ACTIVE",
          startDate: new Date("2026-05-01"),
          endDate: new Date("2026-05-31"),
        },
        now,
      ),
    ).toBe(false);
  });

  it("returns true when endDate is null (open-ended)", () => {
    expect(
      isMembershipActive(
        {
          status: "ACTIVE",
          startDate: new Date("2026-06-01"),
          endDate: null,
        },
        now,
      ),
    ).toBe(true);
  });
});

describe("computeMembershipEndDate", () => {
  const start = new Date("2026-06-01T00:00:00Z");

  it("uses durationDays when defined", () => {
    const end = computeMembershipEndDate(start, {
      type: "PACKAGE",
      durationDays: 60,
      classesPerMonth: 12,
    });
    expect(end).not.toBeNull();
    expect(end!.toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("MONTHLY without durationDays defaults to +30 days", () => {
    const end = computeMembershipEndDate(start, {
      type: "MONTHLY",
      durationDays: null,
      classesPerMonth: null,
    });
    expect(end!.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("ANNUAL defaults to +365 days", () => {
    const end = computeMembershipEndDate(start, {
      type: "ANNUAL",
      durationDays: null,
      classesPerMonth: null,
    });
    expect(end!.toISOString().slice(0, 10)).toBe("2027-06-01");
  });

  it("DROPIN ends same day", () => {
    const end = computeMembershipEndDate(start, {
      type: "DROPIN",
      durationDays: null,
      classesPerMonth: null,
    });
    expect(end!.toISOString().slice(0, 10)).toBe("2026-06-01");
  });

  it("UNLIMITED without duration is open-ended (null)", () => {
    const end = computeMembershipEndDate(start, {
      type: "UNLIMITED",
      durationDays: null,
      classesPerMonth: null,
    });
    expect(end).toBeNull();
  });
});

describe("daysUntilExpiry", () => {
  const now = new Date("2026-06-15T12:00:00Z");

  it("returns null for open-ended", () => {
    expect(
      daysUntilExpiry(
        {
          status: "ACTIVE",
          startDate: new Date("2026-06-01"),
          endDate: null,
        },
        now,
      ),
    ).toBeNull();
  });

  it("returns positive when future expiry", () => {
    const days = daysUntilExpiry(
      {
        status: "ACTIVE",
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-06-25T12:00:00Z"),
      },
      now,
    );
    expect(days).toBe(10);
  });

  it("returns negative when past expiry", () => {
    const days = daysUntilExpiry(
      {
        status: "EXPIRED",
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-06-10T12:00:00Z"),
      },
      now,
    );
    expect(days).toBe(-5);
  });
});

describe("classesRemaining", () => {
  it("returns null for UNLIMITED", () => {
    expect(
      classesRemaining(
        { type: "UNLIMITED", classesPerMonth: null, durationDays: null },
        50,
      ),
    ).toBeNull();
  });

  it("returns null when no cap defined", () => {
    expect(
      classesRemaining(
        { type: "PACKAGE", classesPerMonth: null, durationDays: 60 },
        5,
      ),
    ).toBeNull();
  });

  it("subtracts attended from cap", () => {
    expect(
      classesRemaining(
        { type: "MONTHLY", classesPerMonth: 12, durationDays: null },
        8,
      ),
    ).toBe(4);
  });

  it("never goes below 0", () => {
    expect(
      classesRemaining(
        { type: "MONTHLY", classesPerMonth: 12, durationDays: null },
        20,
      ),
    ).toBe(0);
  });
});
