/**
 * src/server/period-summary/period.ts — pure period resolution, labels and
 * timezone-aware day-series generation.
 *
 * Why this file exists: P0 #6 of the 2026-09-15 audit ("one fact, many
 * numbers"). One of its symptoms was the owner dashboard rendering an April
 * x-axis under an "últimos 30 días" label, because the series was not derived
 * from the requested period. These tests pin the contract: the series is
 * generated from `from..to` in the BOX timezone, never from whatever rows the
 * query happened to return.
 */

import { describe, it, expect } from "vitest";
import {
  dayKeyInTz,
  eachDayKeyInPeriod,
  periodLabel,
  previousPeriodOf,
  resolvePeriod,
} from "../../src/server/period-summary/period";

const MX = "America/Mexico_City"; // fixed UTC-6 since 2022 (no DST)

describe("dayKeyInTz", () => {
  it("returns the civil day in the given timezone, not UTC", () => {
    // 2026-09-16T05:00:00Z === 2026-09-15 23:00 in CDMX
    const d = new Date("2026-09-16T05:00:00.000Z");
    expect(dayKeyInTz(d, MX)).toBe("2026-09-15");
    expect(dayKeyInTz(d, "UTC")).toBe("2026-09-16");
  });

  it("handles the first instant of a CDMX day", () => {
    // 2026-09-01T06:00:00Z === 2026-09-01 00:00 in CDMX
    expect(dayKeyInTz(new Date("2026-09-01T06:00:00.000Z"), MX)).toBe(
      "2026-09-01",
    );
    // one millisecond earlier still belongs to August 31 in CDMX
    expect(dayKeyInTz(new Date("2026-09-01T05:59:59.999Z"), MX)).toBe(
      "2026-08-31",
    );
  });

  it("falls back to UTC for an unknown timezone instead of throwing", () => {
    expect(dayKeyInTz(new Date("2026-09-16T05:00:00.000Z"), "Not/AZone")).toBe(
      "2026-09-16",
    );
  });
});

describe("eachDayKeyInPeriod", () => {
  it("covers exactly the requested period (CDMX midnight edges)", () => {
    const period = {
      from: new Date("2026-09-01T06:00:00.000Z"), // Sep 1 00:00 CDMX
      to: new Date("2026-09-16T05:59:59.999Z"), // Sep 15 23:59:59.999 CDMX
      tz: MX,
    };
    const keys = eachDayKeyInPeriod(period);
    expect(keys).toHaveLength(15);
    expect(keys[0]).toBe("2026-09-01");
    expect(keys[keys.length - 1]).toBe("2026-09-15");
  });

  it("does not leak an extra UTC day at the tail", () => {
    // Naive UTC bucketing would add "2026-09-16" here.
    const keys = eachDayKeyInPeriod({
      from: new Date("2026-09-15T06:00:00.000Z"),
      to: new Date("2026-09-16T05:59:59.999Z"),
      tz: MX,
    });
    expect(keys).toEqual(["2026-09-15"]);
  });

  it("does not lose the head day when `from` lands before local midnight", () => {
    const keys = eachDayKeyInPeriod({
      from: new Date("2026-09-15T05:00:00.000Z"), // Sep 14 23:00 CDMX
      to: new Date("2026-09-16T05:00:00.000Z"), // Sep 15 23:00 CDMX
      tz: MX,
    });
    expect(keys).toEqual(["2026-09-14", "2026-09-15"]);
  });

  it("produces 30 keys for the last30 preset", () => {
    const period = resolvePeriod(
      { preset: "last30", tz: MX },
      new Date("2026-09-15T18:52:00.000Z"),
    );
    expect(eachDayKeyInPeriod(period)).toHaveLength(30);
  });

  it("spans a month boundary without gaps or duplicates", () => {
    const keys = eachDayKeyInPeriod({
      from: new Date("2026-08-30T06:00:00.000Z"),
      to: new Date("2026-09-03T05:59:59.999Z"),
      tz: MX,
    });
    expect(keys).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });

  it("returns a single key when `to` precedes `from`", () => {
    const keys = eachDayKeyInPeriod({
      from: new Date("2026-09-10T06:00:00.000Z"),
      to: new Date("2026-09-01T06:00:00.000Z"),
      tz: MX,
    });
    expect(keys).toEqual(["2026-09-10"]);
  });
});

describe("periodLabel", () => {
  it("uses the canonical preset label when a preset is present", () => {
    const now = new Date("2026-09-15T18:52:00.000Z");
    expect(periodLabel(resolvePeriod({ preset: "last30", tz: MX }, now))).toBe(
      "últimos 30 días",
    );
    expect(periodLabel(resolvePeriod({ preset: "today", tz: MX }, now))).toBe(
      "hoy",
    );
    expect(periodLabel(resolvePeriod({ preset: "last7", tz: MX }, now))).toBe(
      "últimos 7 días",
    );
    expect(periodLabel(resolvePeriod({ preset: "last90", tz: MX }, now))).toBe(
      "últimos 90 días",
    );
    expect(
      periodLabel(resolvePeriod({ preset: "thisMonth", tz: MX }, now)),
    ).toBe("este mes");
    expect(
      periodLabel(resolvePeriod({ preset: "lastMonth", tz: MX }, now)),
    ).toBe("mes pasado");
  });

  it("labels a custom range inside one month as `1–15 sep`", () => {
    expect(
      periodLabel({
        from: new Date("2026-09-01T06:00:00.000Z"),
        to: new Date("2026-09-16T05:59:59.999Z"),
        tz: MX,
      }),
    ).toBe("1–15 sep");
  });

  it("labels a single day without a range dash", () => {
    expect(
      periodLabel({
        from: new Date("2026-09-15T06:00:00.000Z"),
        to: new Date("2026-09-16T05:59:59.999Z"),
        tz: MX,
      }),
    ).toBe("15 sep");
  });

  it("labels a cross-month range with both months", () => {
    expect(
      periodLabel({
        from: new Date("2026-08-28T06:00:00.000Z"),
        to: new Date("2026-09-16T05:59:59.999Z"),
        tz: MX,
      }),
    ).toBe("28 ago – 15 sep");
  });

  it("labels a cross-year range with both years", () => {
    expect(
      periodLabel({
        from: new Date("2025-12-28T06:00:00.000Z"),
        to: new Date("2026-01-04T05:59:59.999Z"),
        tz: MX,
      }),
    ).toBe("28 dic 2025 – 3 ene 2026");
  });

  it("uses deterministic Spanish month abbreviations (not ICU)", () => {
    // ICU renders September as "sept" in some Node builds; the audit needs a
    // stable 3-letter abbreviation across runtimes.
    expect(
      periodLabel({
        from: new Date("2026-09-15T06:00:00.000Z"),
        to: new Date("2026-09-16T05:59:59.999Z"),
        tz: MX,
      }),
    ).not.toContain("sept");
  });
});

describe("resolvePeriod", () => {
  it("defaults to last30 when nothing is given", () => {
    const p = resolvePeriod({ tz: MX }, new Date("2026-09-15T18:52:00.000Z"));
    expect(p.preset).toBe("last30");
    expect(p.label).toBe("últimos 30 días");
    expect(eachDayKeyInPeriod(p)).toHaveLength(30);
  });

  it("honours an explicit from/to pair and drops the preset", () => {
    const p = resolvePeriod({
      from: new Date("2026-09-01T06:00:00.000Z"),
      to: new Date("2026-09-16T05:59:59.999Z"),
      tz: MX,
    });
    expect(p.preset).toBeUndefined();
    expect(p.label).toBe("1–15 sep");
  });

  it("defaults the timezone to UTC when the box has none", () => {
    const p = resolvePeriod({ preset: "today" });
    expect(p.tz).toBe("UTC");
  });

  it("clamps an inverted range instead of producing an empty series", () => {
    const p = resolvePeriod({
      from: new Date("2026-09-10T06:00:00.000Z"),
      to: new Date("2026-09-01T06:00:00.000Z"),
      tz: MX,
    });
    expect(p.from.getTime()).toBeLessThanOrEqual(p.to.getTime());
  });
});

describe("previousPeriodOf", () => {
  it("returns the symmetric window immediately before the period", () => {
    const period = resolvePeriod(
      { preset: "last30", tz: MX },
      new Date("2026-09-15T18:52:00.000Z"),
    );
    const prev = previousPeriodOf(period);
    expect(eachDayKeyInPeriod(prev)).toHaveLength(30);
    expect(prev.to.getTime()).toBeLessThan(period.from.getTime());
    expect(prev.tz).toBe(MX);
  });

  it("never overlaps the current period", () => {
    const period = {
      from: new Date("2026-09-01T06:00:00.000Z"),
      to: new Date("2026-09-16T05:59:59.999Z"),
      tz: MX,
    };
    const prev = previousPeriodOf(period);
    expect(prev.to.getTime()).toBeLessThan(period.from.getTime());
    expect(eachDayKeyInPeriod(prev)).toHaveLength(15);
  });
});
