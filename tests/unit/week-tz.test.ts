/**
 * `src/lib/week.ts` formatted in the AMBIENT timezone.
 *
 * `formatWeekday`, `formatTime` and `formatDayMonth` passed a locale to
 * `toLocaleDateString` / `toLocaleTimeString` but no `timeZone`, so they read
 * the host's zone. `src/lib` is outside the `to-locale-string` guard root
 * (rules.ts: "that is where the explicit formatters live"), so the repo-wide
 * sweep never saw them — and eight call sites across `/admin/programacion`,
 * `/atleta`, `/atleta/wod` and `/atleta/perfil` inherited the bug: on the UTC
 * production host a 20:00 CDMX class printed "02:00" and was filed under the
 * next day.
 *
 * The instant below is late evening in Mexico City and already the next civil
 * day in UTC, so a zone-blind formatter cannot agree with itself. A control
 * asserts the bare `toLocale*` calls DO differ, so a green run cannot come from
 * the test being insensitive.
 */

import { describe, it, expect } from "vitest";
import { formatWeekday, formatTime, formatDayMonth } from "@/lib/week";

/** 2026-09-15 22:30 in Mexico City = 2026-09-16 04:30 UTC (Tuesday → Wednesday). */
const INSTANT = new Date("2026-09-16T04:30:00.000Z");

/** Runs `fn` with the process timezone forced to `tz`, then restores it. */
function underTz<T>(tz: string, fn: () => T): T {
  const previous = process.env.TZ;
  process.env.TZ = tz;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
}

describe("src/lib/week.ts formatters are timezone-independent", () => {
  const cases: [string, () => string][] = [
    ["formatWeekday", () => formatWeekday(INSTANT)],
    ["formatTime", () => formatTime(INSTANT)],
    ["formatDayMonth", () => formatDayMonth(INSTANT)],
  ];

  for (const [name, run] of cases) {
    it(`${name} renders the same under TZ=UTC and TZ=America/Mexico_City`, () => {
      expect(underTz("UTC", run)).toBe(underTz("America/Mexico_City", run));
    });
  }

  it("renders the box-local reading, not UTC's", () => {
    expect(underTz("UTC", () => formatTime(INSTANT))).toBe("22:30");
    expect(underTz("UTC", () => formatDayMonth(INSTANT))).toBe("15 sep");
    expect(underTz("UTC", () => formatWeekday(INSTANT))).toBe("mar");
  });

  it("control: the bare toLocale* calls they replaced DO drift", () => {
    const bareTime = () =>
      INSTANT.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    const bareDay = () =>
      INSTANT.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });

    expect(underTz("UTC", bareTime)).not.toBe(
      underTz("America/Mexico_City", bareTime),
    );
    expect(underTz("UTC", bareDay)).not.toBe(
      underTz("America/Mexico_City", bareDay),
    );
  });

  it("an explicit timezone argument still wins", () => {
    expect(formatTime(INSTANT, "UTC")).toBe("04:30");
    expect(formatDayMonth(INSTANT, "UTC")).toBe("16 sep");
    expect(formatWeekday(INSTANT, "UTC")).toBe("mié");
  });
});
