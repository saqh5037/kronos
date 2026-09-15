/**
 * UI guards — design-system ratchets over `src/app/**` and `src/components/**`.
 *
 * ============================================================================
 * WHY A RATCHET AND NOT A GATE
 * ============================================================================
 * These rules encode the house rules that the product audit of 2026-09-15 found
 * broken at scale (`docs/audit/2026-09-15-kronos-producto/`, systemic issues S3
 * and S7 plus `reviews/technical-audit.md` section D). Fixing all of them at
 * once is the job of the nine parallel rebuild worktrees, so a zero-tolerance
 * gate on day one would simply be red for everyone.
 *
 * Instead each rule reads `tests/fixtures/guard-baseline.json`:
 *
 *     { "<rule>": { "<repo-relative file>": <violation count> } }
 *
 * and fails only when
 *   (a) a file's count EXCEEDS its baseline entry, or
 *   (b) a file has violations and no baseline entry at all (a new offender).
 *
 * Counting DOWN is always allowed and never fails. So the numbers can only move
 * one way, and nobody has to finish the sweep to start defending it.
 *
 * ============================================================================
 * HOW TO RATCHET IT DOWN
 * ============================================================================
 *   pnpm exec tsx scripts/guards/update-baseline.ts
 *
 * Run it after merging the rebuild branches and commit the (smaller) fixture.
 * The destination is `{}` for every rule — at that point these tests become
 * ordinary zero-tolerance gates and the fixture stops churning. Never run it to
 * silence a violation you just wrote: the script prints a WARNING for every
 * entry that got worse, and that warning is the review signal.
 *
 * ============================================================================
 * THE RULES
 * ============================================================================
 *   emoji-in-jsx   Emoji used as iconography. The product ships `lucide-react`
 *                  since the rebuild base commit; emoji do not scale, do not
 *                  inherit colour, and render differently per platform
 *                  (audit S7: 71 files). Baseline: 128 occurrences / 71 files.
 *   legacy-tokens  `var(--text|--card|--line|--bg|--accent|--moss|--fire|--grad
 *                  |--text-2)` — legacy names kept alive only by the compat
 *                  block at the end of `globals.css`. Matched by EXACT name
 *                  (closing paren required) so `var(--text-3)` and
 *                  `var(--line-2)` are not swept up. Only `.ts`/`.tsx` is
 *                  scanned: the compat block in `globals.css` *defines* these
 *                  names on purpose. Baseline: 213 occurrences / 59 files.
 *   banned-hex     Pre-V3 hard-coded hexes `#19f08b #3aa3ff #1a3457 #0d1b2e
 *                  #07101e`. Already at 0 — an effective zero-tolerance gate.
 *   raw-enum-jsx   A Prisma enum token rendered as literal JSX text
 *                  (`>PAID<`). Also 0: the audit's raw enums reach the DOM
 *                  through `{expression}` interpolation, which no regex can
 *                  see. The real defense is `src/lib/labels.ts` plus the
 *                  completeness test in `tests/unit/labels-format.test.ts`;
 *                  this rule only nails the blunt literal form.
 *
 * Voseo lives in its sibling `tests/unit/dialect-guard.test.ts` and shares the
 * same baseline file and machinery.
 *
 * Rule definitions and the scanner: `scripts/guards/rules.ts`.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  BASELINE_PATH,
  RULES,
  ratchetFailures,
  scanRule,
  type Baseline,
} from "../../scripts/guards/rules";

const repoRoot = process.cwd();

const baseline: Baseline = JSON.parse(
  readFileSync(path.join(repoRoot, BASELINE_PATH), "utf-8"),
) as Baseline;

const UI_RULES = RULES.filter((rule) => rule.name !== "voseo");

describe("UI guards (ratchet vs tests/fixtures/guard-baseline.json)", () => {
  for (const rule of UI_RULES) {
    it(`${rule.name} — ${rule.summary}`, () => {
      const current = scanRule(rule, repoRoot);
      const failures = ratchetFailures(
        rule,
        current,
        baseline[rule.name] ?? {},
      );

      expect(
        failures,
        [
          `Rule "${rule.name}" regressed in ${failures.length} file(s).`,
          "",
          rule.hint,
          "",
          failures.join("\n"),
          "",
          "This guard is a RATCHET: counts may only go down. Fix the code.",
          "Only regenerate the baseline when the numbers DECREASE:",
          "  pnpm exec tsx scripts/guards/update-baseline.ts",
        ].join("\n"),
      ).toEqual([]);
    });
  }

  it("the baseline fixture has an entry for every rule", () => {
    expect(Object.keys(baseline).sort()).toEqual(
      RULES.map((rule) => rule.name).sort(),
    );
  });
});
