import { describe, it, expect } from "vitest";
import {
  computeBillingPeriod,
  validatePeriodMonths,
  validateTrialDays,
} from "@/server/saas-billing/billing-period";

// ─── computeBillingPeriod ─────────────────────────────────────────────────────

describe("computeBillingPeriod", () => {
  const now = new Date("2026-05-25T12:00:00.000Z");

  it("ACTIVE with currentPeriodEnd → periodStart = currentPeriodEnd (C-2)", () => {
    const periodEnd = new Date("2026-06-15T12:00:00.000Z");
    const sub = { status: "ACTIVE", currentPeriodEnd: periodEnd };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.periodStart.toISOString()).toBe(periodEnd.toISOString());
  });

  it("ACTIVE → periodEnd = currentPeriodEnd + periodMonths (C-2)", () => {
    const periodEnd = new Date("2026-06-15T12:00:00.000Z");
    const sub = { status: "ACTIVE", currentPeriodEnd: periodEnd };
    const result = computeBillingPeriod(sub, 1, now);

    const expectedEnd = new Date("2026-07-15T12:00:00.000Z");
    expect(result.periodEnd.toISOString()).toBe(expectedEnd.toISOString());
  });

  it("ACTIVE → newCurrentPeriodEnd = periodEnd (coherente)", () => {
    const periodEnd = new Date("2026-06-15T12:00:00.000Z");
    const sub = { status: "ACTIVE", currentPeriodEnd: periodEnd };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.newCurrentPeriodEnd.toISOString()).toBe(
      result.periodEnd.toISOString(),
    );
  });

  it("ACTIVE with null currentPeriodEnd → falls back to now", () => {
    const sub = { status: "ACTIVE", currentPeriodEnd: null };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.periodStart.toISOString()).toBe(now.toISOString());
  });

  it("PENDING → periodStart = now", () => {
    const sub = {
      status: "PENDING",
      currentPeriodEnd: new Date("2026-06-15T12:00:00.000Z"),
    };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.periodStart.toISOString()).toBe(now.toISOString());
  });

  it("PAST_DUE → periodStart = now", () => {
    const sub = {
      status: "PAST_DUE",
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
    };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.periodStart.toISOString()).toBe(now.toISOString());
  });

  it("TRIAL → periodStart = now", () => {
    const sub = { status: "TRIAL", currentPeriodEnd: null };
    const result = computeBillingPeriod(sub, 1, now);

    expect(result.periodStart.toISOString()).toBe(now.toISOString());
  });

  it("2 months → periodEnd is 2 months after periodStart", () => {
    const sub = { status: "PENDING", currentPeriodEnd: null };
    const result = computeBillingPeriod(sub, 2, now);

    const expected = new Date(now);
    expected.setMonth(expected.getMonth() + 2);
    expect(result.periodEnd.toISOString()).toBe(expected.toISOString());
  });

  it("does not mutate the currentPeriodEnd input date", () => {
    const periodEnd = new Date("2026-06-15T12:00:00.000Z");
    const originalIso = periodEnd.toISOString();
    const sub = { status: "ACTIVE", currentPeriodEnd: periodEnd };
    computeBillingPeriod(sub, 3, now);

    expect(periodEnd.toISOString()).toBe(originalIso);
  });
});

// ─── validatePeriodMonths ─────────────────────────────────────────────────────

describe("validatePeriodMonths (W-2)", () => {
  it("accepts 1", () => {
    expect(validatePeriodMonths(1)).toEqual({ ok: true, value: 1 });
  });

  it("accepts 12", () => {
    expect(validatePeriodMonths(12)).toEqual({ ok: true, value: 12 });
  });

  it("rejects 0", () => {
    const r = validatePeriodMonths(0);
    expect(r.ok).toBe(false);
  });

  it("rejects 13", () => {
    const r = validatePeriodMonths(13);
    expect(r.ok).toBe(false);
  });

  it("rejects negative", () => {
    const r = validatePeriodMonths(-1);
    expect(r.ok).toBe(false);
  });

  it("rejects float", () => {
    const r = validatePeriodMonths(1.5);
    expect(r.ok).toBe(false);
  });

  it("rejects string", () => {
    const r = validatePeriodMonths("1");
    expect(r.ok).toBe(false);
  });

  it("error message mentions el rango", () => {
    const r = validatePeriodMonths(0);
    if (!r.ok) expect(r.message).toContain("1 y 12");
  });
});

// ─── validateTrialDays ────────────────────────────────────────────────────────

describe("validateTrialDays (W-3)", () => {
  it("accepts 1", () => {
    expect(validateTrialDays(1)).toEqual({ ok: true, value: 1 });
  });

  it("accepts 365", () => {
    expect(validateTrialDays(365)).toEqual({ ok: true, value: 365 });
  });

  it("rejects 0", () => {
    const r = validateTrialDays(0);
    expect(r.ok).toBe(false);
  });

  it("rejects 366", () => {
    const r = validateTrialDays(366);
    expect(r.ok).toBe(false);
  });

  it("rejects negative", () => {
    const r = validateTrialDays(-30);
    expect(r.ok).toBe(false);
  });

  it("rejects float", () => {
    const r = validateTrialDays(30.5);
    expect(r.ok).toBe(false);
  });

  it("error message mentions el rango", () => {
    const r = validateTrialDays(0);
    if (!r.ok) expect(r.message).toContain("1 y 365");
  });
});
