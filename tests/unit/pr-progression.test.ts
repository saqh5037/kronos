import { describe, it, expect } from "vitest";
import { buildPRProgression } from "../../src/lib/prs/log";
import { daysSinceLastAttempt, isStale } from "../../src/lib/prs/freshness";

describe("buildPRProgression", () => {
  it("returns empty array when no attempts", () => {
    expect(buildPRProgression([])).toEqual([]);
  });

  it("orders by date ascending and flags last as current best", () => {
    const out = buildPRProgression([
      { achievedAt: "2026-03-01T00:00:00.000Z", value: 100 },
      { achievedAt: "2026-01-01T00:00:00.000Z", value: 80 },
      { achievedAt: "2026-02-01T00:00:00.000Z", value: 90 },
    ]);
    expect(out.map((p) => p.value)).toEqual([80, 90, 100]);
    expect(out[0].isCurrentBest).toBe(false);
    expect(out[1].isCurrentBest).toBe(false);
    expect(out[2].isCurrentBest).toBe(true);
  });

  it("first point has deltaPct 0; subsequent points compute % improvement (WEIGHT, higher better)", () => {
    const out = buildPRProgression(
      [
        { achievedAt: "2026-01-01T00:00:00.000Z", value: 100 },
        { achievedAt: "2026-02-01T00:00:00.000Z", value: 110 }, // +10%
        { achievedAt: "2026-03-01T00:00:00.000Z", value: 121 }, // +10%
      ],
      "WEIGHT",
    );
    expect(out[0].deltaPct).toBe(0);
    expect(out[1].deltaPct).toBe(10);
    expect(out[2].deltaPct).toBe(10);
  });

  it("TIME progression reports positive deltaPct when faster", () => {
    const out = buildPRProgression(
      [
        { achievedAt: "2026-01-01T00:00:00.000Z", value: 200 },
        { achievedAt: "2026-02-01T00:00:00.000Z", value: 180 }, // 10% faster
      ],
      "TIME",
    );
    expect(out[1].deltaPct).toBe(10);
  });

  it("Date objects and ISO strings sort consistently", () => {
    const out = buildPRProgression([
      { achievedAt: new Date("2026-02-01T00:00:00.000Z"), value: 110 },
      { achievedAt: "2026-01-01T00:00:00.000Z", value: 100 },
    ]);
    expect(out[0].value).toBe(100);
    expect(out[1].value).toBe(110);
  });

  it("preserves date as ISO string in output", () => {
    const out = buildPRProgression([
      { achievedAt: new Date("2026-01-15T12:00:00.000Z"), value: 100 },
    ]);
    expect(out[0].date).toBe("2026-01-15T12:00:00.000Z");
  });
});

describe("daysSinceLastAttempt", () => {
  it("returns null when date is missing", () => {
    expect(daysSinceLastAttempt(null)).toBeNull();
    expect(daysSinceLastAttempt(undefined)).toBeNull();
  });

  it("returns 0 for earlier today", () => {
    const now = new Date("2026-05-04T18:00:00.000Z");
    const earlier = new Date("2026-05-04T03:00:00.000Z");
    expect(daysSinceLastAttempt(earlier, now)).toBe(0);
  });

  it("returns whole days for past dates", () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const past = new Date("2026-04-04T12:00:00.000Z"); // exactly 30d
    expect(daysSinceLastAttempt(past, now)).toBe(30);
  });

  it("clamps future dates to 0", () => {
    const now = new Date("2026-05-04T00:00:00.000Z");
    const future = new Date("2026-05-10T00:00:00.000Z");
    expect(daysSinceLastAttempt(future, now)).toBe(0);
  });

  it("returns null for invalid date strings", () => {
    expect(daysSinceLastAttempt("not-a-date")).toBeNull();
  });
});

describe("isStale", () => {
  it("returns false when no prior attempt (different signal)", () => {
    expect(isStale(null)).toBe(false);
  });

  it("flags as stale at threshold and beyond", () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const day29 = new Date("2026-04-05T12:00:00.000Z");
    const day30 = new Date("2026-04-04T12:00:00.000Z");
    const day40 = new Date("2026-03-25T12:00:00.000Z");
    expect(isStale(day29, 30, now)).toBe(false);
    expect(isStale(day30, 30, now)).toBe(true);
    expect(isStale(day40, 30, now)).toBe(true);
  });
});
