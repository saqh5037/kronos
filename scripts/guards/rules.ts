/**
 * Shared rule definitions + scanner for the Kronos hygiene guards.
 *
 * ============================================================================
 * THE THREE GUARD FILES
 * ============================================================================
 * | File                               | Rules it runs                        |
 * | ---------------------------------- | ------------------------------------ |
 * | tests/unit/dialect-guard.test.ts   | voseo                                |
 * | tests/unit/ui-guards.test.ts       | every rule EXCEPT voseo: emoji-in-jsx,|
 * |                                    | unicode-glyph, legacy-tokens,         |
 * |                                    | banned-hex, to-locale-string,         |
 * |                                    | raw-enum-jsx                          |
 * | tests/unit/components-guard.test.ts| an independent, zero-tolerance gate   |
 * |                                    | over src/components/** only. It does  |
 * |                                    | NOT read this file or the baseline:   |
 * |                                    | it owns the V3 hex palette allowlist  |
 * |                                    | and its own icon-glyph set, and it    |
 * |                                    | fails on the first violation instead  |
 * |                                    | of ratcheting.                        |
 *
 * `scripts/guards/update-baseline.ts` regenerates
 * `tests/fixtures/guard-baseline.json` from the rules below.
 *
 * The ratcheting guards are RATCHETS, not absolute gates. See the header of
 * tests/unit/ui-guards.test.ts for the full contract and the ratchet-down
 * procedure after the rebuild worktrees merge.
 *
 * ============================================================================
 * WORD BOUNDARIES
 * ============================================================================
 * The Spanish rules use Unicode letter lookarounds `(?<!\p{L}) … (?!\p{L})`
 * instead of `\b`. JavaScript's `\b` is ASCII-only, so `/\bsubí\b/` never
 * matches "Subí una foto" (the boundary after `í` requires a following word
 * character). Accented endings are the norm in voseo, so ASCII `\b` would
 * silently disable most of the rule.
 *
 * ============================================================================
 * COMMENTS
 * ============================================================================
 * A rule may declare `preprocess` to strip comments before matching. The two
 * glyph rules use it: `// this maps A → B` is documentation, not a rendered
 * affordance, and a guard that cannot tell the difference either baselines
 * ~60 files of prose arrows or teaches people to stop writing comments.
 * `voseo` deliberately does NOT strip them — CLAUDE.md bans voseo in code
 * comments and AI prompts too, and that is where it hid last time.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export type RuleCounts = Record<string, number>;
export type Baseline = Record<string, RuleCounts>;

export interface GuardRule {
  /** Baseline key. Stable — renaming invalidates the fixture. */
  readonly name: string;
  /** One-line description used in failure output. */
  readonly summary: string;
  /** Repo-relative directories to walk. */
  readonly roots: readonly string[];
  /** Fresh regex per call: these are global/stateful. */
  readonly pattern: () => RegExp;
  /** What to do when a new violation appears. */
  readonly hint: string;
  /** Optional source transform applied before matching (e.g. strip comments). */
  readonly preprocess?: (source: string) => string;
}

/**
 * Drops `/* … *\/` blocks (including JSX `{/* … *\/}`) and whole-line `//`
 * comments. A line is only dropped when it STARTS with `//`, so
 * `<a href="https://…">` and a trailing `// note` on a code line survive —
 * the first would otherwise be mangled, and the second carries the code the
 * rule exists to check.
 */
export function stripComments(source: string): string {
  return (
    source
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .split("\n")
      .filter((line) => {
        const t = line.trim();
        return !t.startsWith("//") && !t.startsWith("*");
      })
      // Trailing `// …` on a code line. The lookbehind keeps `https://` and
      // `///` intact; the cost of the remaining edge case (a literal "//"
      // inside a string on the same line as a glyph) is under-reporting on two
      // glyph rules, never a false failure.
      .map((line) => line.replace(/(?<![:/])\/\/.*$/, ""))
      .join("\n")
  );
}

/** Screens and components — everything that renders through React. */
const SRC_UI = ["src/app", "src/components"] as const;

/**
 * Every surface a human reads, React or not. `src/server/email-templates`
 * renders HTML into an inbox and `src/lib` holds the shared presentation
 * helpers (labels, formatters, copy), so a glyph or a dead token hidden there
 * reaches a user exactly like one in a component would.
 */
const SRC_SURFACES = [
  ...SRC_UI,
  "src/lib",
  "src/server/email-templates",
] as const;

/* -------------------------------------------------------------------------- */
/* voseo                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Unambiguous Rioplatense voseo forms plus the regional markers the product
 * audit (2026-09-15, systemic issue S3) found leaking into Mexican UI copy.
 *
 * Deliberately EXCLUDED because they collide with valid Mexican first-person
 * preterites (yo elegí, yo seguí, yo pedí, yo registré, yo cargué, yo empecé):
 * `elegí`, `seguí`, `pedí`, `registré`, `cargué`, `anuncié`, `empecé`.
 *
 * `subí` IS included even though "yo subí" is valid MX, because the audit found
 * it as an imperative ("Subí una foto") in product copy; a false positive is
 * baselined per-file, never silently dropped.
 */
const VOSEO_FORMS = [
  // --- audit 2026-09-15 findings (screen-audit S3) ---
  "mantené",
  "acordate",
  "recibís",
  "tenés",
  "querés",
  "podés",
  "sabés",
  "mirás?",
  "fijate",
  "esperá",
  "pedile",
  "cancelás?",
  "empezás?",
  "subí",
  "acá",
  "vos",
  "dale",
  // --- fase 0 fix wave (2026-09-16), found on /atleta-signup ---
  // Each one is safe: the Mexican first-person preterite shifts the accent
  // (yo instalé, yo toqué, yo bajé, yo entré, yo vine), so these forms are
  // unambiguously voseo imperatives/presents. The `s?` mirrors the existing
  // entries and catches the present indicative in the same pass.
  "instalás?",
  "tocás?",
  "bajás?",
  "entrás?",
  "vení",
  // Found in src/server/email-templates/staff-invitation.ts ("Pegá este link
  // en tu navegador"). Safe: the Mexican forms are "pega" / "pegue" / "pegué",
  // none of which carries the accent on the last syllable.
  "pegás?",
  "contame",
  "decime",
  "avisame",
  // --- pre-existing dialect-guard list (kept: do not lose coverage) ---
  "probás?",
  "elegís",
  "ingresás?",
  "hacés?",
  "andás?",
  "dejás?",
  "mandás?",
  "contás?",
  "agregás?",
  "guardás?",
  "cargás?",
  "revisás?",
  "evolucionás?",
  "registrás?",
  "anunciás?",
  "preferís",
  "seguís",
  "llevás?",
  "lográs?",
  "alcanzás?",
  "sumás?",
  "entrenás?",
  "reservás?",
  "anotás?",
  // Voseo imperatives (safe: the MX preterite shifts the accent — cargué, anuncié)
  "registrá",
  "cargá",
  "anunciá",
  "empezá",
  "volvé",
  "anotá",
  "reservá",
  "sumá",
  "llevate",
] as const;

/* -------------------------------------------------------------------------- */
/* UI rules                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Text characters used as iconography or as an affordance. These are NOT
 * emoji — they are typographic glyphs, so the emoji ranges miss most of them,
 * and they fail for the same reasons: they do not inherit stroke width, they
 * cannot be sized, they render differently per platform and font, and a screen
 * reader announces "rightwards arrow" in the middle of a button label.
 *
 * `•` (U+2022) is here as a separator too: the house separator is `·`
 * (U+00B7), and two different bullets in the same product is the kind of drift
 * this rule exists to stop.
 */
const UNICODE_GLYPHS = [
  "\u2192", // →
  "\u2190", // ←
  "\u2191", // ↑
  "\u2193", // ↓
  "\u2197", // ↗
  "\u2194", // ↔
  "\u25B8", // ▸
  "\u25B6", // ▶
  "\u2713", // ✓
  "\u2714", // ✔
  "\u2715", // ✕
  "\u2716", // ✖
  "\u2605", // ★
  "\u2606", // ☆
  "\u2B06", // ⬆
  "\u2B07", // ⬇
  "\u2022", // •
] as const;

/**
 * Prisma enum values that must never be rendered raw as JSX text. Go through
 * `label(...)` / the typed maps in `src/lib/labels.ts` instead.
 */
const RAW_ENUMS = [
  "ATTENDED",
  "BOOKED",
  "NOSHOW",
  "PAID",
  "FAILED",
  "PENDING",
  "UNLIMITED",
  "MONTHLY",
  "ANNUAL",
  "DROPIN",
  "IN_APP",
  "ROUNDS_REPS",
  "HEAVIEST",
] as const;

/**
 * Prisma enum FIELDS whose value is a token, not prose. Rendering one as a
 * bare JSX child (`>{booking.status}<`) prints "ATTENDED" at the owner, the
 * same defect as the literal list above with a variable in front of it.
 */
const RAW_ENUM_FIELDS = ["status", "type", "role", "state", "kind"] as const;

/**
 * Legacy CSS custom properties kept alive only by the compat block at the end
 * of `globals.css`. Matched by EXACT name (closing paren required) so
 * `var(--text-3)` and `var(--line-2)` are not swept up — that mirrors how the
 * audit counted them (`--line` 125, `--card` 63, `--text` 47, `--bg` 12).
 */
const LEGACY_TOKENS = [
  "text",
  "card",
  "line",
  "bg",
  "accent",
  "moss",
  "fire",
  "grad",
  "text-2",
] as const;

/**
 * The same compat block reached through Tailwind instead of `var()`:
 * `tailwind.config.ts` mapped `text-text`, `bg-card`, `border-line` … onto
 * those legacy properties, so a screen could stay on the pre-V3 palette
 * without ever writing `var(--text)`. The `text`/`text-2`/`text-3` mappings
 * are gone; this rule is what stops them coming back through another key.
 *
 * Matched with Unicode-free lookarounds on `[\w-]` so `text-red-500`,
 * `bg-gradient-to-r` and `shadow-card-hover` are not swept up.
 */
const LEGACY_UTILITY_PREFIXES = [
  "text",
  "bg",
  "border",
  "from",
  "via",
  "to",
  "fill",
  "stroke",
  "ring",
  "divide",
  "placeholder",
  "decoration",
  "outline",
  "caret",
] as const;

const LEGACY_UTILITY_SUFFIXES = [
  "text-2",
  "text-3",
  "text",
  "card-2",
  "card",
  "line",
  "bg-soft",
  "bg-warm",
  "bg-cool",
  "bg",
  "fire",
  "moss",
  "steel",
  "ember",
  "amber",
  "track",
  "overlay",
  "hover-subtle",
  // The pre-V3 brand scales. They were deleted from `tailwind.config.ts`
  // together with the compat aliases above, which also un-shadowed Tailwind's
  // own palette — hence the `(?![\w-])` boundary: `text-red-500` is the
  // framework's colour and is fine, a bare `text-red` is the dead alias.
  "blue-deep",
  "blue",
  "red",
  "cyan",
  "pink",
  "violet",
] as const;

/** Pre-V3 hexes: teal green, cyan, and the three navies. */
const BANNED_HEX = [
  "#19f08b",
  "#3aa3ff",
  "#1a3457",
  "#0d1b2e",
  "#07101e",
] as const;

export const RULES: readonly GuardRule[] = [
  {
    name: "voseo",
    summary: "Rioplatense voseo / non-Mexican regional markers in src/**",
    roots: ["src"],
    pattern: () =>
      new RegExp(`(?<!\\p{L})(?:${VOSEO_FORMS.join("|")})(?!\\p{L})`, "giu"),
    hint: "Replace with the Mexican-neutral form (tenés→tienes, acá→aquí, Subí→Sube, dale→va).",
  },
  {
    name: "emoji-in-jsx",
    summary: "Emoji used as iconography instead of lucide-react",
    roots: SRC_SURFACES,
    /**
     * The original range was `1F300-1FAFF` + `2600-27BF`, which misses whole
     * families that ship as emoji on every platform:
     *   2190-21FF  arrows (→ ← ↔ ↩)
     *   25A0-25FF  geometric shapes (● ▪ ▸ ▶ ◼)
     *   2B00-2BFF  misc symbols and arrows (⬆ ⬇ ⭐ ⬛)
     *   1F000-1F2FF  mahjong, dominoes, cards, enclosed alphanumerics (🀄 🃏 🅰)
     *   1F1E6-1F1FF  regional indicators — the halves every flag is made of
     *   FE0F       variation selector-16, the "render the previous character
     *              as emoji" modifier; on its own it proves emoji intent
     * `1F1E6-1F1FF` sits inside `1F000-1F2FF`, and it is spelled out because a
     * flag is two of them and is otherwise easy to assume is covered by the
     * pictograph range.
     */
    pattern: () =>
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}\u{FE0F}]/gu,
    preprocess: stripComments,
    hint: "Use a lucide-react icon (see the design-system section of CLAUDE.md).",
  },
  {
    name: "unicode-glyph",
    summary:
      "Typographic glyph standing in for an icon or an affordance " +
      "(\u2192 \u2713 \u2605 \u2022 \u2026) in rendered text",
    roots: SRC_SURFACES,
    pattern: () => new RegExp(`[${UNICODE_GLYPHS.join("")}]`, "gu"),
    preprocess: stripComments,
    hint:
      "Use a lucide-react icon (ArrowRight, Check, Star) or plain words. " +
      "For a separator use \u00B7, the one the rest of the product uses. " +
      "Email templates get words: an icon font is not guaranteed in an inbox.",
  },
  {
    name: "legacy-tokens",
    summary:
      "Legacy CSS custom properties served by the globals.css compat block, " +
      "written as var(--token) or as the Tailwind utility that maps to it",
    roots: SRC_SURFACES,
    pattern: () =>
      new RegExp(
        `var\\(--(?:${LEGACY_TOKENS.join("|")})\\)` +
          `|(?<![\\w-])(?:${LEGACY_UTILITY_PREFIXES.join("|")})-(?:${LEGACY_UTILITY_SUFFIXES.join("|")})(?![\\w-])`,
        "g",
      ),
    // Comments are stripped for the same reason as the glyph rules: the
    // migration notes that explain WHICH aliases were removed have to name
    // them, and a rule that flags its own documentation teaches people to
    // stop documenting. A stripped trailing `// …` never hides a real
    // declaration, which sits before it on the line.
    preprocess: stripComments,
    hint: "Use the V3 token directly: --k-t1/--k-t2/--k-t3, --k-surface, --k-line, --k-bg, --k-accent — as text-[var(--k-t2)] when it has to be a class.",
  },
  {
    name: "banned-hex",
    summary: "Pre-V3 hard-coded hex colours",
    roots: SRC_SURFACES,
    pattern: () => new RegExp(BANNED_HEX.join("|"), "gi"),
    hint: "Use --k-accent (#c8ff2d), --k-danger (#ff5a5a) or --k-warning (#ffb020).",
  },
  {
    name: "to-locale-string",
    summary:
      "Bare toLocale*String() — reads the ambient timezone/locale, not the box's",
    // `src/server/email-templates` is included: a digest rendered on a UTC
    // server dated the owner's week one day early. `src/lib` is deliberately
    // NOT, because that is where the explicit formatters live.
    roots: [...SRC_UI, "src/server/email-templates"],
    pattern: () => /\.toLocale(?:Date|Time)?String\s*\(/g,
    hint: "Use formatTime24 / formatDateShort / formatDateLong / formatInt / formatMXN from src/lib/format.ts (they pin America/Mexico_City). src/lib is not scanned, that is where the explicit formatters live.",
  },
  {
    name: "raw-enum-jsx",
    summary:
      "Raw Prisma enum rendered as JSX text — the literal token, or an enum " +
      "field read straight off an object",
    roots: SRC_SURFACES,
    pattern: () =>
      new RegExp(
        `>\\s*(?:${RAW_ENUMS.join("|")})\\s*<` +
          `|>\\s*\\{\\s*[\\w.]+\\.(?:${RAW_ENUM_FIELDS.join("|")})\\s*\\}\\s*<`,
        "g",
      ),
    hint: "Render it through label(...) or a typed map from src/lib/labels.ts.",
  },
] as const;

/* -------------------------------------------------------------------------- */
/* Scanner                                                                    */
/* -------------------------------------------------------------------------- */

const EXTENSIONS = [".ts", ".tsx"];

function collectFiles(dir: string, out: string[] = []): string[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectFiles(full, out);
    } else if (entry.isFile() && EXTENSIONS.some((e) => full.endsWith(e))) {
      out.push(full);
    }
  }
  return out;
}

/** Counts matches per repo-relative file path. Files with 0 matches are omitted. */
export function scanRule(rule: GuardRule, repoRoot: string): RuleCounts {
  const counts: RuleCounts = {};
  for (const root of rule.roots) {
    const abs = path.join(repoRoot, root);
    try {
      if (!statSync(abs).isDirectory()) continue;
    } catch {
      continue;
    }
    for (const file of collectFiles(abs)) {
      const source = readFileSync(file, "utf-8");
      const matches = (
        rule.preprocess ? rule.preprocess(source) : source
      ).match(rule.pattern());
      if (!matches || matches.length === 0) continue;
      const rel = path.relative(repoRoot, file).split(path.sep).join("/");
      counts[rel] = (counts[rel] ?? 0) + matches.length;
    }
  }
  return sortKeys(counts);
}

export function scanAll(repoRoot: string): Baseline {
  const out: Baseline = {};
  for (const rule of RULES) out[rule.name] = scanRule(rule, repoRoot);
  return out;
}

function sortKeys(counts: RuleCounts): RuleCounts {
  const sorted: RuleCounts = {};
  for (const key of Object.keys(counts).sort()) sorted[key] = counts[key];
  return sorted;
}

/**
 * Ratchet comparison. Returns human-readable regressions:
 *   - a file whose count exceeds its baseline
 *   - a file with violations that has no baseline entry (new offender)
 * A count BELOW baseline is progress and never fails.
 */
export function ratchetFailures(
  rule: GuardRule,
  current: RuleCounts,
  baseline: RuleCounts,
): string[] {
  const failures: string[] = [];
  for (const [file, count] of Object.entries(current)) {
    const allowed = baseline[file];
    if (allowed === undefined) {
      failures.push(`NEW  ${file}  ${count} violation(s) (no baseline entry)`);
    } else if (count > allowed) {
      failures.push(`WORSE ${file}  ${count} > baseline ${allowed}`);
    }
  }
  return failures.sort();
}

/** Total violations recorded for a rule — used by the baseline script summary. */
export function totalFor(counts: RuleCounts): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export const BASELINE_PATH = "tests/fixtures/guard-baseline.json";
