/**
 * Shared rule definitions + scanner for the Kronos hygiene guards.
 *
 * Consumed by:
 *   - tests/unit/dialect-guard.test.ts   (rule: voseo)
 *   - tests/unit/ui-guards.test.ts       (rules: emoji-in-jsx, legacy-tokens,
 *                                         banned-hex, raw-enum-jsx)
 *   - scripts/guards/update-baseline.ts  (regenerates tests/fixtures/guard-baseline.json)
 *
 * The guards are RATCHETS, not absolute gates. See the header of
 * tests/unit/ui-guards.test.ts for the full contract and the ratchet-down
 * procedure after the rebuild worktrees merge.
 *
 * Word boundaries: the Spanish rules use Unicode letter lookarounds
 * `(?<!\p{L}) … (?!\p{L})` instead of `\b`. JavaScript's `\b` is ASCII-only, so
 * `/\bsubí\b/` never matches "Subí una foto" (the boundary after `í` requires a
 * following word character). Accented endings are the norm in voseo, so ASCII
 * `\b` would silently disable most of the rule.
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
}

const SRC_UI = ["src/app", "src/components"] as const;

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
    roots: SRC_UI,
    pattern: () => /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu,
    hint: "Use a lucide-react icon (see the design-system section of CLAUDE.md).",
  },
  {
    name: "legacy-tokens",
    summary:
      "Legacy CSS custom properties served by the globals.css compat block",
    roots: SRC_UI,
    pattern: () => new RegExp(`var\\(--(?:${LEGACY_TOKENS.join("|")})\\)`, "g"),
    hint: "Use the V3 token directly: --k-t1/--k-t2/--k-t3, --k-surface, --k-line, --k-bg, --k-accent.",
  },
  {
    name: "banned-hex",
    summary: "Pre-V3 hard-coded hex colours",
    roots: SRC_UI,
    pattern: () => new RegExp(BANNED_HEX.join("|"), "gi"),
    hint: "Use --k-accent (#c8ff2d), --k-danger (#ff5a5a) or --k-warning (#ffb020).",
  },
  {
    name: "raw-enum-jsx",
    summary: "Raw Prisma enum token rendered as JSX text",
    roots: SRC_UI,
    pattern: () => new RegExp(`>\\s*(?:${RAW_ENUMS.join("|")})\\s*<`, "g"),
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
      const matches = readFileSync(file, "utf-8").match(rule.pattern());
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
