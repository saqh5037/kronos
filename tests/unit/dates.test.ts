import { describe, it, expect } from "vitest";
import {
  rangeFromPreset,
  rangeFromParams,
  previousRange,
  dayKey,
  monthKey,
  eachDayInRange,
  formatRange,
  parseDateParam,
} from "../../src/lib/dates";

describe("rangeFromPreset", () => {
  const now = new Date("2026-05-15T12:00:00.000Z");

  it("today: from 00:00 to 23:59 of today", () => {
    const r = rangeFromPreset("today", now);
    expect(r.from.getDate()).toBe(15);
    expect(r.to.getDate()).toBe(15);
    expect(r.from.getHours()).toBe(0);
    expect(r.to.getHours()).toBe(23);
    expect(r.preset).toBe("today");
  });

  it("last7: spans 7 days inclusive", () => {
    const r = rangeFromPreset("last7", now);
    const days = eachDayInRange(r);
    expect(days).toHaveLength(7);
  });

  it("last30: spans 30 days inclusive", () => {
    const r = rangeFromPreset("last30", now);
    expect(eachDayInRange(r)).toHaveLength(30);
  });

  it("thisMonth: covers full month", () => {
    const r = rangeFromPreset("thisMonth", now);
    expect(r.from.getDate()).toBe(1);
    expect(r.to.getMonth()).toBe(r.from.getMonth());
  });

  it("lastMonth: covers prior month", () => {
    const r = rangeFromPreset("lastMonth", now);
    expect(r.from.getMonth()).toBe(now.getMonth() - 1);
    expect(r.to.getMonth()).toBe(now.getMonth() - 1);
  });
});

describe("previousRange", () => {
  it("returns the symmetric prior period", () => {
    const now = new Date("2026-05-15T12:00:00.000Z");
    const r = rangeFromPreset("last7", now);
    const prev = previousRange(r);
    expect(eachDayInRange(prev).length).toBe(eachDayInRange(r).length);
    expect(prev.to.getTime()).toBeLessThan(r.from.getTime());
  });
});

describe("rangeFromParams", () => {
  it("uses preset when valid", () => {
    const r = rangeFromParams({ preset: "last30" });
    expect(r.preset).toBe("last30");
  });

  it("falls back to default when preset invalid", () => {
    const r = rangeFromParams({ preset: "garbage" });
    expect(r.preset).toBe("last30");
  });

  it("uses from/to when both provided", () => {
    const r = rangeFromParams({ from: "2026-01-01", to: "2026-01-31" });
    expect(r.preset).toBeUndefined();
    expect(r.from.getMonth()).toBe(0);
    expect(r.to.getDate()).toBe(31);
  });

  it("falls back to default when from/to missing", () => {
    const r = rangeFromParams({});
    expect(r.preset).toBe("last30");
  });
});

describe("dayKey / monthKey", () => {
  it("dayKey produces YYYY-MM-DD", () => {
    expect(dayKey(new Date("2026-05-15T12:00:00.000Z"))).toMatch(/^2026-05-/);
  });

  it("monthKey produces YYYY-MM", () => {
    expect(monthKey(new Date("2026-05-15T12:00:00.000Z"))).toMatch(/^2026-05$/);
  });
});

describe("formatRange", () => {
  it("uses preset label when available", () => {
    const r = rangeFromPreset("last30");
    expect(formatRange(r)).toBe("Últimos 30 días");
  });

  it("formats custom range as 'd MMM – d MMM'", () => {
    const r = {
      from: new Date("2026-01-15T00:00:00.000Z"),
      to: new Date("2026-02-10T23:59:59.999Z"),
    };
    expect(formatRange(r)).toMatch(/–/);
  });
});

describe("parseDateParam", () => {
  it("parses ISO date", () => {
    expect(parseDateParam("2026-05-15")).toBeInstanceOf(Date);
  });

  it("returns null for invalid input", () => {
    expect(parseDateParam("not-a-date")).toBeNull();
    expect(parseDateParam(null)).toBeNull();
    expect(parseDateParam("")).toBeNull();
  });
});
