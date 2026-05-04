/**
 * Class validation + recurrence expansion tests.
 */
import { describe, it, expect } from "vitest";
import {
  classSchema,
  recurrenceToRRule,
  expandRecurrence,
} from "../../src/lib/validations/class";

describe("classSchema", () => {
  it("parses a minimal valid class with defaults", () => {
    const parsed = classSchema.parse({
      startsAt: "2026-06-01T07:00:00.000Z",
    });
    expect(parsed.durationMin).toBe(60);
    expect(parsed.capacity).toBe(16);
    expect(parsed.startsAt).toBeInstanceOf(Date);
    expect(parsed.startsAt.toISOString()).toBe("2026-06-01T07:00:00.000Z");
  });

  it("coerces numeric strings (form data)", () => {
    const parsed = classSchema.parse({
      startsAt: "2026-06-01T07:00:00.000Z",
      durationMin: "75",
      capacity: "20",
    });
    expect(parsed.durationMin).toBe(75);
    expect(parsed.capacity).toBe(20);
  });

  it("treats empty coachId/wodId as null", () => {
    const parsed = classSchema.parse({
      startsAt: "2026-06-01T07:00:00.000Z",
      coachId: "",
      wodId: "",
    });
    expect(parsed.coachId).toBeNull();
    expect(parsed.wodId).toBeNull();
  });

  it("rejects capacity below 1", () => {
    expect(() =>
      classSchema.parse({
        startsAt: "2026-06-01T07:00:00.000Z",
        capacity: 0,
      }),
    ).toThrow();
  });

  it("rejects duration below 15 minutes", () => {
    expect(() =>
      classSchema.parse({
        startsAt: "2026-06-01T07:00:00.000Z",
        durationMin: 10,
      }),
    ).toThrow();
  });

  it("rejects an invalid date string", () => {
    expect(() => classSchema.parse({ startsAt: "not-a-date" })).toThrow();
  });

  it("accepts recurrence freq + count", () => {
    const parsed = classSchema.parse({
      startsAt: "2026-06-01T07:00:00.000Z",
      recurrence: { freq: "WEEKLY", count: 8 },
    });
    expect(parsed.recurrence?.freq).toBe("WEEKLY");
    expect(parsed.recurrence?.count).toBe(8);
  });

  it("rejects recurrence count over 52", () => {
    expect(() =>
      classSchema.parse({
        startsAt: "2026-06-01T07:00:00.000Z",
        recurrence: { freq: "WEEKLY", count: 60 },
      }),
    ).toThrow();
  });
});

describe("recurrenceToRRule", () => {
  it("returns null for NONE", () => {
    expect(recurrenceToRRule({ freq: "NONE" })).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(recurrenceToRRule(undefined)).toBeNull();
  });

  it("serializes WEEKLY with count", () => {
    expect(recurrenceToRRule({ freq: "WEEKLY", count: 12 })).toBe(
      "FREQ=WEEKLY;COUNT=12",
    );
  });

  it("serializes DAILY without count", () => {
    expect(recurrenceToRRule({ freq: "DAILY" })).toBe("FREQ=DAILY");
  });
});

describe("expandRecurrence", () => {
  const start = new Date("2026-06-01T07:00:00.000Z"); // Monday

  it("returns just the start date when rrule is null", () => {
    const dates = expandRecurrence(start, null);
    expect(dates).toHaveLength(1);
    expect(dates[0].toISOString()).toBe(start.toISOString());
  });

  it("expands DAILY count=5 to 5 consecutive days", () => {
    const dates = expandRecurrence(start, "FREQ=DAILY;COUNT=5");
    expect(dates).toHaveLength(5);
    expect(dates[0].toISOString()).toBe("2026-06-01T07:00:00.000Z");
    expect(dates[4].toISOString()).toBe("2026-06-05T07:00:00.000Z");
  });

  it("expands WEEKLY count=4 to 4 weekly occurrences", () => {
    const dates = expandRecurrence(start, "FREQ=WEEKLY;COUNT=4");
    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString()).toBe("2026-06-01T07:00:00.000Z");
    expect(dates[3].toISOString()).toBe("2026-06-22T07:00:00.000Z");
  });

  it("preserves time of day across expansions", () => {
    const dates = expandRecurrence(start, "FREQ=WEEKLY;COUNT=2");
    expect(dates[0].getUTCHours()).toBe(7);
    expect(dates[1].getUTCHours()).toBe(7);
  });

  it("falls back to default count=12 when COUNT missing", () => {
    const dates = expandRecurrence(start, "FREQ=WEEKLY");
    expect(dates).toHaveLength(12);
  });
});
