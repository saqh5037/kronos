import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The service-worker network-only list is a security contract, not a
 * preference.
 *
 * History: the v1 worker precached `/atleta` and served one athlete's HTML to
 * the next session on the same device (cross-tenant leak, 2026-05-17). v3 added
 * `/uploads` and `/invitacion*`. What kept slipping is that the list is an
 * `if (a || b || c)` chain in the middle of a fetch handler, and every new
 * tenant-scoped route has to remember to join it: `/eventos/<id>` renders an
 * athlete's inscription and `/tv/<slug>` renders a box's roster, leaderboard
 * and PRs, and both fell through to `networkFirst`, which writes the response
 * into `kronos-shell-*`. On the box tablet at the front desk that HTML outlives
 * the logout.
 *
 * This test asserts the list EQUALS the canonical set — not "contains". An
 * `expect(...).toContain(...)` per prefix is what let two routes be missing for
 * four months: nothing failed, because nothing asserted completeness.
 */

const SW_PATH = join(process.cwd(), "public/sw.js");

/**
 * Every route whose HTML or payload is scoped to a tenant, a session or a
 * single-use token. Adding a route here and nowhere else must fail this test.
 */
const NETWORK_ONLY_PREFIXES = [
  "/api/",
  "/admin",
  "/atleta",
  "/uploads",
  "/invitacion",
  "/invitacion-staff",
  "/eventos",
  "/tv",
];

function readSw(): string {
  return readFileSync(SW_PATH, "utf8");
}

/**
 * The prefixes inside the `if (...) return;` network-only guard, read from the
 * `url.pathname.startsWith("…")` calls in that block only.
 */
function networkOnlyPrefixes(sw: string): string[] {
  const start = sw.indexOf('url.pathname.startsWith("/api/")');
  expect(start, "network-only guard not found in public/sw.js").toBeGreaterThan(
    -1,
  );
  const block = sw.slice(start, sw.indexOf("}", start));
  return [...block.matchAll(/startsWith\("([^"]+)"\)/g)].map((m) => m[1]);
}

describe("public/sw.js network-only list", () => {
  const sw = readSw();

  it("is exactly the canonical set of tenant-scoped prefixes", () => {
    expect([...networkOnlyPrefixes(sw)].sort()).toEqual(
      [...NETWORK_ONLY_PREFIXES].sort(),
    );
  });

  it("lists no prefix twice", () => {
    const found = networkOnlyPrefixes(sw);
    expect(found.length).toBe(new Set(found).size);
  });

  it("never lets a network-only route reach a caching strategy", () => {
    // The guard must `return` before cacheFirst/networkFirst are dispatched.
    const start = sw.indexOf('url.pathname.startsWith("/api/")');
    const guardEnd = sw.indexOf("}", start);
    const afterGuard = sw.slice(guardEnd, guardEnd + 400);
    expect(afterGuard).toContain("return;");
    expect(sw.indexOf("cacheFirst(req)")).toBeGreaterThan(guardEnd);
    expect(sw.indexOf("networkFirst(req")).toBeGreaterThan(guardEnd);
  });
});

describe("public/sw.js cache version", () => {
  it("is bumped whenever the network-only list changes", () => {
    // A client that installed the previous worker keeps its old cache until
    // the version string changes, so widening the list without a bump leaves
    // the already-cached /eventos and /tv HTML on the device.
    const match = readSw().match(/const CACHE_VERSION = "kronos-shell-v(\d+)"/);
    expect(match, "CACHE_VERSION not found or malformed").not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(4);
  });

  it("still drops every previous kronos-shell-* cache on activate", () => {
    expect(readSw()).toContain('k.startsWith("kronos-shell-")');
  });
});
