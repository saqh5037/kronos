/**
 * `hour12: false` is not portable, and the failure is invisible on most dev
 * machines.
 *
 * With `hour12: false`, some ICU builds format midnight as hour **24** instead
 * of **00** — the `h24` hour cycle. Production (Node 20 on the EC2 host) does
 * exactly that; macOS does not. So the same code produced `00:00` locally and
 * `24:00` on the server.
 *
 * That is not cosmetic. `snapToLocalMidnight` in `src/lib/wod-date.ts` parses
 * that hour and subtracts it to walk back to local midnight:
 *
 *     const localHour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
 *     new Date(approx.getTime() - localHour * 3600000 - ...)
 *
 * At midnight it subtracted 24 hours instead of 0, so every civil-day window
 * landed one day early. In production that meant `/atleta/wod` resolved the
 * WRONG DAY for every box — a day with classes showed "Sin WOD".
 *
 * `hourCycle: "h23"` pins the 00–23 cycle everywhere. This guard is a scan
 * rather than a behavioural test on purpose: on a machine whose ICU already
 * returns `00`, a behavioural test passes either way and catches nothing.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SRC = path.resolve(__dirname, "../../src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("hour cycle portability", () => {
  it("never uses hour12: false anywhere in src", () => {
    const files = walk(SRC);
    const offenders: string[] = [];
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      if (/hour12:\s*false/.test(src)) {
        offenders.push(path.relative(SRC, file));
      }
    }
    expect(
      offenders,
      'Use `hourCycle: "h23"`. `hour12: false` formats midnight as 24 on some ICU builds, including production.',
    ).toEqual([]);
  });

  it("formats midnight as 00 with the pinned hour cycle", () => {
    const midnightUtc = new Date("2026-09-18T06:00:00.000Z"); // 00:00 in CDMX
    const formatted = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(midnightUtc);
    expect(formatted).toMatch(/^00:00$/);
  });
});
