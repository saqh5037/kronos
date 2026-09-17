import { describe, it, expect } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

/**
 * Paths owned by another wave. Every entry must still EXIST — a stale
 * exclusion is a silent hole: `src/components/ThemeToggle.tsx` and
 * `src/components/kronos/DesktopTabBar.tsx` were both deleted in earlier waves
 * and sat here excluding nothing, which is exactly how a deleted-then-recreated
 * file slips past a guard.
 */
const EXCLUDED = [
  "src/components/atleta",
  "src/components/providers",
  "src/components/AdminSidebar.tsx",
  "src/components/PwaRegister.tsx",
  "src/components/kronos/TabBar.tsx",
];

/**
 * The V3 palette exactly as `globals.css` declares it. The two retired `--k-t3`
 * values (`#54545c`, then `#7a7a84`) are NOT here: both fail WCAG AA on the
 * surfaces the token is used on, so a component hard-coding either is a
 * regression, not a palette colour (see atleta-infra-contrast.test.ts).
 */
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
  "#7d7d87",
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

  it("every excluded path still exists", () => {
    const missing = EXCLUDED.filter((rel) => !existsSync(path.join(ROOT, rel)));
    expect(
      missing,
      "Delete these from EXCLUDED — they exclude nothing and hide the guard's real scope.",
    ).toEqual([]);
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
    expect(ALLOWED_HEX.has("#54545c")).toBe(false);
    expect(ALLOWED_HEX.has("#7a7a84")).toBe(false);
    expect(stripComments("// arrow → in prose\nconst a = 1;")).not.toContain(
      "→",
    );
  });
});
