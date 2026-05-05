import { describe, it, expect } from "vitest";
import {
  computeAdherence,
  adherenceDelta,
} from "../../src/lib/adherence/compute";
import { buildAthleteHeatmap } from "../../src/lib/adherence/heatmap";

describe("computeAdherence", () => {
  it("computes the three ratios", () => {
    const r = computeAdherence({ offered: 20, booked: 16, attended: 14 });
    expect(r.bookingRate).toBe(0.8);
    expect(r.attendanceRate).toBe(0.7);
    expect(r.showUpRate).toBe(0.875);
  });

  it("zero offered → zero ratios (no division by zero)", () => {
    const r = computeAdherence({ offered: 0, booked: 0, attended: 0 });
    expect(r.attendanceRate).toBe(0);
    expect(r.bookingRate).toBe(0);
    expect(r.showUpRate).toBe(0);
  });

  it("zero booked → showUpRate = 0", () => {
    const r = computeAdherence({ offered: 10, booked: 0, attended: 0 });
    expect(r.showUpRate).toBe(0);
  });

  it("perfect adherence is 1", () => {
    const r = computeAdherence({ offered: 5, booked: 5, attended: 5 });
    expect(r.attendanceRate).toBe(1);
    expect(r.showUpRate).toBe(1);
  });
});

describe("adherenceDelta", () => {
  it("returns signed delta in fractional points", () => {
    const curr = computeAdherence({ offered: 20, booked: 18, attended: 17 });
    const prev = computeAdherence({ offered: 20, booked: 14, attended: 12 });
    const d = adherenceDelta(curr, prev);
    // current 0.85 attended vs prev 0.6 → +0.25
    expect(d.attendanceRate).toBeCloseTo(0.25, 2);
    expect(d.bookingRate).toBeCloseTo(0.2, 2);
  });

  it("declining adherence is negative delta", () => {
    const curr = computeAdherence({ offered: 20, booked: 8, attended: 6 });
    const prev = computeAdherence({ offered: 20, booked: 18, attended: 16 });
    const d = adherenceDelta(curr, prev);
    expect(d.attendanceRate).toBeLessThan(0);
  });
});

describe("buildAthleteHeatmap", () => {
  it("returns empty for no events", () => {
    expect(buildAthleteHeatmap([], "UTC")).toEqual([]);
  });

  it("buckets events by (day, hour) in the given timezone", () => {
    // 2026-04-27 (Monday) at 18:00 UTC
    const events = [
      { date: "2026-04-27T18:00:00.000Z" },
      { date: "2026-04-27T18:30:00.000Z" }, // same bucket
      { date: "2026-04-28T18:00:00.000Z" }, // next day
    ];
    const cells = buildAthleteHeatmap(events, "UTC");
    expect(cells).toEqual([
      { day: 1, hour: 18, count: 2 },
      { day: 2, hour: 18, count: 1 },
    ]);
  });

  it("respects timezone shift (Mexico City UTC-6)", () => {
    // 2026-04-28T03:00:00Z is still 2026-04-27 21:00 in CDT
    const cells = buildAthleteHeatmap(
      [{ date: "2026-04-28T03:00:00.000Z" }],
      "America/Mexico_City",
    );
    expect(cells).toHaveLength(1);
    // Day 1 (Mon), hour 21 (9pm)
    expect(cells[0].day).toBe(1);
    expect(cells[0].hour).toBe(21);
  });

  it("falls back to UTC when timezone is invalid", () => {
    const cells = buildAthleteHeatmap(
      [{ date: "2026-04-27T18:00:00.000Z" }],
      "Not/A_Real_Tz",
    );
    expect(cells).toHaveLength(1);
    expect(cells[0].day).toBe(1);
    expect(cells[0].hour).toBe(18);
  });

  it("skips invalid date strings", () => {
    const cells = buildAthleteHeatmap(
      [{ date: "not-a-date" }, { date: "2026-04-27T18:00:00.000Z" }],
      "UTC",
    );
    expect(cells).toHaveLength(1);
  });
});
