import { describe, it, expect } from "vitest";
import { computeAttendanceStreak } from "../../src/lib/streak";

function daysAgo(n: number, base: Date): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

describe("computeAttendanceStreak", () => {
  // Use a fixed "now" at midday UTC to avoid edge cases on day boundaries.
  const now = new Date("2026-06-01T12:00:00.000Z");

  it("returns 0 for empty events", () => {
    expect(computeAttendanceStreak([], now)).toBe(0);
  });

  it("returns 1 for single event today", () => {
    expect(computeAttendanceStreak([daysAgo(0, now)], now)).toBe(1);
  });

  it("returns 1 for single event yesterday (within grace)", () => {
    expect(computeAttendanceStreak([daysAgo(1, now)], now)).toBe(1);
  });

  it("returns 0 if last event was 2 days ago (streak broken)", () => {
    expect(computeAttendanceStreak([daysAgo(2, now)], now)).toBe(0);
  });

  it("counts 3 consecutive days ending today", () => {
    const events = [daysAgo(0, now), daysAgo(1, now), daysAgo(2, now)];
    expect(computeAttendanceStreak(events, now)).toBe(3);
  });

  it("counts 4 consecutive days ending yesterday", () => {
    const events = [
      daysAgo(1, now),
      daysAgo(2, now),
      daysAgo(3, now),
      daysAgo(4, now),
    ];
    expect(computeAttendanceStreak(events, now)).toBe(4);
  });

  it("breaks streak after a gap day", () => {
    // today, yesterday — gap — 4 days ago, 5 days ago
    const events = [
      daysAgo(0, now),
      daysAgo(1, now),
      daysAgo(4, now),
      daysAgo(5, now),
    ];
    expect(computeAttendanceStreak(events, now)).toBe(2);
  });

  it("dedupes multiple events on same day", () => {
    const events = [
      daysAgo(0, now),
      daysAgo(0, now),
      daysAgo(1, now),
      daysAgo(1, now),
    ];
    expect(computeAttendanceStreak(events, now)).toBe(2);
  });

  it("handles unsorted input correctly", () => {
    const events = [daysAgo(2, now), daysAgo(0, now), daysAgo(1, now)];
    expect(computeAttendanceStreak(events, now)).toBe(3);
  });
});
