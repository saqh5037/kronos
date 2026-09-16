/**
 * Scanning guard over the athlete-core surface.
 *
 * Audit 2026-09-15, systemic issues S3 (language leaks) and S7 (no icon
 * system): a `dialect-guard` test already existed and did not catch voseo or
 * raw enums because it never looked at these files. This one does — over the
 * exact set of files this wave owns, so a regression fails here instead of in a
 * screenshot three months later.
 *
 * It reads source text, not a rendered DOM: cheap, deterministic, no browser.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname, "..", "..");

/** Directories owned by the atleta-core wave. */
const OWNED_DIRS = [
  "src/app/atleta/_components",
  "src/app/atleta/wod",
  "src/app/atleta/reservar",
  "src/app/atleta/perfil",
  "src/app/atleta/historial",
  "src/app/atleta/leaderboard",
  "src/app/atleta/plan",
  "src/components/atleta",
  "src/lib/scores",
  // The athlete's first screen of the product. It was owned by no guard, and
  // shipped "✓ ¡Listo!" in two places (fase 0 fix wave, 2026-09-16).
  "src/app/invitacion",
];

const OWNED_FILES = ["src/app/atleta/page.tsx", "src/app/atleta/loading.tsx"];

/**
 * Explicitly NOT ours (other agents own these in the same wave).
 *
 * `wod/nuevo` and `wod/foto` came OFF this list in the fase 0 fix wave
 * (2026-09-16): nothing else scanned them, and `PhotoWodFlow` was shipping a
 * 📷 emoji as its camera icon, "Tocá para tomar foto" and four unicode arrows
 * as affordances. A file that no guard owns is a file that drifts.
 */
const EXCLUDED = new Set(
  [
    "src/components/atleta/PushSubscribeButton.tsx",
    "src/components/atleta/InstallPwaBanner.tsx",
    "src/components/atleta/NotificationBell.tsx",
    "src/components/atleta/TrophyStrip.tsx",
    "src/components/atleta/TrophyStripV4.tsx",
    "src/components/atleta/VictoryHero.tsx",
    "src/components/atleta/LogrosCatalogCached.tsx",
    "src/components/atleta/SkillTree.tsx",
    "src/components/atleta/BadgeShareCanvas.tsx",
    "src/components/atleta/CoachCardsSection.tsx",
  ].map((p) => p.replace(/\//g, "/")),
);

function walk(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|ts)$/.test(entry)) out.push(full);
  }
  return out;
}

const files: { path: string; rel: string; source: string }[] = [
  ...OWNED_DIRS.flatMap((d) => walk(join(ROOT, d))),
  ...OWNED_FILES.map((f) => join(ROOT, f)),
]
  .map((path) => ({ path, rel: relative(ROOT, path) }))
  .filter(({ rel }) => !EXCLUDED.has(rel))
  .map((f) => ({ ...f, source: readFileSync(f.path, "utf8") }));

/** Strip comments so documentation about a banned string is not a violation. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function offenders(pattern: RegExp, opts: { stripComments?: boolean } = {}) {
  const hits: string[] = [];
  for (const f of files) {
    const haystack =
      opts.stripComments === false ? f.source : stripComments(f.source);
    const lines = haystack.split("\n");
    lines.forEach((line, i) => {
      // A fresh regex per line: /g state must not leak between lines.
      const rx = new RegExp(pattern.source, pattern.flags.replace("g", ""));
      if (rx.test(line)) hits.push(`${f.rel}:${i + 1}  ${line.trim()}`);
    });
  }
  return hits;
}

describe("athlete-core copy guard", () => {
  it("scans a non-trivial set of files", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("has no Argentine voseo", () => {
    // Project hard rule (CLAUDE.md): neutral Mexican Spanish, tú.
    const voseo =
      /\b(dale|acordate|acordá|tenés|querés|podés|sabés|mirá|fijate|esperá|andá|vení|hacé|pedile|cancelás|recibís|empezá)\b/i;
    expect(offenders(voseo)).toEqual([]);
  });

  it("has no emoji or pictographic characters", () => {
    // House rule 1: SVG icons only (lucide-react). No emoji as iconography.
    const emoji =
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F0FF}]/u;
    expect(offenders(emoji, { stripComments: false })).toEqual([]);
  });

  it("does not leak raw enum tokens into JSX text", () => {
    // A raw SCREAMING_SNAKE enum sitting between JSX tags or inside a string
    // literal that reaches the screen. `wodTypeLabel`/`scalingLabel`/etc. exist
    // precisely so this never happens (audit S3).
    const rawEnumInJsx =
      />\s*(FORTIME|ROUNDS_REPS|UNLIMITED|MONTHLY|ATTENDANCE|SCALED|RXPLUS|BOOKED|ATTENDED|NOSHOW|WAITLIST|PAST_DUE|OPEN_BOX|IN_APP|HEAVIEST|BODY_COMPOSITION|TONNAGE)\s*</;
    expect(offenders(rawEnumInJsx)).toEqual([]);
  });

  it("does not ship the English strings the audit caught", () => {
    const banned = /\b(attempts|TROPHY ROOM|SUBIR MI SCORE|Subir mi score)\b/i;
    expect(offenders(banned)).toEqual([]);
  });

  it("does not use the retired legacy colour tokens", () => {
    // CLAUDE.md anti-patterns: #19f08b teal, #3aa3ff cyan, navy family.
    // Comments are stripped: a comment cannot paint a pixel, and naming the
    // retired value is how a fix documents what it replaced.
    const legacy =
      /(#19f08b|#3aa3ff|#1a3457|#0d1b2e|#07101e|rgba\(\s*25\s*,\s*240\s*,\s*139)/i;
    expect(offenders(legacy)).toEqual([]);
  });

  it("does not use unicode arrows as affordances", () => {
    // S7: "→ ↗ ↓ ←" used as icons. lucide-react instead.
    const arrows = /[→←↑↓↗↘↙↖▸▾]/;
    expect(offenders(arrows)).toEqual([]);
  });
});
