import { describe, it, expect } from "vitest";
import {
  sortClassesByStart,
  isFinished,
  upcomingClasses,
  pickNextClass,
  dayKeyLocal,
} from "@/app/admin/_lib/schedule";

const d = (iso: string) => new Date(iso);

describe("sortClassesByStart", () => {
  it("orders the dashboard list chronologically (audit: 18:00, 19:00, 06:00…)", () => {
    const classes = [
      { id: "18", startsAt: d("2026-09-15T18:00:00") },
      { id: "19", startsAt: d("2026-09-15T19:00:00") },
      { id: "06", startsAt: d("2026-09-15T06:00:00") },
      { id: "09", startsAt: d("2026-09-15T09:00:00") },
      { id: "17", startsAt: d("2026-09-15T17:00:00") },
    ];
    expect(sortClassesByStart(classes).map((c) => c.id)).toEqual([
      "06",
      "09",
      "17",
      "18",
      "19",
    ]);
  });

  it("accepts ISO strings (client DTOs) as well as Date", () => {
    const classes = [
      { id: "b", startsAt: "2026-09-15T19:00:00.000Z" },
      { id: "a", startsAt: "2026-09-15T06:00:00.000Z" },
    ];
    expect(sortClassesByStart(classes).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input array", () => {
    const classes = [
      { id: "b", startsAt: d("2026-09-15T19:00:00") },
      { id: "a", startsAt: d("2026-09-15T06:00:00") },
    ];
    sortClassesByStart(classes);
    expect(classes.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("is stable for identical start times", () => {
    const classes = [
      { id: "first", startsAt: d("2026-09-15T06:00:00") },
      { id: "second", startsAt: d("2026-09-15T06:00:00") },
    ];
    expect(sortClassesByStart(classes).map((c) => c.id)).toEqual([
      "first",
      "second",
    ]);
  });
});

describe("isFinished", () => {
  const now = d("2026-09-15T12:52:00");

  it("is true for a class that ended before now", () => {
    expect(
      isFinished({ startsAt: d("2026-09-15T06:00:00"), durationMin: 60 }, now),
    ).toBe(true);
  });

  it("is false for a class still running", () => {
    expect(
      isFinished({ startsAt: d("2026-09-15T12:30:00"), durationMin: 60 }, now),
    ).toBe(false);
  });

  it("is false for a future class", () => {
    expect(
      isFinished({ startsAt: d("2026-09-15T17:00:00"), durationMin: 60 }, now),
    ).toBe(false);
  });

  it("falls back to 60 min when duration is missing or invalid", () => {
    expect(isFinished({ startsAt: d("2026-09-15T12:30:00") }, now)).toBe(false);
    expect(
      isFinished(
        { startsAt: d("2026-09-15T11:00:00"), durationMin: null },
        now,
      ),
    ).toBe(true);
    expect(
      isFinished({ startsAt: d("2026-09-15T12:30:00"), durationMin: 0 }, now),
    ).toBe(false);
  });

  it("treats the exact end instant as finished", () => {
    expect(
      isFinished({ startsAt: d("2026-09-15T11:52:00"), durationMin: 60 }, now),
    ).toBe(true);
  });
});

describe("upcomingClasses", () => {
  it("hides the morning classes that already ran and sorts the rest", () => {
    const now = d("2026-09-15T12:52:00");
    const classes = [
      { id: "17", startsAt: d("2026-09-15T17:00:00"), durationMin: 60 },
      { id: "06", startsAt: d("2026-09-15T06:00:00"), durationMin: 60 },
      { id: "19", startsAt: d("2026-09-15T19:00:00"), durationMin: 60 },
      { id: "07", startsAt: d("2026-09-15T07:00:00"), durationMin: 60 },
      { id: "18", startsAt: d("2026-09-15T18:00:00"), durationMin: 60 },
    ];
    expect(upcomingClasses(classes, now).map((c) => c.id)).toEqual([
      "17",
      "18",
      "19",
    ]);
  });

  it("returns an empty list once the day is over", () => {
    const now = d("2026-09-15T23:00:00");
    const classes = [
      { id: "18", startsAt: d("2026-09-15T18:00:00"), durationMin: 60 },
    ];
    expect(upcomingClasses(classes, now)).toEqual([]);
  });
});

describe("pickNextClass", () => {
  it("auto-selects the next class, not the 06:00 Murph that already ran", () => {
    const now = d("2026-09-15T12:46:00");
    const classes = [
      { id: "murph-06", startsAt: d("2026-09-15T06:00:00"), durationMin: 60 },
      { id: "17", startsAt: d("2026-09-15T17:00:00"), durationMin: 60 },
      { id: "18", startsAt: d("2026-09-15T18:00:00"), durationMin: 60 },
    ];
    expect(pickNextClass(classes, now)?.id).toBe("17");
  });

  it("selects a class that is running right now", () => {
    const now = d("2026-09-15T17:20:00");
    const classes = [
      { id: "17", startsAt: d("2026-09-15T17:00:00"), durationMin: 60 },
      { id: "18", startsAt: d("2026-09-15T18:00:00"), durationMin: 60 },
    ];
    expect(pickNextClass(classes, now)?.id).toBe("17");
  });

  it("falls back to the last class when everything has finished", () => {
    const now = d("2026-09-15T23:00:00");
    const classes = [
      { id: "06", startsAt: d("2026-09-15T06:00:00"), durationMin: 60 },
      { id: "19", startsAt: d("2026-09-15T19:00:00"), durationMin: 60 },
    ];
    expect(pickNextClass(classes, now)?.id).toBe("19");
  });

  it("returns null for an empty list", () => {
    expect(pickNextClass([], d("2026-09-15T12:00:00"))).toBeNull();
  });
});

describe("dayKeyLocal", () => {
  it("keeps an evening class in its own local day", () => {
    // 19:00 local is already the next day in UTC — the Programación bug.
    expect(dayKeyLocal(new Date(2026, 8, 15, 19, 0, 0))).toBe("2026-09-15");
  });

  it("zero-pads month and day", () => {
    expect(dayKeyLocal(new Date(2026, 0, 5, 6, 0, 0))).toBe("2026-01-05");
  });

  it("groups every class of one local day under the same key", () => {
    const keys = [
      new Date(2026, 8, 15, 6, 0, 0),
      new Date(2026, 8, 15, 18, 0, 0),
      new Date(2026, 8, 15, 19, 30, 0),
    ].map((x) => dayKeyLocal(x));
    expect(new Set(keys).size).toBe(1);
  });
});
