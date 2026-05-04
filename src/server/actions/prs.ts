"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { type ListOpts, type ListResult, normalizePagination } from "./types";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type PRRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  movementId: string;
  movementName: string;
  value: number;
  unit: string;
  achievedAt: Date;
};

export async function listAllPRs(opts?: {
  athleteId?: string;
  movementId?: string;
}): Promise<PRRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const prs = await db.pR.findMany({
    where: {
      ...(opts?.athleteId ? { athleteId: opts.athleteId } : {}),
      ...(opts?.movementId ? { movementId: opts.movementId } : {}),
    },
    orderBy: { achievedAt: "desc" },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
      movement: { select: { id: true, name: true } },
    },
    take: 100,
  });

  return prs.map((p) => ({
    id: p.id,
    athleteId: p.athleteId,
    athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
    movementId: p.movementId,
    movementName: p.movement.name,
    value: Number(p.value),
    unit: p.unit,
    achievedAt: p.achievedAt,
  }));
}

export type PRSort = "achievedAt" | "value";

export async function listAllPRsPaged(
  opts?: ListOpts<PRSort> & { athleteId?: string; movementId?: string },
): Promise<ListResult<PRRow>> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const { page, pageSize, skip, take } = normalizePagination(opts);

  const search = opts?.search?.trim();
  const where = {
    ...(opts?.athleteId ? { athleteId: opts.athleteId } : {}),
    ...(opts?.movementId ? { movementId: opts.movementId } : {}),
    ...(opts?.dateFrom || opts?.dateTo
      ? {
          achievedAt: {
            ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
            ...(opts.dateTo ? { lte: opts.dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            {
              athlete: {
                OR: [
                  {
                    firstName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                  {
                    lastName: {
                      contains: search,
                      mode: "insensitive" as const,
                    },
                  },
                ],
              },
            },
            {
              movement: {
                name: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const sortBy = opts?.sortBy ?? "achievedAt";
  const sortDir = opts?.sortDir ?? "desc";

  const [total, prs] = await Promise.all([
    db.pR.count({ where }),
    db.pR.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take,
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
        movement: { select: { id: true, name: true } },
      },
    }),
  ]);

  const rows: PRRow[] = prs.map((p) => ({
    id: p.id,
    athleteId: p.athleteId,
    athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
    movementId: p.movementId,
    movementName: p.movement.name,
    value: Number(p.value),
    unit: p.unit,
    achievedAt: p.achievedAt,
  }));

  return { rows, total, page, pageSize };
}

export async function listMyPRs(): Promise<PRRow[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return [];

  return listAllPRs({ athleteId: me.id });
}
