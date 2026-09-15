/**
 * Attendance day bucketing + the home/heatmap coherence predicate.
 *
 * Audit 2026-09-15, P1 (`/atleta/perfil`): the 90-day heatmap lit ~4 cells
 * while the hero showed a 7-day streak and the card header counted 17 classes.
 * Two independent causes, both covered here:
 *
 *  1. PREDICATE — `getMyAttendanceLast90d` required `checkedInAt != null` and
 *     dated by it, while the streak used `status: ATTENDED` dated by
 *     `class.startsAt`. A booking a coach marks attended from the roster has no
 *     `checkedInAt`, so it counted for the streak and was invisible in the
 *     heatmap. Both paths now go through `attendanceDayOf`.
 *
 *  2. TIMEZONE — the server passed a bare `new Date()` into the client
 *     `Heatmap`, which buckets with local-time `format()`. A 21:00 CDMX
 *     check-in is already the next calendar day in UTC, so the cell moved
 *     depending on the viewer's device. Buckets are now computed on the server
 *     in the box timezone and handed over as day keys anchored at noon UTC.
 */
import { describe, it, expect } from "vitest";
import { attendanceDayOf, streakFromBookings } from "../../src/lib/streak";
import {
  dayKeyInTimezone,
  dayKeyToUtcNoon,
  heatmapDayBuckets,
  heatmapRangeKeys,
  MEXICO_CITY_TZ,
} from "../../src/lib/analytics/attendance-heatmap";

/* -------------------------------------------------------------------------- */
/* 1. predicate mapping                                                       */
/* -------------------------------------------------------------------------- */

describe("attendance predicate mapping", () => {
  it("dates a roster-marked booking by its class start, not by a missing check-in", () => {
    const row = {
      checkedInAt: null,
      class: { startsAt: new Date("2026-09-14T13:00:00Z") },
    };
    expect(attendanceDayOf(row)).toEqual(new Date("2026-09-14T13:00:00Z"));
  });

  it("prefers the real check-in instant when the coach scanned the athlete in", () => {
    const row = {
      checkedInAt: new Date("2026-09-14T12:58:00Z"),
      class: { startsAt: new Date("2026-09-14T13:00:00Z") },
    };
    expect(attendanceDayOf(row)).toEqual(new Date("2026-09-14T12:58:00Z"));
  });

  it("the heatmap sees every day the streak counts (the audit's 4-vs-7 gap)", () => {
    // Seven consecutive attended classes, only a third of them checked in.
    const rows = [0, 1, 2, 3, 4, 5, 6].map((back) => {
      const startsAt = new Date(Date.UTC(2026, 8, 15 - back, 13, 0, 0));
      return {
        checkedInAt: back % 3 === 0 ? startsAt : null,
        class: { startsAt },
      };
    });
    const now = new Date("2026-09-15T20:00:00Z");

    expect(streakFromBookings(rows, now)).toBe(7);

    const buckets = heatmapDayBuckets(
      rows.map(attendanceDayOf).filter((d): d is Date => d !== null),
      "UTC",
    );
    // One cell per streak day — no longer 4 cells against a 7-day streak.
    expect(buckets).toHaveLength(7);
    expect(buckets.every((b) => b.value === 1)).toBe(true);
  });

  it("drops a booking that carries neither a check-in nor a class", () => {
    expect(attendanceDayOf({ checkedInAt: null, class: null })).toBeNull();
    expect(attendanceDayOf({ checkedInAt: null })).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* 2. timezone bucketing                                                      */
/* -------------------------------------------------------------------------- */

describe("heatmap day bucketing around midnight", () => {
  it("keeps a late-evening CDMX check-in on the local day, not the UTC one", () => {
    // 2026-09-16T02:30Z === 2026-09-15 20:30 in CDMX (UTC-6).
    const instant = new Date("2026-09-16T02:30:00Z");
    expect(dayKeyInTimezone(instant, MEXICO_CITY_TZ)).toBe("2026-09-15");
    expect(dayKeyInTimezone(instant, "UTC")).toBe("2026-09-16");
  });

  it("keeps an early-morning CDMX check-in on the same local day", () => {
    // 06:15 CDMX is 12:15Z — same calendar day either way.
    const instant = new Date("2026-09-15T12:15:00Z");
    expect(dayKeyInTimezone(instant, MEXICO_CITY_TZ)).toBe("2026-09-15");
  });

  it("buckets two check-ins on the same local day into one cell of value 2", () => {
    const buckets = heatmapDayBuckets(
      [
        new Date("2026-09-15T13:00:00Z"), // 07:00 CDMX
        new Date("2026-09-16T02:00:00Z"), // 20:00 CDMX, SAME local day
      ],
      MEXICO_CITY_TZ,
    );
    expect(buckets).toEqual([{ dateKey: "2026-09-15", value: 2 }]);
  });

  it("splits the same two instants across two days when the box is on UTC", () => {
    const buckets = heatmapDayBuckets(
      [new Date("2026-09-15T13:00:00Z"), new Date("2026-09-16T02:00:00Z")],
      "UTC",
    );
    expect(buckets).toEqual([
      { dateKey: "2026-09-15", value: 1 },
      { dateKey: "2026-09-16", value: 1 },
    ]);
  });

  it("returns buckets sorted by day so the chart never depends on query order", () => {
    const buckets = heatmapDayBuckets(
      [
        new Date("2026-09-15T13:00:00Z"),
        new Date("2026-07-01T13:00:00Z"),
        new Date("2026-08-20T13:00:00Z"),
      ],
      MEXICO_CITY_TZ,
    );
    expect(buckets.map((b) => b.dateKey)).toEqual([
      "2026-07-01",
      "2026-08-20",
      "2026-09-15",
    ]);
  });

  it("falls back to Mexico City when the box has no usable timezone on file", () => {
    const instant = new Date("2026-09-16T02:30:00Z");
    expect(dayKeyInTimezone(instant, null)).toBe("2026-09-15");
    expect(dayKeyInTimezone(instant, "")).toBe("2026-09-15");
    expect(dayKeyInTimezone(instant, "Not/AZone")).toBe("2026-09-15");
  });
});

describe("dayKeyToUtcNoon", () => {
  it("anchors a day key at noon UTC so every real client reads the same day", () => {
    expect(dayKeyToUtcNoon("2026-09-15").toISOString()).toBe(
      "2026-09-15T12:00:00.000Z",
    );
  });

  it("survives the client formatting it in its own timezone", () => {
    // The client `Heatmap` buckets with local-time `format()`. Noon UTC stays
    // on the intended calendar day for every offset in (-12h, +12h), which is
    // every timezone the product ships to.
    const d = dayKeyToUtcNoon("2026-09-15");
    for (const tz of [
      "Pacific/Niue", // UTC-11
      "America/Los_Angeles", // UTC-7
      MEXICO_CITY_TZ, // UTC-6
      "UTC",
      "Europe/Madrid", // UTC+2
      "Asia/Tokyo", // UTC+9
      "Pacific/Norfolk", // UTC+11
    ]) {
      expect(dayKeyInTimezone(d, tz), tz).toBe("2026-09-15");
    }
  });
});

describe("heatmapRangeKeys", () => {
  it("spans exactly `days` local days, ending today in the box timezone", () => {
    // 2026-09-16T02:30Z is still 2026-09-15 in CDMX.
    const range = heatmapRangeKeys(
      new Date("2026-09-16T02:30:00Z"),
      MEXICO_CITY_TZ,
      90,
    );
    expect(range.toKey).toBe("2026-09-15");
    expect(range.fromKey).toBe("2026-06-18"); // 89 days before
  });

  it("is inclusive on both ends for a one-day window", () => {
    const range = heatmapRangeKeys(
      new Date("2026-09-15T18:00:00Z"),
      MEXICO_CITY_TZ,
      1,
    );
    expect(range.fromKey).toBe("2026-09-15");
    expect(range.toKey).toBe("2026-09-15");
  });
});
