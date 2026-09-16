/**
 * `src/lib/tz.ts` — timezone-explicit civil-day arithmetic.
 *
 * P0-5 of the 2026-09-15 fix wave: six unit tests only passed on a machine set
 * to America/Mexico_City, because the code under test computed windows and
 * countdowns with the SERVER's calendar and then rendered them in the box's.
 * Production runs on UTC, so the drift was shipping.
 *
 * Every assertion here names its timezone, so the suite means the same thing in
 * CI and on a laptop.
 */

import { describe, it, expect } from "vitest";
import {
  DEFAULT_BOX_TIMEZONE,
  addCivilDays,
  civilDateInTz,
  civilDateTimeInTz,
  civilDaysBetween,
  dayKeyInTz,
  endOfCivilDay,
  endOfCivilMonth,
  endOfDayInTz,
  formatDayKey,
  instantFromCivil,
  parseDayKey,
  startOfCivilDay,
  startOfCivilMonth,
  startOfDayInTz,
  subCivilMonths,
} from "../../src/lib/tz";

const MX = "America/Mexico_City"; // fixed UTC-6 since 2022
const NY = "America/New_York"; // still observes DST
const UTC = "UTC";

describe("civil readings", () => {
  it("reads the wall clock of the given zone, not the host's", () => {
    const instant = new Date("2026-09-16T05:00:00.000Z");
    expect(civilDateTimeInTz(instant, MX)).toMatchObject({
      year: 2026,
      month: 9,
      day: 15,
      hour: 23,
      minute: 0,
      second: 0,
    });
    expect(civilDateTimeInTz(instant, UTC)).toMatchObject({
      year: 2026,
      month: 9,
      day: 16,
      hour: 5,
    });
  });

  it("reports midnight as hour 0, never hour 24", () => {
    // Some ICU builds render midnight as "24" under h23.
    expect(
      civilDateTimeInTz(new Date("2026-09-15T06:00:00.000Z"), MX).hour,
    ).toBe(0);
  });

  it("degrades an unknown zone to UTC instead of throwing", () => {
    expect(dayKeyInTz(new Date("2026-09-16T05:00:00.000Z"), "Not/AZone")).toBe(
      "2026-09-16",
    );
  });

  it("round-trips a day key", () => {
    expect(formatDayKey(parseDayKey("2026-01-05"))).toBe("2026-01-05");
    expect(parseDayKey("2026-01-05")).toEqual({ year: 2026, month: 1, day: 5 });
  });
});

describe("instantFromCivil", () => {
  it("maps a CDMX wall clock to its UTC instant", () => {
    expect(
      instantFromCivil(
        { year: 2026, month: 9, day: 1, hour: 0 },
        MX,
      ).toISOString(),
    ).toBe("2026-09-01T06:00:00.000Z");
  });

  it("maps a UTC wall clock to itself", () => {
    expect(
      instantFromCivil({ year: 2026, month: 9, day: 1 }, UTC).toISOString(),
    ).toBe("2026-09-01T00:00:00.000Z");
  });

  it("survives a DST transition in a zone that still has one", () => {
    // New York leaves DST on 2026-11-01. Midnight before and after the switch
    // must both resolve to real, distinct instants 24 h apart in civil terms.
    const before = instantFromCivil({ year: 2026, month: 10, day: 31 }, NY);
    const after = instantFromCivil({ year: 2026, month: 11, day: 2 }, NY);
    expect(civilDateInTz(before, NY)).toEqual({
      year: 2026,
      month: 10,
      day: 31,
    });
    expect(civilDateInTz(after, NY)).toEqual({ year: 2026, month: 11, day: 2 });
  });

  it("round-trips every civil day of a DST week", () => {
    for (let day = 28; day <= 30; day++) {
      const civil = { year: 2026, month: 10, day };
      expect(civilDateInTz(startOfCivilDay(civil, NY), NY)).toEqual(civil);
    }
  });
});

describe("day boundaries", () => {
  it("snaps to the box's midnight, not the host's", () => {
    const noon = new Date("2026-09-15T18:00:00.000Z");
    expect(startOfDayInTz(noon, MX).toISOString()).toBe(
      "2026-09-15T06:00:00.000Z",
    );
    expect(endOfDayInTz(noon, MX).toISOString()).toBe(
      "2026-09-16T05:59:59.999Z",
    );
  });

  it("keeps the last millisecond inside the same civil day", () => {
    const end = endOfCivilDay({ year: 2026, month: 9, day: 15 }, MX);
    expect(dayKeyInTz(end, MX)).toBe("2026-09-15");
    expect(dayKeyInTz(new Date(end.getTime() + 1), MX)).toBe("2026-09-16");
  });
});

describe("civil arithmetic", () => {
  it("adds days across a month boundary", () => {
    expect(addCivilDays({ year: 2026, month: 8, day: 30 }, 3)).toEqual({
      year: 2026,
      month: 9,
      day: 2,
    });
  });

  it("subtracts days across a year boundary", () => {
    expect(addCivilDays({ year: 2026, month: 1, day: 2 }, -3)).toEqual({
      year: 2025,
      month: 12,
      day: 30,
    });
  });

  it("counts whole days in both directions", () => {
    const a = { year: 2026, month: 9, day: 15 };
    const b = { year: 2026, month: 10, day: 3 };
    expect(civilDaysBetween(a, b)).toBe(18);
    expect(civilDaysBetween(b, a)).toBe(-18);
    expect(civilDaysBetween(a, a)).toBe(0);
  });

  it("knows the length of every month, leap years included", () => {
    expect(endOfCivilMonth({ year: 2026, month: 2, day: 1 }).day).toBe(28);
    expect(endOfCivilMonth({ year: 2028, month: 2, day: 1 }).day).toBe(29);
    expect(endOfCivilMonth({ year: 2026, month: 9, day: 1 }).day).toBe(30);
    expect(startOfCivilMonth({ year: 2026, month: 9, day: 22 }).day).toBe(1);
  });

  it("clamps when the previous month is shorter", () => {
    expect(subCivilMonths({ year: 2026, month: 3, day: 31 }, 1)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(subCivilMonths({ year: 2026, month: 1, day: 15 }, 1)).toEqual({
      year: 2025,
      month: 12,
      day: 15,
    });
  });
});

describe("house default", () => {
  it("is the timezone every formatter already used", () => {
    expect(DEFAULT_BOX_TIMEZONE).toBe("America/Mexico_City");
  });
});

describe("the test process timezone is pinned", () => {
  // `tests/setup/timezone.ts` defaults TZ to UTC so a bare `pnpm test`
  // reproduces CI. If Node ever stops honouring a runtime `process.env.TZ`
  // assignment, this fails instead of the six tests it was hiding.
  it("declares a timezone and Node honours it", () => {
    const tz = process.env.TZ;
    expect(tz).toBeTruthy();

    // The host's own clock must read the same wall time as the declared zone.
    const noon = new Date("2026-09-15T12:00:00.000Z");
    const inZone = civilDateTimeInTz(noon, tz as string);
    expect({ hour: noon.getHours(), minute: noon.getMinutes() }).toEqual({
      hour: inZone.hour,
      minute: inZone.minute,
    });
  });
});
