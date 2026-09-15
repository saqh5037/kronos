import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Standing guard over `src/components/**` (audit 2026-09-15).
 *
 * Three rules the redesign is not allowed to lose again:
 *   S7  no emoji or text glyphs standing in for icons — `lucide-react` only;
 *   S2  no hex outside the V3 palette — lime brand, warning/danger reserved;
 *   D   no pre-V3 custom-property names — `--k-*` is the token set.
 *
 * Scope is this wave's ownership; the excluded paths belong to other agents and
 * get the same guard from their own suites.
 */
const ROOT = path.resolve(__dirname, "../..");
const COMPONENTS = path.join(ROOT, "src", "components");

const EXCLUDED = [
  "src/components/atleta",
  "src/components/providers",
  "src/components/AdminSidebar.tsx",
  "src/components/ThemeToggle.tsx",
  "src/components/PwaRegister.tsx",
  "src/components/kronos/TabBar.tsx",
  "src/components/kronos/DesktopTabBar.tsx",
];

/** The V3 palette (globals.css) plus the raised `--k-t3` the audit asks for. */
const ALLOWED_HEX = new Set([
  "#c8ff2d",
  "#a8d726",
  "#08080a",
  "#0f1014",
  "#14141a",
  "#1c1c24",
  "#26262e",
  "#f5f5f7",
  "#8a8a94",
  "#54545c",
  "#7a7a84",
  "#ff5a5a",
  "#ffb020",
  // black/white shorthands, tolerated inside SVG masks only
  "#000",
  "#fff",
]);

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
/** Text glyphs used as icons. Prose arrows (→ ←) are deliberately not here. */
const ICON_GLYPH = /[✓✔✕✖★☆↗]/;
const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const LEGACY_TOKEN = /var\(--(text|card|line|bg|accent)\)/;

function ownedFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry)) continue;
      const rel = path.relative(ROOT, full);
      if (EXCLUDED.some((e) => rel === e || rel.startsWith(`${e}/`))) continue;
      out.push(full);
    }
  };
  walk(COMPONENTS);
  return out.sort();
}

/** Comments may talk about arrows and palettes; code may not use them. */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("//") && !t.startsWith("*");
    })
    .join("\n");
}

const FILES = ownedFiles();

describe("components guard", () => {
  it("finds the owned component tree", () => {
    expect(FILES.length).toBeGreaterThan(50);
  });

  it("uses lucide icons, never emoji", () => {
    const offenders = FILES.filter((f) =>
      EMOJI.test(readFileSync(f, "utf8")),
    ).map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("uses lucide icons, never text glyphs (✓ ✕ ★ ↗)", () => {
    const offenders = FILES.filter((f) =>
      ICON_GLYPH.test(stripComments(readFileSync(f, "utf8"))),
    ).map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("only uses hex from the V3 palette", () => {
    const offenders: string[] = [];
    for (const file of FILES) {
      const found = readFileSync(file, "utf8").match(HEX) ?? [];
      const bad = [...new Set(found.map((h) => h.toLowerCase()))].filter(
        (h) => !ALLOWED_HEX.has(h),
      );
      if (bad.length) {
        offenders.push(`${path.relative(ROOT, file)}: ${bad.join(", ")}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("uses --k-* tokens, never the pre-V3 names", () => {
    const offenders = FILES.filter((f) =>
      LEGACY_TOKEN.test(readFileSync(f, "utf8")),
    ).map((f) => path.relative(ROOT, f));
    expect(offenders).toEqual([]);
  });

  it("catches a violation when one is introduced", () => {
    // Guards that cannot fail are decoration; prove each matcher bites.
    expect(EMOJI.test("<span>🔥</span>")).toBe(true);
    expect(ICON_GLYPH.test("<span>✓</span>")).toBe(true);
    expect(LEGACY_TOKEN.test('style={{ color: "var(--text)" }}')).toBe(true);
    expect(ALLOWED_HEX.has("#19f08b")).toBe(false);
    expect(stripComments("// arrow → in prose\nconst a = 1;")).not.toContain(
      "→",
    );
  });
});
