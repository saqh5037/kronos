/**
 * P0-4 — the athlete surface must render the same clock on every host.
 *
 * `src/app/atleta/**` and `src/components/atleta/**` used to format
 * server-supplied instants with bare `toLocaleTimeString` / `toLocaleDateString`
 * inside `"use client"` components. Those read the AMBIENT timezone, so the SSR
 * pass rendered the class at the server's zone (UTC on the EC2 host) and the
 * browser re-rendered it at the phone's — "Hydration failed because the server
 * rendered HTML didn't match the client", and a 06:00 class printed as 12:00.
 *
 * The fix routes every one of them through `src/lib/format.ts`, whose
 * formatters pin `America/Mexico_City` explicitly.
 *
 * Two halves:
 *  1. BEHAVIOUR — the shared formatters return byte-identical output for a
 *     fixed instant under `TZ=UTC` and `TZ=America/Mexico_City`. A control
 *     asserts a bare `toLocaleTimeString` does NOT, so a green result here
 *     cannot come from the test being blind.
 *  2. SOURCE — no athlete file reaches for a bare `toLocale*String(` again.
 *     The repo-wide ratchet lives in `scripts/guards/rules.ts` (rule
 *     `to-locale-string`); this keeps the athlete slice at zero regardless of
 *     what the baseline still tolerates elsewhere.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  formatDateLong,
  formatDateShort,
  formatDateWeekday,
  formatInt,
  formatMXN,
  formatTime24,
} from "@/lib/format";

const ROOT = process.cwd();

/** 2026-09-15 22:30 in Mexico City — the next UTC civil day, so the zones disagree. */
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

describe("shared formatters are timezone-independent", () => {
  const cases: [string, () => string][] = [
    ["formatTime24", () => formatTime24(INSTANT)],
    ["formatDateShort", () => formatDateShort(INSTANT)],
    ["formatDateLong", () => formatDateLong(INSTANT)],
    ["formatDateWeekday", () => formatDateWeekday(INSTANT)],
    ["formatInt", () => formatInt(1363)],
    ["formatMXN", () => formatMXN(2500)],
  ];

  it.each(cases)("%s renders the same under UTC and CDMX", (_name, call) => {
    const utc = underTz("UTC", call);
    const cdmx = underTz("America/Mexico_City", call);
    expect(utc).toBe(cdmx);
  });

  it("renders the instant in the box timezone, not the host one", () => {
    // 04:30 UTC is 22:30 the previous day in Mexico City. The box zone wins.
    expect(underTz("UTC", () => formatTime24(INSTANT))).toBe("22:30");
    expect(underTz("UTC", () => formatDateShort(INSTANT))).toBe("15 sep");
  });

  it("CONTROL: a bare toLocaleTimeString does drift between the two", () => {
    const bare = () =>
      INSTANT.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    expect(underTz("UTC", bare)).not.toBe(underTz("America/Mexico_City", bare));
  });
});

/* -------------------------------------------------------------------------- */
/* Source scan                                                                */
/* -------------------------------------------------------------------------- */

const ATHLETE_ROOTS = [
  "src/app/atleta",
  "src/components/atleta",
  "src/app/invitacion",
  "src/components/kronos/TabBar.tsx",
];

function walk(target: string, out: string[] = []): string[] {
  const abs = join(ROOT, target);
  const stat = statSync(abs);
  if (stat.isFile()) {
    if (/\.tsx?$/.test(abs)) out.push(abs);
    return out;
  }
  for (const entry of readdirSync(abs)) {
    walk(join(target, entry), out);
  }
  return out;
}

const ATHLETE_FILES = ATHLETE_ROOTS.flatMap((r) => walk(r)).sort();

/** `.toLocaleString(`, `.toLocaleDateString(`, `.toLocaleTimeString(`. */
const TO_LOCALE_RE = /\.toLocale(?:Date|Time)?String\s*\(/;

describe("no ambient-timezone formatting in the athlete surface", () => {
  it("resolves a non-trivial file set", () => {
    expect(ATHLETE_FILES.length).toBeGreaterThan(50);
  });

  it("routes every date, time and number through src/lib/format.ts", () => {
    const offenders: string[] = [];
    for (const abs of ATHLETE_FILES) {
      readFileSync(abs, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (TO_LOCALE_RE.test(line)) {
            offenders.push(`${relative(ROOT, abs)}:${i + 1}  ${line.trim()}`);
          }
        });
    }
    expect(
      offenders,
      [
        "Bare toLocale*String() reads the AMBIENT timezone/locale.",
        "Use formatTime24 / formatDateShort / formatDateLong / formatInt /",
        "formatMXN from @/lib/format instead — they pin the box timezone.",
        "",
        offenders.join("\n"),
      ].join("\n"),
    ).toEqual([]);
  });
});
