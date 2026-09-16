/**
 * `src/lib/dates.ts` answers in the BOX timezone, so every assertion here is
 * written in box civil days (`dayKey`) instead of the host getters
 * (`getDate()`, `getHours()`) it used before the fase 0 fix wave. Those
 * getters read `process.env.TZ`, which is exactly the coupling this module
 * stopped having — see `admin-mgmt-dates-tz.test.ts` for the cross-host proof.
 */
import { describe, it, expect } from "vitest";
import {
  rangeFromPreset,
  rangeFromParams,
  previousRange,
  dayKey,
  monthKey,
  eachDayInRange,
  formatRange,
  formatDayShort,
  formatMonthShort,
  parseDateParam,
} from "../../src/lib/dates";

describe("rangeFromPreset", () => {
  const now = new Date("2026-05-15T12:00:00.000Z");

  it("today: one whole box civil day", () => {
    const r = rangeFromPreset("today", now);
    expect(dayKey(r.from)).toBe("2026-05-15");
    expect(dayKey(r.to)).toBe("2026-05-15");
    expect(r.to.getTime() - r.from.getTime()).toBe(86_400_000 - 1);
    expect(r.preset).toBe("today");
  });

  it("last7: spans 7 days inclusive", () => {
    const r = rangeFromPreset("last7", now);
    expect(eachDayInRange(r)).toHaveLength(7);
    expect(dayKey(r.from)).toBe("2026-05-09");
    expect(dayKey(r.to)).toBe("2026-05-15");
  });

  it("last30: spans 30 days inclusive", () => {
    expect(eachDayInRange(rangeFromPreset("last30", now))).toHaveLength(30);
  });

  it("last90: spans 90 days inclusive", () => {
    expect(eachDayInRange(rangeFromPreset("last90", now))).toHaveLength(90);
  });

  it("thisMonth: covers the full box month", () => {
    const r = rangeFromPreset("thisMonth", now);
    expect(dayKey(r.from)).toBe("2026-05-01");
    expect(dayKey(r.to)).toBe("2026-05-31");
  });

  it("lastMonth: covers the prior box month", () => {
    const r = rangeFromPreset("lastMonth", now);
    expect(dayKey(r.from)).toBe("2026-04-01");
    expect(dayKey(r.to)).toBe("2026-04-30");
  });
});

describe("previousRange", () => {
  it("returns the symmetric prior period", () => {
    const now = new Date("2026-05-15T12:00:00.000Z");
    const r = rangeFromPreset("last7", now);
    const prev = previousRange(r);
    expect(eachDayInRange(prev).length).toBe(eachDayInRange(r).length);
    expect(prev.to.getTime()).toBeLessThan(r.from.getTime());
    expect(dayKey(prev.to)).toBe("2026-05-08");
    expect(dayKey(prev.from)).toBe("2026-05-02");
  });
});

describe("rangeFromParams", () => {
  it("uses preset when valid", () => {
    expect(rangeFromParams({ preset: "last30" }).preset).toBe("last30");
  });

  it("falls back to default when preset invalid", () => {
    expect(rangeFromParams({ preset: "garbage" }).preset).toBe("last30");
  });

  it("uses from/to when both provided", () => {
    const r = rangeFromParams({ from: "2026-01-01", to: "2026-01-31" });
    expect(r.preset).toBeUndefined();
    expect(dayKey(r.from)).toBe("2026-01-01");
    expect(dayKey(r.to)).toBe("2026-01-31");
  });

  it("falls back to default when from/to missing", () => {
    expect(rangeFromParams({}).preset).toBe("last30");
  });
});

describe("dayKey / monthKey", () => {
  it("dayKey produces YYYY-MM-DD", () => {
    expect(dayKey(new Date("2026-05-15T12:00:00.000Z"))).toBe("2026-05-15");
  });

  it("monthKey produces YYYY-MM", () => {
    expect(monthKey(new Date("2026-05-15T12:00:00.000Z"))).toBe("2026-05");
  });
});

describe("formatRange", () => {
  it("uses preset label when available", () => {
    expect(formatRange(rangeFromPreset("last30"))).toBe("Últimos 30 días");
  });

  it("formats custom range as 'd MMM – d MMM'", () => {
    const r = {
      from: new Date("2026-01-15T12:00:00.000Z"),
      to: new Date("2026-02-10T12:00:00.000Z"),
    };
    expect(formatRange(r)).toBe("15 ene – 10 feb");
  });

  it("honours an explicit timezone", () => {
    const r = {
      from: new Date("2026-01-16T03:00:00.000Z"),
      to: new Date("2026-01-16T03:00:00.000Z"),
    };
    expect(formatRange(r)).toBe("15 ene – 15 ene");
    expect(formatRange(r, "UTC")).toBe("16 ene – 16 ene");
  });
});

describe("formatDayShort / formatMonthShort", () => {
  it("renders in the box timezone", () => {
    const d = new Date("2026-05-16T03:00:00.000Z");
    expect(formatDayShort(d)).toBe("15 may");
    expect(formatMonthShort(d)).toBe("may 26");
    expect(formatDayShort(d, "UTC")).toBe("16 may");
  });
});

describe("parseDateParam", () => {
  it("reads a YYYY-MM-DD param as that box civil day", () => {
    const d = parseDateParam("2026-05-15");
    expect(d).toBeInstanceOf(Date);
    expect(d && dayKey(d)).toBe("2026-05-15");
    expect(d?.toISOString()).toBe("2026-05-15T06:00:00.000Z");
  });

  it("returns null for invalid input", () => {
    expect(parseDateParam("not-a-date")).toBeNull();
    expect(parseDateParam(null)).toBeNull();
    expect(parseDateParam("")).toBeNull();
  });
});
