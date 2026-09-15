/**
 * Dialect guard — keeps Rioplatense voseo and other non-Mexican regional
 * markers out of the product.
 *
 * ============================================================================
 * SCOPE
 * ============================================================================
 * Scans ALL of `src/**` (`.ts` + `.tsx`). The previous version only covered
 * `src/server/actions`, `src/app` and `src/components`, which let voseo survive
 * in `src/lib`, `src/middleware.ts`, the email templates and — worst of all —
 * `src/server/ai/coach-cards-prompt.ts`, where a voseo-written prompt teaches
 * Gemini to answer the athlete in voseo. The product audit of 2026-09-15 found
 * it in ≥8 user-facing files (screen audit, systemic issue S3) while this test
 * was green.
 *
 * ============================================================================
 * RATCHET
 * ============================================================================
 * Shares `tests/fixtures/guard-baseline.json` and the machinery in
 * `scripts/guards/rules.ts` with `tests/unit/ui-guards.test.ts`. Read that
 * file's header for the full contract. In short: a file's count may go DOWN
 * freely; it fails when a count rises or a new file shows up with violations.
 *
 * Baseline at branch point: 36 occurrences across 28 files.
 * Ratchet it down with `pnpm exec tsx scripts/guards/update-baseline.ts`; the
 * destination is `{}`, after which this test is a plain zero-tolerance gate.
 *
 * ============================================================================
 * WORD BOUNDARIES — WHY NOT \b
 * ============================================================================
 * The rule uses Unicode letter lookarounds `(?<!\p{L}) … (?!\p{L})` rather than
 * `\b`. JavaScript's `\b` is ASCII-only, so `/\bsubí\b/` does NOT match
 * "Subí una foto": the trailing `\b` sits after `í`, which is not a `\w`
 * character, so it demands a following word character. Accented endings are the
 * rule in voseo (`tenés`, `mantené`, `recibís`, `acá`), so an ASCII `\b` would
 * silently disable most of the pattern.
 *
 * ============================================================================
 * WHEN IT FAILS
 * ============================================================================
 * Replace the form with its Mexican-neutral equivalent — never add an exception
 * unless the match is a genuine false positive, and then say so in the commit:
 *   tenés/querés/podés → tienes/quieres/puedes    acá → aquí
 *   mantené → mantén        Subí → Sube           esperá → espera
 *   pedile → pídele         cancelás → cancelas   dale → va / sale
 *   recibís → recibes       fijate → fíjate       acordate → recuerda
 *
 * Forms deliberately NOT flagged (they collide with valid Mexican first-person
 * preterites: yo elegí, yo seguí, yo pedí, yo registré, yo cargué, yo empecé)
 * are listed in `scripts/guards/rules.ts`.
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

const voseoRule = RULES.find((rule) => rule.name === "voseo");

describe("dialect guard — no voseo in src/**", () => {
  it("is wired to a rule definition", () => {
    expect(voseoRule).toBeDefined();
  });

  it("src/** uses Mexican-neutral Spanish (ratchet vs baseline)", () => {
    const rule = voseoRule!;
    const current = scanRule(rule, repoRoot);
    const failures = ratchetFailures(rule, current, baseline[rule.name] ?? {});

    expect(
      failures,
      [
        `Voseo regressed in ${failures.length} file(s).`,
        "",
        rule.hint,
        "",
        failures.join("\n"),
        "",
        "This guard is a RATCHET: counts may only go down. Fix the copy.",
        "Only regenerate the baseline when the numbers DECREASE:",
        "  pnpm exec tsx scripts/guards/update-baseline.ts",
      ].join("\n"),
    ).toEqual([]);
  });

  it("matches accented forms (regression test for the ASCII \\b bug)", () => {
    const rule = voseoRule!;
    const samples = [
      "Subí una foto de la pizarra",
      "Mantené el tono",
      "Ya recibís los avisos",
      "Pedile a tu Box que te invite",
      "Si cancelás con menos de 2 horas",
      "Nos vemos acá",
      "Esperá un momento",
    ];
    for (const sample of samples) {
      expect(rule.pattern().test(sample), `should flag: ${sample}`).toBe(true);
    }
  });

  it("does not flag valid Mexican-neutral copy", () => {
    const rule = voseoRule!;
    const samples = [
      "Mantén el tono de tu Box",
      "Sube una foto de la pizarra",
      "Recibes los avisos por correo",
      "Pídele a tu coach que te invite",
      "Si cancelas con menos de 2 horas",
      "Nos vemos aquí",
      "Yo elegí este plan y seguí el programa",
      "Espera un momento",
    ];
    for (const sample of samples) {
      expect(rule.pattern().test(sample), `should allow: ${sample}`).toBe(
        false,
      );
    }
  });
});
