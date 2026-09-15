import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Service-worker cache contract (technical-audit.md §E).
 *
 * The 2026-05-17 cross-tenant leak was fixed by making `/api`, `/admin` and
 * `/atleta` network-only. The audit found the residual risk: `network-first`
 * still cached `/uploads/whiteboards/*` (photos with athlete names and scores)
 * and `/invitacion/<token>` HTML, so on a shared box tablet those survive
 * logout offline.
 */

const SW_PATH = join(process.cwd(), "public/sw.js");

function readSw(): string {
  return readFileSync(SW_PATH, "utf8");
}

/** The `if (...) return;` network-only guard inside the fetch handler. */
function networkOnlyBlock(sw: string): string {
  const start = sw.indexOf('url.pathname.startsWith("/api/")');
  expect(start, "network-only guard not found").toBeGreaterThan(-1);
  return sw.slice(start, sw.indexOf("}", start));
}

describe("public/sw.js cache version", () => {
  it("is bumped past kronos-shell-v2 so old clients drop their cache", () => {
    const sw = readSw();
    const match = sw.match(/const CACHE_VERSION = "([^"]+)"/);
    expect(match, "CACHE_VERSION not found").not.toBeNull();
    const version = match![1];
    expect(version).not.toBe("kronos-shell-v2");
    expect(version).toMatch(/^kronos-shell-v\d+$/);
    const n = Number(version.replace("kronos-shell-v", ""));
    expect(n).toBeGreaterThan(2);
  });

  it("still drops every previous kronos-shell-* cache on activate", () => {
    expect(readSw()).toContain('k.startsWith("kronos-shell-")');
  });
});

describe("public/sw.js network-only list", () => {
  const sw = readSw();
  const block = networkOnlyBlock(sw);

  it("keeps the 2026-05-17 cross-tenant leak fix in place", () => {
    for (const prefix of ["/api/", "/admin", "/atleta"]) {
      expect(block, `missing ${prefix}`).toContain(`"${prefix}"`);
    }
  });

  it("adds /uploads so whiteboard photos are never cached", () => {
    expect(block).toContain('"/uploads"');
  });

  it("adds /invitacion and /invitacion-staff so invite HTML is never cached", () => {
    expect(block).toContain('"/invitacion"');
    expect(block).toContain('"/invitacion-staff"');
  });

  it("never precaches user-specific HTML", () => {
    const precache = sw.slice(
      sw.indexOf("const SHELL_PRECACHE"),
      sw.indexOf("];", sw.indexOf("const SHELL_PRECACHE")),
    );
    expect(precache).not.toContain("/atleta");
    expect(precache).not.toContain("/admin");
    expect(precache).not.toContain("/uploads");
    expect(precache).not.toContain("/invitacion");
  });
});

describe("public/sw.js dead code", () => {
  it("no longer ships the unused staleWhileRevalidate strategy", () => {
    expect(readSw()).not.toContain("staleWhileRevalidate");
  });

  it("still ships the strategies actually wired into the fetch handler", () => {
    const sw = readSw();
    expect(sw).toContain("async function cacheFirst(");
    expect(sw).toContain("async function networkFirst(");
  });
});

describe("public/manifest.webmanifest", () => {
  const manifest = JSON.parse(
    readFileSync(join(process.cwd(), "public/manifest.webmanifest"), "utf8"),
  ) as {
    start_url: string;
    scope: string;
    display: string;
    icons: { src: string; sizes: string; purpose?: string }[];
  };

  it("starts the installed app on the athlete surface", () => {
    expect(manifest.start_url).toBe("/atleta");
    expect(manifest.scope).toBe("/");
    expect(manifest.display).toBe("standalone");
  });

  it("ships a maskable 192 and 512 icon", () => {
    const maskable = manifest.icons.filter((i) =>
      (i.purpose ?? "").includes("maskable"),
    );
    expect(maskable.map((i) => i.sizes).sort()).toEqual(["192x192", "512x512"]);
  });
});
