import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Every `k-*` class written in `src/**` must have a rule in a stylesheet.
 *
 * ── Why ─────────────────────────────────────────────────────────────────────
 * `k-kpi-hero`, `k-charts-row` and `k-toaster` were all in the JSX from the day
 * the V3 system landed and none of them had a single CSS rule. They read like
 * styling ("this row is the charts row") and did nothing, so `/admin` shipped a
 * hard-coded `gridTemplateColumns: "1fr 1fr"` with a responsive hook next to it
 * that was never wired — the dashboard was unusable at 360 px and the class
 * made it look handled.
 *
 * A class hook with no rule is worse than no class: the next person assumes the
 * breakpoint exists.
 *
 * ── Scope ───────────────────────────────────────────────────────────────────
 * Only statically written class tokens are checked. `k-toast--${variant}` is a
 * runtime concatenation no scanner can resolve, so tokens that are cut off by
 * an interpolation (they end in `-`) are skipped; the variants they build are
 * defined in `globals.css` and covered by the toast styles themselves.
 */

const ROOT = path.resolve(__dirname, "../..");

const STYLESHEETS = ["src/app/globals.css", "src/app/(landing)/landing.css"];

/**
 * Classes that are deliberately unstyled. Keep this empty if you can: an entry
 * here is a promise that the class earns its place some other way (a test
 * selector, an analytics hook), and it must say which.
 */
const ALLOWED_WITHOUT_RULE: Record<string, string> = {};

function collectSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      collectSourceFiles(full, out);
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function definedClasses(): Set<string> {
  const defined = new Set<string>();
  for (const sheet of STYLESHEETS) {
    const css = readFileSync(path.join(ROOT, sheet), "utf8");
    for (const match of css.matchAll(/\.(k-[a-zA-Z0-9_-]+)/g)) {
      defined.add(match[1]);
    }
  }
  return defined;
}

/** `className="…"`, `className={`…`}` and `className={"…"}`. */
const CLASS_NAME_ATTR = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g;

function usedClasses(): Map<string, Set<string>> {
  const used = new Map<string, Set<string>>();
  for (const file of collectSourceFiles(path.join(ROOT, "src"))) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(CLASS_NAME_ATTR)) {
      const value = match[1] ?? match[2] ?? match[3] ?? "";
      for (const token of value.split(/[\s${}?:()|&]+/)) {
        if (!/^k-[a-zA-Z0-9_-]+$/.test(token)) continue;
        // Cut off by an interpolation (`k-toast--${variant}`) — unresolvable.
        if (token.endsWith("-")) continue;
        const rel = path.relative(ROOT, file).split(path.sep).join("/");
        used.set(token, (used.get(token) ?? new Set()).add(rel));
      }
    }
  }
  return used;
}

describe("k-* class hooks", () => {
  const defined = definedClasses();
  const used = usedClasses();

  it("finds the stylesheets and the class tokens", () => {
    expect(defined.size).toBeGreaterThan(50);
    expect(used.size).toBeGreaterThan(20);
    // Sanity: a class everybody uses and that is definitely styled.
    expect(defined.has("k-card")).toBe(true);
  });

  it("every k-* class written in src/** has a CSS rule", () => {
    const offenders: string[] = [];
    for (const [cls, files] of [...used].sort()) {
      if (defined.has(cls)) continue;
      if (cls in ALLOWED_WITHOUT_RULE) continue;
      offenders.push(`${cls} — ${[...files].sort().join(", ")}`);
    }
    expect(
      offenders,
      [
        "These classes style nothing. Either add the rule you meant to write",
        "to src/app/globals.css, or delete the attribute — a hook that does",
        "nothing tells the next reader the breakpoint is handled.",
        "",
        offenders.join("\n"),
      ].join("\n"),
    ).toEqual([]);
  });

  it("keeps the responsive hooks the admin dashboard depends on", () => {
    // Regression lock for the three that were missing (audit fase 0, batch 4).
    for (const cls of ["k-kpi-hero", "k-charts-row", "k-admin-sidebar"]) {
      expect(defined.has(cls), `${cls} lost its rule`).toBe(true);
    }
  });

  it("every allowlisted class states why it is unstyled", () => {
    for (const [cls, reason] of Object.entries(ALLOWED_WITHOUT_RULE)) {
      expect(reason.length, `${cls} needs a reason`).toBeGreaterThan(20);
    }
  });
});
