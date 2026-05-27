/**
 * Dialect guard — prevents voseo (Rioplatense) from leaking into user-facing
 * strings anywhere in the product.
 *
 * Originally only scanned `src/server/actions/` — that gap let voseo in
 * components and pages reach production. This version covers the full surface:
 *   - src/server/actions/  (original)
 *   - src/app/             (pages, layouts, route handlers)
 *   - src/components/      (shared UI)
 * and matches both `.ts` and `.tsx` files.
 *
 * We only flag UNAMBIGUOUS voseo conjugations — forms that have no valid
 * Mexican-neutral reading. We deliberately skip tokens that collide with valid
 * MX preterites (yo elegí, yo seguí, yo pedí, yo subí) to avoid false
 * positives.
 *
 * If this test ever fails, replace the voseo form with its MX-neutral
 * equivalent. Do NOT add an exception unless the match is a genuine false
 * positive.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const SCAN_DIRS = [
  path.join(process.cwd(), "src", "server", "actions"),
  path.join(process.cwd(), "src", "app"),
  path.join(process.cwd(), "src", "components"),
];

// Unambiguous voseo forms: no valid Mexican-neutral reading.
// Lowercased; the scanner lowercases each line before matching.
// Trailing `s?` covers the conjugated variant (cargás). Bare imperatives
// without `s` are separate entries (cargá). Bounded by non-letters via
// Unicode-aware lookarounds so accents are handled correctly.
//
// EXCLUDED intentionally (collide with MX preterites of 1st-person singular):
//   elegí, seguí, pedí, subí, registré, cargué, anuncié, empecé
const VOSEO = [
  // --- original list ---
  "probás?",
  "elegís?",
  "ingresás?",
  "tenés",
  "podés",
  "querés",
  "sabés",
  "hacés?",
  "andás?",
  "mirás?",
  "dejás?",
  "mandás?",
  "contás?",
  "agregás?",
  "guardás?",
  "cargás?",
  "revisás?",
  "fijate",
  "acordate",
  // --- extended forms ---
  // Voseo present-tense conjugations (unambiguous -ás/-és/-ís)
  "evolucionás?",
  "registrás?",
  "anunciás?",
  "empezás?",
  "preferís",
  "seguís",
  "llevás?",
  "lográs?",
  "alcanzás?",
  "sumás?",
  "entrenás?",
  "reservás?",
  "anotás?",
  // Voseo imperatives (safe: MX preterite would have accent shift ué/qué/etc.)
  "registrá",
  "cargá",
  "anunciá",
  "empezá",
  "volvé",
  "anotá",
  "reservá",
  "sumá",
  // Voseo reflexive imperative (safe: no MX preterite collision)
  "llevate",
];

const VOSEO_RE = new RegExp(
  `(?<!\\p{L})(?:${VOSEO.join("|")})(?!\\p{L})`,
  "gu",
);

function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectFiles(full));
    else if (entry.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx")))
      out.push(full);
  }
  return out;
}

describe("dialect guard — no voseo in product copy", () => {
  it("src/server/actions + src/app + src/components use Mexican-neutral Spanish (no voseo)", () => {
    const files = SCAN_DIRS.flatMap((dir) => collectFiles(dir));
    const hits: string[] = [];

    for (const file of files) {
      const lines = readFileSync(file, "utf-8").split("\n");
      lines.forEach((line, i) => {
        if (VOSEO_RE.test(line.toLowerCase())) {
          const rel = path.relative(process.cwd(), file);
          hits.push(`${rel}:${i + 1}  →  ${line.trim()}`);
        }
        VOSEO_RE.lastIndex = 0; // reset stateful global regex
      });
    }

    expect(
      hits,
      `Voseo found (use MX-neutral Spanish):\n${hits.join("\n")}`,
    ).toEqual([]);
  });
});
