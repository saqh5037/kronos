/**
 * Copy guard for the admin operations surface (audit 2026-09-15, S3 + S7).
 *
 * Scans the owner/coach operation pages and fails on the four leaks the audit
 * found there, so they cannot come back in a later sweep:
 *   1. raw Prisma enum values rendered as JSX text ("ATTENDED", "ROUNDS_REPS"…)
 *      — everything goes through `src/lib/labels.ts`
 *   2. Rioplatense voseo ("Mantené el tono", "Subí una foto", "acá")
 *   3. emoji and unicode glyphs used as icons — `lucide-react` only
 *   4. the vendor name "Gemini" in user-facing copy
 *
 * The scan is deliberately scoped to the admin operation tree: other surfaces
 * have their own guards (`tests/unit/dialect-guard.test.ts`).
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";

const ADMIN = path.join(process.cwd(), "src", "app", "admin");

/** The paths this wave owns. */
const SCAN_TARGETS = [
  path.join(ADMIN, "page.tsx"),
  path.join(ADMIN, "_components"),
  path.join(ADMIN, "_lib"),
  path.join(ADMIN, "atletas"),
  path.join(ADMIN, "programacion"),
  path.join(ADMIN, "wods"),
  path.join(ADMIN, "movimientos"),
  path.join(ADMIN, "clases"),
  path.join(ADMIN, "reservas"),
  path.join(ADMIN, "asistencia"),
  path.join(ADMIN, "prs"),
  path.join(ADMIN, "leaderboards"),
];

function collectFiles(target: string): string[] {
  let stats;
  try {
    stats = statSync(target);
  } catch {
    return [];
  }
  if (stats.isFile()) {
    return /\.tsx?$/.test(target) ? [target] : [];
  }
  const out: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    const full = path.join(target, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = SCAN_TARGETS.flatMap(collectFiles);

type Hit = { file: string; line: number; text: string };

function scan(pattern: RegExp): Hit[] {
  const hits: Hit[] = [];
  for (const file of FILES) {
    const rel = path.relative(process.cwd(), file);
    const lines = readFileSync(file, "utf8").split("\n");
    lines.forEach((text, i) => {
      pattern.lastIndex = 0;
      if (pattern.test(text)) {
        hits.push({ file: rel, line: i + 1, text: text.trim() });
      }
    });
  }
  return hits;
}

const report = (hits: Hit[]) =>
  hits.map((h) => `${h.file}:${h.line} → ${h.text}`).join("\n");

describe("admin ops copy guard", () => {
  it("scans the admin operation tree", () => {
    expect(FILES.length).toBeGreaterThan(30);
  });

  it("renders no raw enum value as JSX text", () => {
    const RAW_ENUM_JSX =
      />\s*(ATTENDED|BOOKED|NOSHOW|WAITLIST|PAID|FAILED|PENDING|ACTIVE|UNLIMITED|MONTHLY|ANNUAL|DROPIN|ROUNDS_REPS|HEAVIEST|WEIGHT|REPS)\s*</;
    const hits = scan(RAW_ENUM_JSX);
    expect(report(hits)).toBe("");
  });

  it("uses no Rioplatense voseo", () => {
    const VOSEO =
      /(mantené|subí\b|acá\b|recibís|tenés|querés|pedile|cancelás)/i;
    const hits = scan(VOSEO);
    expect(report(hits)).toBe("");
  });

  it("uses lucide icons, never emoji or unicode glyphs", () => {
    // Pictographs, dingbats, misc symbols, arrows and variation selectors.
    const EMOJI =
      /[\u{1F300}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
    const hits = scan(EMOJI);
    expect(report(hits)).toBe("");
  });

  it("names no AI vendor in user-facing copy", () => {
    const hits = scan(/Gemini/i);
    expect(report(hits)).toBe("");
  });
});
