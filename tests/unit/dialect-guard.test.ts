/**
 * Dialect guard — prevents voseo (Rioplatense) from leaking into user-facing
 * strings in server actions.
 *
 * Context: the V3/launch sweep only scrubbed `src/app/**` and `src/components/**`
 * for voseo. Server-action messages (surfaced to athletes as error toasts) were
 * never swept, so forms like "Probá", "ingresá", "elegí" slipped through and
 * shipped to production. Per the project HARD RULE the whole product must use
 * Mexican-neutral Spanish — no voseo.
 *
 * This test scans every `.ts` file under `src/server/actions/` and fails if it
 * finds an UNAMBIGUOUS voseo conjugation. We only flag forms that have no valid
 * Mexican reading (e.g. "probá", "tenés"), deliberately skipping tokens that
 * collide with valid MX preterites ("pedí", "subí", "seguí") to avoid false
 * positives.
 *
 * If this test ever fails, replace the voseo form with its MX-neutral
 * equivalent (probá→prueba/intenta, elegí→elige, ingresá→ingresa, tenés→tienes,
 * podés→puedes, etc.). Do NOT add an exception unless the match is a genuine
 * false positive.
 */

import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "fs";
import path from "path";

const ACTIONS_DIR = path.join(process.cwd(), "src", "server", "actions");

// Unambiguous voseo forms: no valid Mexican-neutral reading. Lowercased; the
// scanner lowercases each line before matching. Trailing `s?` covers the
// 2nd-person plural-ish variants (probás). Bounded by non-letters via
// Unicode-aware lookarounds so accents are handled correctly.
const VOSEO = [
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
];

const VOSEO_RE = new RegExp(
  `(?<!\\p{L})(?:${VOSEO.join("|")})(?!\\p{L})`,
  "gu",
);

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectTsFiles(full));
    else if (entry.isFile() && full.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("dialect guard — no voseo in server actions", () => {
  it("src/server/actions/** uses Mexican-neutral Spanish (no voseo)", () => {
    const files = collectTsFiles(ACTIONS_DIR);
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
