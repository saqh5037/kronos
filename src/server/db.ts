import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const prismaBase = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prismaBase;

/**
 * Returns a Prisma client scoped to the current tenant.
 * Throws if no tenantId is provided.
 * Use withTenant() directly in server actions / route handlers.
 */
export function withTenant(tenantId: string) {
  if (!tenantId) throw new Error("No tenant context active");

  return prismaBase.$extends({
    query: {
      $allModels: {
        async findMany({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
        async findFirst({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
        async findUnique({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
        async create({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.data = { ...(args.data as Record<string, unknown>), tenantId };
          return query(args);
        },
        async update({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
        async delete({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
        async count({
          args,
          query,
        }: {
          args: Record<string, unknown>;
          query: (args: Record<string, unknown>) => Promise<unknown>;
        }) {
          args.where = { ...(args.where as Record<string, unknown>), tenantId };
          return query(args);
        },
      },
    },
  });
}

/**
 * Raw Prisma client — only use for tenant-independent queries
 * (e.g., looking up a Box by slug during auth).
 */
export const db = prismaBase;
