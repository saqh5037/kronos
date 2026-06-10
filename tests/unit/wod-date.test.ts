import { describe, it, expect } from "vitest";
import {
  todayKeyInTz,
  localDayWindow,
  clampDateKey,
  classToWodDateKey,
} from "@/lib/wod-date";

// ─── todayKeyInTz ─────────────────────────────────────────────────────────────

describe("todayKeyInTz", () => {
  it("23:30 CDMX (= 05:30Z next calendar day) → same local day", () => {
    // 2026-06-10T23:30 CDMX = 2026-06-11T05:30Z (UTC-6)
    const instant = new Date("2026-06-11T05:30:00.000Z");
    expect(todayKeyInTz(instant, "America/Mexico_City")).toBe("2026-06-10");
  });

  it("00:30 CDMX (= 06:30Z same calendar day) → same local day", () => {
    // 2026-06-10T00:30 CDMX = 2026-06-10T06:30Z
    const instant = new Date("2026-06-10T06:30:00.000Z");
    expect(todayKeyInTz(instant, "America/Mexico_City")).toBe("2026-06-10");
  });

  it("midnight UTC-6 boundary: exactly 00:00 CDMX", () => {
    // 2026-06-10T00:00 CDMX = 2026-06-10T06:00Z
    const instant = new Date("2026-06-10T06:00:00.000Z");
    expect(todayKeyInTz(instant, "America/Mexico_City")).toBe("2026-06-10");
  });

  it("23:59 CDMX (= 05:59Z next day) → still same local day", () => {
    const instant = new Date("2026-06-11T05:59:59.000Z");
    expect(todayKeyInTz(instant, "America/Mexico_City")).toBe("2026-06-10");
  });

  it("UTC timezone: 23:30Z → same UTC date", () => {
    const instant = new Date("2026-06-10T23:30:00.000Z");
    expect(todayKeyInTz(instant, "UTC")).toBe("2026-06-10");
  });

  it("UTC+5:30 (IST): 23:30 IST = 18:00Z", () => {
    // 2026-06-10T23:30 IST = 2026-06-10T18:00Z
    const instant = new Date("2026-06-10T18:00:00.000Z");
    expect(todayKeyInTz(instant, "Asia/Kolkata")).toBe("2026-06-10");
  });
});

// ─── localDayWindow ───────────────────────────────────────────────────────────

describe("localDayWindow", () => {
  it("CDMX (UTC-6): 2026-06-10 → start=06:00Z, end=next day 05:59:59.999Z", () => {
    const { start, end } = localDayWindow("2026-06-10", "America/Mexico_City");
    expect(start.toISOString()).toBe("2026-06-10T06:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-11T05:59:59.999Z");
  });

  it("UTC: 2026-06-10 → start=00:00Z, end=23:59:59.999Z", () => {
    const { start, end } = localDayWindow("2026-06-10", "UTC");
    expect(start.toISOString()).toBe("2026-06-10T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-10T23:59:59.999Z");
  });

  it("evening class at 20:30 CDMX (= 02:30Z next day) is WITHIN CDMX window for that date", () => {
    // A 20:30 CDMX = 2026-06-11T02:30Z is within window for 2026-06-10 CDMX
    const { start, end } = localDayWindow("2026-06-10", "America/Mexico_City");
    const eveningClass = new Date("2026-06-11T02:30:00.000Z");
    expect(eveningClass.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(eveningClass.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("morning class at 06:00 CDMX (= 12:00Z same day) is WITHIN CDMX window", () => {
    const { start, end } = localDayWindow("2026-06-10", "America/Mexico_City");
    const morningClass = new Date("2026-06-10T12:00:00.000Z");
    expect(morningClass.getTime()).toBeGreaterThanOrEqual(start.getTime());
    expect(morningClass.getTime()).toBeLessThanOrEqual(end.getTime());
  });

  it("a class at UTC-midnight (00:01Z) on June 10 is NOT in CDMX window for June 10 (it's June 9 CDMX)", () => {
    // 00:01Z June 10 = June 9 18:01 CDMX → belongs to June 9 local window, not June 10
    const { start } = localDayWindow("2026-06-10", "America/Mexico_City");
    const lateUTC = new Date("2026-06-10T00:01:00.000Z");
    expect(lateUTC.getTime()).toBeLessThan(start.getTime());
  });
});

// ─── clampDateKey ──────────────────────────────────────────────────────────────

describe("clampDateKey", () => {
  const today = "2026-06-10";
  const tz = "America/Mexico_City";
  // We pass a fixed "now" instant: 2026-06-10T12:00 CDMX = 18:00Z
  const nowInstant = new Date("2026-06-10T18:00:00.000Z");

  it("today passes through", () => {
    expect(clampDateKey(today, tz, nowInstant)).toBe("2026-06-10");
  });

  it("-7 days passes through", () => {
    expect(clampDateKey("2026-06-03", tz, nowInstant)).toBe("2026-06-03");
  });

  it("+7 days passes through", () => {
    expect(clampDateKey("2026-06-17", tz, nowInstant)).toBe("2026-06-17");
  });

  it("-8 days clamps to -7", () => {
    expect(clampDateKey("2026-06-02", tz, nowInstant)).toBe("2026-06-03");
  });

  it("+8 days clamps to +7", () => {
    expect(clampDateKey("2026-06-18", tz, nowInstant)).toBe("2026-06-17");
  });

  it("invalid format rejects (returns today)", () => {
    expect(clampDateKey("not-a-date", tz, nowInstant)).toBe("2026-06-10");
  });

  it("wrong format YYYYMMDD rejects (returns today)", () => {
    expect(clampDateKey("20260610", tz, nowInstant)).toBe("2026-06-10");
  });
});

// ─── classToWodDateKey ────────────────────────────────────────────────────────

describe("classToWodDateKey", () => {
  const tz = "America/Mexico_City"; // UTC-6

  it("evening class 20:30 CDMX stored as next-day UTC → returns local calendar day", () => {
    // 20:30 CDMX on June 10 = 02:30Z June 11 (UTC-6)
    const startsAt = new Date("2026-06-11T02:30:00.000Z");
    expect(classToWodDateKey(startsAt, tz)).toBe("2026-06-10");
  });

  it("morning class 06:00 CDMX → returns local calendar day", () => {
    // 06:00 CDMX on June 10 = 12:00Z June 10
    const startsAt = new Date("2026-06-10T12:00:00.000Z");
    expect(classToWodDateKey(startsAt, tz)).toBe("2026-06-10");
  });

  it("accepts ISO string input (as stored in DB / serialized over RSC boundary)", () => {
    // Same evening class scenario but passed as string
    const startsAt = "2026-06-11T02:30:00.000Z";
    expect(classToWodDateKey(startsAt, tz)).toBe("2026-06-10");
  });

  it("midnight edge 00:00 CDMX = 06:00Z → same local day", () => {
    const startsAt = new Date("2026-06-10T06:00:00.000Z");
    expect(classToWodDateKey(startsAt, tz)).toBe("2026-06-10");
  });

  it("UTC timezone: class time matches calendar date directly", () => {
    const startsAt = new Date("2026-06-10T20:30:00.000Z");
    expect(classToWodDateKey(startsAt, "UTC")).toBe("2026-06-10");
  });
});
