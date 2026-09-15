/**
 * Regenerates tests/fixtures/guard-baseline.json from the CURRENT working tree.
 *
 *   pnpm exec tsx scripts/guards/update-baseline.ts          # write
 *   pnpm exec tsx scripts/guards/update-baseline.ts --check  # report only
 *
 * The guards in tests/unit/{dialect-guard,ui-guards}.test.ts are ratchets: they
 * fail when a file's violation count EXCEEDS its baseline, or when a file with
 * violations is absent from the baseline. Counting down is always allowed.
 *
 * WHEN TO RUN THIS
 *   - After merging the rebuild worktrees, to ratchet the baseline DOWN to the
 *     new (smaller) reality. The end state is `{}` for every rule; at that
 *     point the guards become plain zero-tolerance gates with no fixture churn.
 *   - Never to silence a fresh violation you just introduced. If the diff adds
 *     entries or raises counts, fix the code instead — the whole point is that
 *     the numbers only go one way.
 *
 * A run that RAISES any count prints a warning and still writes, so the diff is
 * reviewable in the commit. Read it before you stage it.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  BASELINE_PATH,
  RULES,
  scanRule,
  totalFor,
  type Baseline,
} from "./rules";

const repoRoot = path.resolve(__dirname, "..", "..");
const target = path.join(repoRoot, BASELINE_PATH);
const checkOnly = process.argv.includes("--check");

function readExisting(): Baseline {
  try {
    return JSON.parse(readFileSync(target, "utf-8")) as Baseline;
  } catch {
    return {};
  }
}

const previous = readExisting();
const next: Baseline = {};
const raised: string[] = [];

for (const rule of RULES) {
  const counts = scanRule(rule, repoRoot);
  next[rule.name] = counts;

  const before = previous[rule.name] ?? {};
  for (const [file, count] of Object.entries(counts)) {
    const old = before[file];
    if (old === undefined) raised.push(`${rule.name}: + ${file} (${count})`);
    else if (count > old)
      raised.push(`${rule.name}: ↑ ${file} ${old} → ${count}`);
  }

  const files = Object.keys(counts).length;
  const total = totalFor(counts);
  const prevTotal = totalFor(before);
  const delta = total - prevTotal;
  const arrow = delta === 0 ? "=" : delta < 0 ? `${delta}` : `+${delta}`;
  console.log(
    `${rule.name.padEnd(16)} ${String(total).padStart(5)} violations in ${String(files).padStart(4)} files  (${arrow} vs current fixture)`,
  );
}

if (raised.length > 0) {
  console.warn("\nWARNING — these entries got WORSE, review before staging:");
  for (const line of raised) console.warn(`  ${line}`);
}

if (checkOnly) {
  console.log("\n--check: nothing written.");
  process.exit(0);
}

mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(next, null, 2)}\n`, "utf-8");
console.log(`\nWrote ${BASELINE_PATH}`);
