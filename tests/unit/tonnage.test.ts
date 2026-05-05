import { describe, it, expect } from "vitest";
import {
  computeWODTonnage,
  SCALING_FACTOR,
} from "../../src/lib/tonnage/compute";
import {
  aggregateTonnageByPeriod,
  isoWeekKey,
  dayKey,
  monthKey,
} from "../../src/lib/tonnage/aggregate";

describe("computeWODTonnage", () => {
  it("returns 0 for empty movements", () => {
    expect(computeWODTonnage([], "RX")).toBe(0);
  });

  it("skips movements without reps or weight", () => {
    expect(
      computeWODTonnage(
        [
          { reps: null, weight: 100 },
          { reps: 10, weight: null },
          { reps: 0, weight: 100 },
          { reps: 10, weight: 0 },
        ],
        "RX",
      ),
    ).toBe(0);
  });

  it("RX factor = 1, sums reps × weight", () => {
    // 5 × 100 + 10 × 50 = 500 + 500 = 1000
    expect(
      computeWODTonnage(
        [
          { reps: 5, weight: 100 },
          { reps: 10, weight: 50 },
        ],
        "RX",
      ),
    ).toBe(1000);
  });

  it("SCALED factor reduces total", () => {
    // 1000 × 0.7 = 700
    const out = computeWODTonnage([{ reps: 5, weight: 200 }], "SCALED");
    expect(out).toBe(700);
  });

  it("RXPLUS factor inflates total", () => {
    // 100 × 1.05 = 105
    const out = computeWODTonnage([{ reps: 1, weight: 100 }], "RXPLUS");
    expect(out).toBe(105);
  });

  it("rounds to 2 decimals", () => {
    // 7 × 73.456 × 1 = 514.192 → rounded to 514.19
    expect(computeWODTonnage([{ reps: 7, weight: 73.456 }], "RX")).toBe(514.19);
  });

  it("scaling table is exposed for admin overrides", () => {
    expect(SCALING_FACTOR.RX).toBe(1);
    expect(SCALING_FACTOR.SCALED).toBe(0.7);
    expect(SCALING_FACTOR.RXPLUS).toBe(1.05);
  });
});

describe("isoWeekKey", () => {
  it("formats YYYY-Www with zero-padding", () => {
    // Mon 2026-04-27 is week 18 of 2026
    expect(isoWeekKey(new Date("2026-04-27T12:00:00.000Z"))).toBe("2026-W18");
    // Wed 2026-01-07 is in week 02 (or 01)
    const k = isoWeekKey(new Date("2026-01-07T12:00:00.000Z"));
    expect(k).toMatch(/^2026-W0[12]$/);
  });
});

describe("aggregateTonnageByPeriod", () => {
  it("buckets by day and sums kg + sessions", () => {
    const out = aggregateTonnageByPeriod(
      [
        { date: "2026-04-01T08:00:00.000Z", kg: 500 },
        { date: "2026-04-01T18:00:00.000Z", kg: 200 },
        { date: "2026-04-02T08:00:00.000Z", kg: 300 },
      ],
      "day",
    );
    expect(out).toEqual([
      { bucket: "2026-04-01", kg: 700, sessions: 2 },
      { bucket: "2026-04-02", kg: 300, sessions: 1 },
    ]);
  });

  it("buckets by week", () => {
    const out = aggregateTonnageByPeriod(
      [
        { date: "2026-04-27T08:00:00.000Z", kg: 100 },
        { date: "2026-04-29T08:00:00.000Z", kg: 200 },
      ],
      "week",
    );
    expect(out).toHaveLength(1);
    expect(out[0].kg).toBe(300);
    expect(out[0].sessions).toBe(2);
  });

  it("buckets by month", () => {
    const out = aggregateTonnageByPeriod(
      [
        { date: "2026-04-01T08:00:00.000Z", kg: 100 },
        { date: "2026-04-29T08:00:00.000Z", kg: 200 },
        { date: "2026-05-01T08:00:00.000Z", kg: 50 },
      ],
      "month",
    );
    expect(out).toEqual([
      { bucket: "2026-04", kg: 300, sessions: 2 },
      { bucket: "2026-05", kg: 50, sessions: 1 },
    ]);
  });

  it("handles empty input", () => {
    expect(aggregateTonnageByPeriod([], "week")).toEqual([]);
  });

  it("rounds aggregated kg to 2 decimals", () => {
    const out = aggregateTonnageByPeriod(
      [
        { date: "2026-04-01T00:00:00.000Z", kg: 100.111 },
        { date: "2026-04-01T01:00:00.000Z", kg: 100.222 },
      ],
      "day",
    );
    expect(out[0].kg).toBe(200.33);
  });

  it("dayKey/monthKey use UTC", () => {
    const d = new Date("2026-04-01T23:30:00.000Z");
    expect(dayKey(d)).toBe("2026-04-01");
    expect(monthKey(d)).toBe("2026-04");
  });
});
