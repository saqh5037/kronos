/**
 * P0-1 of the 2026-09-15 audit: `withTenant()` only intercepted seven of the
 * seventeen Prisma delegate methods, so `groupBy`, `aggregate`, `upsert`,
 * `createMany`, `updateMany`, `deleteMany` and the `*OrThrow` reads reached the
 * database with no tenant discriminator at all.
 *
 * The visible symptom was `/admin/reportes`: "Top WODs" and "Top atletas por
 * asistencia" were built from `db.score.groupBy` / `db.booking.groupBy`, which
 * aggregated EVERY box in the database into one owner's report.
 *
 * Two independent nets live here:
 *
 *  1. METHOD COVERAGE — the extension is generated from `TENANT_SCOPED_METHODS`,
 *     and this test pins that map against the canonical Prisma delegate surface.
 *     A method Prisma adds (or one someone quietly deletes) fails the build
 *     instead of silently opening a hole.
 *
 *  2. RAW-CLIENT SCAN — the extension can only defend the calls that go through
 *     it. `db` (the raw client, imported as `rawDb`/`prismaBase` around the
 *     codebase) bypasses it by design, so this scans `src/**` for raw-client
 *     calls on a tenant-scoped model whose arguments never mention `tenantId`.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  TENANT_SCOPED_METHODS,
  TENANT_SCOPED_MODELS,
  applyTenantScope,
  tenantQueryExtension,
  withTenant,
  type TenantScopedMethod,
} from "../../src/server/db";

const TENANT = "tenant-a";

// ─── 1 · method coverage ─────────────────────────────────────────────────────

/**
 * Every method a Prisma model delegate exposes that can read or write rows.
 * Mirrors `Operation` in `@prisma/client/runtime/library.d.ts` minus the raw
 * escape hatches (`$queryRaw`, `$executeRaw`, `findRaw`, …), which are not
 * model-scoped and cannot be intercepted per model.
 */
const PRISMA_DELEGATE_METHODS = [
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "create",
  "createMany",
  "createManyAndReturn",
  "update",
  "updateMany",
  "updateManyAndReturn",
  "upsert",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
] as const;

describe("withTenant · method coverage", () => {
  it("intercepts every row-touching Prisma delegate method", () => {
    const covered = Object.keys(TENANT_SCOPED_METHODS);
    const missing = PRISMA_DELEGATE_METHODS.filter((m) => !covered.includes(m));
    expect(missing).toEqual([]);
  });

  it("does not claim to cover a method Prisma does not have", () => {
    const canonical = new Set<string>(PRISMA_DELEGATE_METHODS);
    const extra = Object.keys(TENANT_SCOPED_METHODS).filter(
      (m) => !canonical.has(m),
    );
    expect(extra).toEqual([]);
  });

  it("builds one query handler per covered method", () => {
    const handlers = tenantQueryExtension(TENANT).query.$allModels;
    expect(Object.keys(handlers).sort()).toEqual(
      Object.keys(TENANT_SCOPED_METHODS).sort(),
    );
  });

  it("still refuses to build a client without a tenant", () => {
    expect(() => withTenant("")).toThrow("No tenant context active");
  });
});

describe("withTenant · where-clause methods", () => {
  const whereMethods = (
    Object.keys(TENANT_SCOPED_METHODS) as TenantScopedMethod[]
  ).filter((m) => TENANT_SCOPED_METHODS[m] === "where");

  it("covers the reads and bulk writes that filter by `where`", () => {
    expect(whereMethods.sort()).toEqual(
      [
        "aggregate",
        "count",
        "delete",
        "deleteMany",
        "findFirst",
        "findFirstOrThrow",
        "findMany",
        "findUnique",
        "findUniqueOrThrow",
        "groupBy",
        "update",
        "updateMany",
        "updateManyAndReturn",
      ].sort(),
    );
  });

  it.each(whereMethods)("injects tenantId into %s.where", (method) => {
    const args = applyTenantScope(method, { where: { id: "x" } }, TENANT);
    expect(args.where).toEqual({ id: "x", tenantId: TENANT });
  });

  it.each(whereMethods)("creates the where clause for %s when absent", (m) => {
    expect(applyTenantScope(m, {}, TENANT).where).toEqual({ tenantId: TENANT });
  });

  it("cannot be overridden by a caller-supplied tenantId", () => {
    const args = applyTenantScope(
      "groupBy",
      { where: { tenantId: "tenant-b" } },
      TENANT,
    );
    expect(args.where).toEqual({ tenantId: TENANT });
  });
});

describe("withTenant · write methods", () => {
  it("injects tenantId into create.data", () => {
    const args = applyTenantScope("create", { data: { name: "Ana" } }, TENANT);
    expect(args.data).toEqual({ name: "Ana", tenantId: TENANT });
  });

  it("injects tenantId into every row of createMany.data", () => {
    const args = applyTenantScope(
      "createMany",
      { data: [{ name: "Ana" }, { name: "Beto" }] },
      TENANT,
    );
    expect(args.data).toEqual([
      { name: "Ana", tenantId: TENANT },
      { name: "Beto", tenantId: TENANT },
    ]);
  });

  it("accepts the single-object form of createMany.data", () => {
    const args = applyTenantScope(
      "createManyAndReturn",
      { data: { name: "Ana" } },
      TENANT,
    );
    expect(args.data).toEqual({ name: "Ana", tenantId: TENANT });
  });

  it("scopes both the lookup and the insert of an upsert", () => {
    const args = applyTenantScope(
      "upsert",
      { where: { id: "x" }, create: { name: "Ana" }, update: { name: "Ana" } },
      TENANT,
    );
    expect(args.where).toEqual({ id: "x", tenantId: TENANT });
    expect(args.create).toEqual({ name: "Ana", tenantId: TENANT });
  });
});

describe("withTenant · models without a tenantId column", () => {
  it("knows which models carry a tenant discriminator", () => {
    expect(TENANT_SCOPED_MODELS.has("Athlete")).toBe(true);
    expect(TENANT_SCOPED_MODELS.has("Score")).toBe(true);
    // Box IS the tenant; it has no tenantId column of its own.
    expect(TENANT_SCOPED_MODELS.has("Box")).toBe(false);
  });

  it("leaves a non-tenant model's args untouched", async () => {
    const handlers = tenantQueryExtension(TENANT).query.$allModels;
    let seen: unknown;
    await handlers.findUnique({
      model: "Box",
      args: { where: { id: TENANT } },
      query: async (a: Record<string, unknown>) => {
        seen = a;
        return null;
      },
    });
    expect(seen).toEqual({ where: { id: TENANT } });
  });

  it("still scopes a tenant model through the same handler", async () => {
    const handlers = tenantQueryExtension(TENANT).query.$allModels;
    let seen: unknown;
    await handlers.findMany({
      model: "Athlete",
      args: {},
      query: async (a: Record<string, unknown>) => {
        seen = a;
        return [];
      },
    });
    expect(seen).toEqual({ where: { tenantId: TENANT } });
  });
});

// ─── 2 · raw-client scan ─────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");

/** `Athlete` → `athlete`, `PR` → `pR`, `XPLedger` → `xPLedger` (Prisma's rule). */
const delegateName = (model: string) =>
  model.charAt(0).toLowerCase() + model.slice(1);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/** The text between the balanced parentheses that start at `open`. */
function callArguments(source: string, open: number): string {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "(") depth++;
    else if (source[i] === ")" && --depth === 0)
      return source.slice(open + 1, i);
  }
  return "";
}

type RawCall = { file: string; line: number; call: string };

/**
 * Every call of the shape `<alias>.<tenantModel>.<method>(…)` where `<alias>`
 * is bound to the RAW client (`import { db } from "@/server/db"`, however it is
 * renamed) and the arguments never mention `tenantId`.
 */
function scanUnscopedRawCalls(): RawCall[] {
  const tenantDelegates = new Set(
    [...TENANT_SCOPED_MODELS].map((m) => delegateName(m)),
  );
  const hits: RawCall[] = [];

  for (const file of walk(SRC)) {
    const rel = path.relative(ROOT, file);
    if (rel === "src/server/db.ts") continue; // the module that owns the client
    const source = readFileSync(file, "utf8");

    const aliases = new Set<string>();
    const importRe =
      /import\s*\{([^}]*)\}\s*from\s*["'](?:@\/server\/db|(?:\.\.?\/)+db)["']/g;
    for (const imp of source.matchAll(importRe)) {
      for (const specifier of imp[1].split(",")) {
        const named = specifier.trim().match(/^db(?:\s+as\s+(\w+))?$/);
        if (named) aliases.add(named[1] ?? "db");
      }
    }
    if (aliases.size === 0) continue;

    for (const alias of aliases) {
      const callRe = new RegExp(`\\b${alias}\\.(\\w+)\\.(\\w+)\\s*\\(`, "g");
      for (const match of source.matchAll(callRe)) {
        if (!tenantDelegates.has(match[1])) continue;
        const open = match.index + match[0].length - 1;
        if (/\btenantId\b/.test(callArguments(source, open))) continue;
        hits.push({
          file: rel,
          line: source.slice(0, match.index).split("\n").length,
          call: `${alias}.${match[1]}.${match[2]}`,
        });
      }
    }
  }
  return hits;
}

/**
 * Areas the P0-1 fix actually swept. These must stay at zero: every read here
 * either goes through `withTenant()` or names `tenantId` explicitly.
 */
const ZERO_TOLERANCE = [
  "src/server/achievements/",
  "src/server/actions/reports.ts",
  "src/server/analytics/",
  "src/server/period-summary/",
];

/**
 * Pre-existing debt, recorded as a RATCHET exactly like the UI guards
 * (`tests/unit/ui-guards.test.ts`): a file may only go DOWN, and a file that is
 * not listed may not have a single unscoped call.
 *
 * These calls are not all leaks — most narrow by a cuid that was already proven
 * to belong to the tenant, and the auth/webhook lookups are cross-tenant by
 * design (a magic link resolves an email before any box is known). They are
 * listed because a reader cannot tell which is which from the call site, and
 * that ambiguity is the thing to retire. Sweeping them is follow-up work: each
 * one needs its own "is this id already tenant-proven?" judgement, and most of
 * these files belong to other worktrees.
 *
 * Ratchet it down with a smaller number; never up.
 */
const UNSCOPED_RAW_CALL_BASELINE: Record<string, number> = {
  "src/app/admin/clases/[id]/scores-from-whiteboard/page.tsx": 2,
  "src/app/admin/page.tsx": 1,
  "src/app/api/cron/cleanup-uploads/route.ts": 2,
  "src/app/api/cron/saas-billing-lifecycle/route.ts": 2,
  "src/app/api/cron/wearables-sync/route.ts": 1,
  "src/app/api/push/unsubscribe/route.ts": 1,
  "src/app/api/webhooks/mercadopago/route.ts": 2,
  "src/app/api/webhooks/mp-saas/route.ts": 3,
  "src/app/api/webhooks/whoop/route.ts": 1,
  "src/lib/wearables/whoop-sync.ts": 10,
  "src/server/actions/alerts.ts": 2,
  "src/server/actions/aliases.ts": 1,
  "src/server/actions/athlete-invitations.ts": 2,
  "src/server/actions/athlete-program.ts": 2,
  "src/server/actions/atleta-avatar.ts": 2,
  "src/server/actions/atleta-onboarding-v2.ts": 2,
  "src/server/actions/atleta-onboarding.ts": 1,
  "src/server/actions/atleta-signup.ts": 2,
  "src/server/actions/body-metrics.ts": 1,
  "src/server/actions/classes.ts": 1,
  "src/server/actions/coach-cards.ts": 3,
  "src/server/actions/events.ts": 6,
  "src/server/actions/founding-dominus.ts": 1,
  "src/server/actions/goals.ts": 3,
  "src/server/actions/movement-content.ts": 4,
  "src/server/actions/movements.ts": 3,
  "src/server/actions/notifications.ts": 4,
  "src/server/actions/onboarding.ts": 1,
  "src/server/actions/password.ts": 4,
  "src/server/actions/payments.ts": 1,
  "src/server/actions/pilot-onboarding.ts": 1,
  "src/server/actions/saas-billing.ts": 3,
  "src/server/actions/scores.ts": 3,
  "src/server/actions/signup.ts": 1,
  "src/server/actions/skill-levels.ts": 2,
  "src/server/actions/staff-invitations.ts": 2,
  "src/server/actions/super-platform.ts": 2,
  "src/server/actions/uploads.ts": 2,
  "src/server/announcements/dispatch.ts": 3,
  "src/server/auth-dev.ts": 1,
  "src/server/auth-password.ts": 1,
  "src/server/cache.ts": 1,
  "src/server/push.ts": 2,
  "src/server/saas-billing/renewal.ts": 1,
};

describe("raw Prisma client · tenant scoping", () => {
  const hits = scanUnscopedRawCalls();
  const byFile = hits.reduce<Record<string, RawCall[]>>((acc, hit) => {
    (acc[hit.file] ??= []).push(hit);
    return acc;
  }, {});

  it("keeps the audited modules free of unscoped raw calls", () => {
    const offenders = hits.filter((h) =>
      ZERO_TOLERANCE.some((prefix) => h.file.startsWith(prefix)),
    );
    expect(offenders.map((h) => `${h.file}:${h.line} ${h.call}`)).toEqual([]);
  });

  it("introduces no new file that bypasses the tenant extension", () => {
    const newOffenders = Object.keys(byFile).filter(
      (file) => UNSCOPED_RAW_CALL_BASELINE[file] === undefined,
    );
    expect(newOffenders).toEqual([]);
  });

  it("never lets a known file grow more unscoped raw calls", () => {
    const worse = Object.entries(byFile)
      .filter(([file, calls]) => {
        const allowed = UNSCOPED_RAW_CALL_BASELINE[file];
        return allowed !== undefined && calls.length > allowed;
      })
      .map(
        ([file, calls]) =>
          `${file}: ${calls.length} > ${UNSCOPED_RAW_CALL_BASELINE[file]}`,
      );
    expect(worse).toEqual([]);
  });
});
