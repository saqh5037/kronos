import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaBase = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaBase;

/**
 * Models that actually carry a `tenantId` column, read from the generated
 * datamodel rather than a hand-kept list — a new model is covered the moment
 * `prisma generate` runs.
 *
 * `Box` is deliberately absent: the Box *is* the tenant, so its primary key is
 * the tenant id. Injecting `where.tenantId` into a Box query made Prisma throw
 * `Unknown argument tenantId`, which is why
 * `withTenant(t).box.findUnique({ where: { id: t } })` — a shape that reads as
 * perfectly correct — failed at runtime in the Mercado Pago checkout action
 * (`src/server/actions/payments.ts`) and in the athlete adherence heatmap
 * (`src/server/analytics/adherence.ts`).
 */
export const TENANT_SCOPED_MODELS: ReadonlySet<string> = new Set(
  Prisma.dmmf.datamodel.models
    .filter((model) => model.fields.some((field) => field.name === "tenantId"))
    .map((model) => model.name),
);

/** Where in a Prisma call's arguments the tenant discriminator belongs. */
export type TenantInjectionSite = "where" | "data" | "dataList" | "upsert";

/**
 * Every row-touching method a Prisma model delegate exposes, and how each one
 * carries the tenant.
 *
 * Audit 2026-09-15, P0-1: this used to be seven hand-written interceptors
 * (`findMany`, `findFirst`, `findUnique`, `create`, `update`, `delete`,
 * `count`). Everything else — `groupBy`, `aggregate`, `upsert`, `createMany`,
 * `updateMany`, `deleteMany`, the `*OrThrow` reads — reached Postgres with no
 * tenant filter at all. `/admin/reportes` proved it: "Top WODs" and "Top
 * atletas por asistencia" came from `db.score.groupBy` / `db.booking.groupBy`
 * and therefore ranked every box in the database inside one owner's report.
 *
 * The extension is now GENERATED from this map, so adding an interceptor is a
 * one-line change and `tests/unit/with-tenant-coverage.test.ts` fails the build
 * if the map ever stops matching Prisma's delegate surface.
 *
 * Raw escape hatches (`$queryRaw`, `$executeRaw`, `findRaw`, …) are absent on
 * purpose: they are not model-scoped, so there is no `where` to extend. Those
 * call sites must filter by `tenantId` themselves.
 */
export const TENANT_SCOPED_METHODS = {
  findMany: "where",
  findFirst: "where",
  findFirstOrThrow: "where",
  findUnique: "where",
  findUniqueOrThrow: "where",
  count: "where",
  aggregate: "where",
  groupBy: "where",
  update: "where",
  updateMany: "where",
  updateManyAndReturn: "where",
  delete: "where",
  deleteMany: "where",
  create: "data",
  createMany: "dataList",
  createManyAndReturn: "dataList",
  upsert: "upsert",
} as const satisfies Record<string, TenantInjectionSite>;

export type TenantScopedMethod = keyof typeof TENANT_SCOPED_METHODS;

type QueryArgs = Record<string, unknown>;
type QueryFn = (args: QueryArgs) => Promise<unknown>;

const merge = (value: unknown, tenantId: string): QueryArgs => ({
  ...((value as QueryArgs | undefined) ?? {}),
  tenantId,
});

/**
 * Stamps `tenantId` onto one call's arguments. Pure and exported so the
 * contract is unit-testable without a database.
 *
 * The tenant is merged LAST in every branch, so a caller-supplied `tenantId`
 * can never widen the scope — it can only be overwritten with the session's.
 */
export function applyTenantScope(
  method: TenantScopedMethod,
  args: QueryArgs,
  tenantId: string,
): QueryArgs {
  const site: TenantInjectionSite = TENANT_SCOPED_METHODS[method];
  switch (site) {
    case "where":
      args.where = merge(args.where, tenantId);
      return args;
    case "data":
      args.data = merge(args.data, tenantId);
      return args;
    case "dataList":
      // `createMany` accepts a single object as well as an array of rows.
      args.data = Array.isArray(args.data)
        ? args.data.map((row) => merge(row, tenantId))
        : merge(args.data, tenantId);
      return args;
    case "upsert":
      args.where = merge(args.where, tenantId);
      args.create = merge(args.create, tenantId);
      return args;
  }
}

type QueryHandlerInput = {
  model: string;
  args: QueryArgs;
  query: QueryFn;
};

export type TenantQueryExtension = {
  query: {
    $allModels: Record<
      TenantScopedMethod,
      (input: QueryHandlerInput) => Promise<unknown>
    >;
  };
};

/**
 * The `$extends` argument for one tenant. Exported separately from
 * `withTenant()` so the interception table can be exercised with a fake `query`
 * instead of a live Postgres connection.
 */
export function tenantQueryExtension(tenantId: string): TenantQueryExtension {
  const methods = Object.keys(TENANT_SCOPED_METHODS) as TenantScopedMethod[];
  const $allModels = {} as TenantQueryExtension["query"]["$allModels"];

  for (const method of methods) {
    $allModels[method] = ({ model, args, query }) =>
      query(
        TENANT_SCOPED_MODELS.has(model)
          ? applyTenantScope(method, args, tenantId)
          : args,
      );
  }

  return { query: { $allModels } };
}

/**
 * Returns a Prisma client scoped to the current tenant.
 * Throws if no tenantId is provided.
 * Use withTenant() directly in server actions / route handlers.
 */
export function withTenant(tenantId: string) {
  if (!tenantId) throw new Error("No tenant context active");

  return prismaBase.$extends(tenantQueryExtension(tenantId));
}

/**
 * Raw Prisma client — only use for tenant-independent queries
 * (e.g., looking up a Box by slug during auth).
 */
export const db = prismaBase;
