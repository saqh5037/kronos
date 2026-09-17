/**
 * `src/lib/dates.ts` must answer in the BOX timezone, never the host's.
 *
 * Every admin range filter goes through this module, and until the fase 0 fix
 * wave it computed its windows with date-fns' `startOfDay` / `startOfMonth`
 * and `format`, all of which read `process.env.TZ`. On the UTC production host
 * the buckets slid by one civil day at both edges, and `TZ=Asia/Tokyo pnpm
 * test` reproduced it: `dailyRevenueSeries` filed a payment collected at 20:00
 * CDMX under the NEXT day.
 *
 * The contract below is the fix: for one instant, the answer is the same on
 * every host, and it is the answer the box would give.
 */
import { describe, it, expect, afterEach } from "vitest";
import {
  dayKey,
  monthKey,
  eachDayInRange,
  previousRange,
  rangeFromParams,
  rangeFromPreset,
} from "../../src/lib/dates";
import { dailyRevenueSeries } from "@/app/admin/pagos/_lib/period";
import type { PaymentRow } from "@/server/actions/payments";

/** Node re-reads `process.env.TZ` on every Date operation since v13. */
const HOST_ZONES = ["UTC", "America/Mexico_City", "Asia/Tokyo"] as const;

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

function underHostZone<T>(tz: string, fn: () => T): T {
  const before = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    process.env.TZ = before;
  }
}

/** The same call under UTC, CDMX and Tokyo must return the same value. */
function sameOnEveryHost<T>(fn: () => T): T {
  const [first, ...rest] = HOST_ZONES.map((tz) => underHostZone(tz, fn));
  for (const [i, value] of rest.entries()) {
    expect(value, `host zone ${HOST_ZONES[i + 1]}`).toEqual(first);
  }
  return first;
}

function paymentRow(over: Partial<PaymentRow> & { id: string }): PaymentRow {
  return {
    amount: 0,
    currency: "MXN",
    gateway: "CASH",
    status: "PAID",
    paidAt: null,
    createdAt: new Date("2026-09-10T12:00:00.000Z"),
    membershipId: "m1",
    athleteName: "Mía Moreno",
    planName: "Mensual Ilimitado",
    ...over,
  } as PaymentRow;
}

describe("dayKey / monthKey are box-civil, not host-civil", () => {
  it("files 21:00 CDMX on the 15th under the 15th, on any host", () => {
    // 2026-09-16T03:00Z is 21:00 of the 15th in CDMX and noon of the 16th in Tokyo.
    const instant = new Date("2026-09-16T03:00:00.000Z");
    expect(sameOnEveryHost(() => dayKey(instant))).toBe("2026-09-15");
  });

  it("files 22:00 CDMX on 30 sep under September, on any host", () => {
    const instant = new Date("2026-10-01T04:00:00.000Z");
    expect(sameOnEveryHost(() => monthKey(instant))).toBe("2026-09");
  });

  it("still honours an explicit timezone when the caller has the box's", () => {
    const instant = new Date("2026-09-16T03:00:00.000Z");
    expect(dayKey(instant, "UTC")).toBe("2026-09-16");
    expect(dayKey(instant, "Asia/Tokyo")).toBe("2026-09-16");
    expect(dayKey(instant, "America/Mexico_City")).toBe("2026-09-15");
  });
});

describe("rangeFromPreset spans box civil days", () => {
  const now = new Date("2026-09-15T18:52:00.000Z");

  it("today starts at 00:00 CDMX and ends at 23:59:59.999 CDMX", () => {
    const range = sameOnEveryHost(() => rangeFromPreset("today", now));
    expect(range.from.toISOString()).toBe("2026-09-15T06:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-09-16T05:59:59.999Z");
  });

  it("last7 covers seven consecutive box days ending today", () => {
    const days = sameOnEveryHost(() =>
      eachDayInRange(rangeFromPreset("last7", now)).map((d) => dayKey(d)),
    );
    expect(days).toEqual([
      "2026-09-09",
      "2026-09-10",
      "2026-09-11",
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
      "2026-09-15",
    ]);
  });

  it("thisMonth covers the whole box month", () => {
    const range = sameOnEveryHost(() => rangeFromPreset("thisMonth", now));
    expect(dayKey(range.from)).toBe("2026-09-01");
    expect(dayKey(range.to)).toBe("2026-09-30");
  });

  it("lastMonth covers the whole previous box month", () => {
    const range = sameOnEveryHost(() => rangeFromPreset("lastMonth", now));
    expect(dayKey(range.from)).toBe("2026-08-01");
    expect(dayKey(range.to)).toBe("2026-08-31");
  });
});

describe("previousRange is the symmetric prior window", () => {
  const now = new Date("2026-09-15T18:52:00.000Z");

  it("hands back the seven box days before last7", () => {
    const days = sameOnEveryHost(() =>
      eachDayInRange(previousRange(rangeFromPreset("last7", now))).map((d) =>
        dayKey(d),
      ),
    );
    expect(days).toEqual([
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
      "2026-09-08",
    ]);
  });
});

describe("rangeFromParams reads a YYYY-MM-DD param as a box civil day", () => {
  it("does not slide the edges by a day on a non-CDMX host", () => {
    const range = sameOnEveryHost(() =>
      rangeFromParams({ from: "2026-01-01", to: "2026-01-31" }),
    );
    expect(range.from.toISOString()).toBe("2026-01-01T06:00:00.000Z");
    expect(range.to.toISOString()).toBe("2026-02-01T05:59:59.999Z");
    expect(dayKey(range.from)).toBe("2026-01-01");
    expect(dayKey(range.to)).toBe("2026-01-31");
  });
});

describe("dailyRevenueSeries buckets identically on every host", () => {
  const days = ["2026-09-13", "2026-09-14", "2026-09-15"];
  const rows = [
    // 15:00Z on the 14th = 09:00 CDMX on the 14th — the same day everywhere.
    paymentRow({
      id: "1",
      status: "PAID",
      amount: 2500,
      paidAt: new Date("2026-09-14T15:00:00.000Z"),
    }),
    // 02:00Z on the 15th = 20:00 CDMX on the 14th, but the 15th in UTC and
    // 11:00 of the 15th in Tokyo. This is the row the audit bug moved.
    paymentRow({
      id: "2",
      status: "PAID",
      amount: 700,
      paidAt: new Date("2026-09-15T02:00:00.000Z"),
    }),
    paymentRow({
      id: "3",
      status: "PENDING",
      amount: 9999,
      paidAt: new Date("2026-09-14T15:00:00.000Z"),
    }),
  ];

  it("keys every payment by the box day it was collected", () => {
    const series = sameOnEveryHost(() => dailyRevenueSeries(rows, days));
    expect(series).toEqual([
      { day: "2026-09-13", revenue: 0, count: 0 },
      { day: "2026-09-14", revenue: 3200, count: 2 },
      { day: "2026-09-15", revenue: 0, count: 0 },
    ]);
  });
});
