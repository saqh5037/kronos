/**
 * The period summary is memoised per request. This file pins the one safety
 * invariant of that memo: the key is ALWAYS tenant-scoped.
 *
 * Context: `src/server/session.ts` documents a real cross-tenant leak from
 * 2026-05-17 caused by a React `cache()` with an empty key. The summary must
 * not repeat it.
 */

import { describe, it, expect } from "vitest";
import { periodSummaryCacheKey } from "../../src/server/period-summary";
import { resolvePeriod } from "../../src/server/period-summary/period";

const MX = "America/Mexico_City";
const NOW = new Date("2026-09-15T18:52:00.000Z");
const period = resolvePeriod({ preset: "last30", tz: MX }, NOW);

describe("periodSummaryCacheKey", () => {
  it("starts with the tenantId", () => {
    expect(periodSummaryCacheKey("box-a", period).startsWith("box-a::")).toBe(
      true,
    );
  });

  it("never collides across tenants for the same period", () => {
    expect(periodSummaryCacheKey("box-a", period)).not.toBe(
      periodSummaryCacheKey("box-b", period),
    );
  });

  it("is stable for the same tenant, period and filter", () => {
    expect(periodSummaryCacheKey("box-a", period)).toBe(
      periodSummaryCacheKey("box-a", period),
    );
  });

  it("changes when the period changes", () => {
    const other = resolvePeriod({ preset: "last7", tz: MX }, NOW);
    expect(periodSummaryCacheKey("box-a", period)).not.toBe(
      periodSummaryCacheKey("box-a", other),
    );
  });

  it("changes when the payments filter changes", () => {
    expect(
      periodSummaryCacheKey("box-a", period, {
        paymentFilter: { status: "PAID" },
      }),
    ).not.toBe(periodSummaryCacheKey("box-a", period));
  });

  it("changes when the timezone changes", () => {
    const utc = resolvePeriod({ preset: "last30", tz: "UTC" }, NOW);
    expect(periodSummaryCacheKey("box-a", utc)).not.toBe(
      periodSummaryCacheKey("box-a", period),
    );
  });

  it("changes when the at-risk or grace windows are overridden", () => {
    expect(
      periodSummaryCacheKey("box-a", period, { inactivityDays: 30 }),
    ).not.toBe(periodSummaryCacheKey("box-a", period));
    expect(periodSummaryCacheKey("box-a", period, { graceDays: 5 })).not.toBe(
      periodSummaryCacheKey("box-a", period),
    );
  });

  it("normalises search casing and padding so equal filters share one entry", () => {
    expect(
      periodSummaryCacheKey("box-a", period, {
        paymentFilter: { search: "  Emma " },
      }),
    ).toBe(
      periodSummaryCacheKey("box-a", period, {
        paymentFilter: { search: "emma" },
      }),
    );
  });
});
