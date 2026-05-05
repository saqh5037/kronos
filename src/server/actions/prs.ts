"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import { buildPRProgression, type PRProgressionPoint } from "@/lib/prs/log";
import { daysSinceLastAttempt } from "@/lib/prs/freshness";
import type { ScoreType } from "@/lib/validations/wod";

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

export type PRProgressionResult = {
  points: PRProgressionPoint[];
  firstAttempt: Date | null;
  currentBest: number | null;
  totalAttempts: number;
  daysSinceLast: number | null;
  movementName: string | null;
  unit: string | null;
};

/**
 * Returns the full progression of PR attempts for an athlete on a movement.
 *
 * Each point includes the value, the % improvement vs the previous PR
 * (always non-negative), and a flag for the current best. Ready to feed a
 * LineChart with a tooltip showing the delta.
 *
 * @param days  Window from today. Default 180 (~6 months). Pass 0 for full history.
 */
export async function getPRProgression(
  athleteId: string,
  movementId: string,
  days = 180,
): Promise<PRProgressionResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const where: {
    athleteId: string;
    movementId: string;
    achievedAt?: { gte: Date };
  } = { athleteId, movementId };
  if (days > 0) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    where.achievedAt = { gte: since };
  }

  const [attempts, movement] = await Promise.all([
    db.pRAttempt.findMany({
      where,
      orderBy: { achievedAt: "asc" },
      select: { achievedAt: true, value: true, prevBest: true, unit: true },
    }),
    db.movement.findUnique({
      where: { id: movementId },
      select: { name: true },
    }),
  ]);

  if (attempts.length === 0) {
    return {
      points: [],
      firstAttempt: null,
      currentBest: null,
      totalAttempts: 0,
      daysSinceLast: null,
      movementName: movement?.name ?? null,
      unit: null,
    };
  }

  // PRAttempts created via submitScore are always WEIGHT-based (STRENGTH WODs).
  // Kept explicit so future score-types (TIME PR per WOD, etc.) can override.
  const scoreType: ScoreType = "WEIGHT";

  const points = buildPRProgression(
    attempts.map((a) => ({
      achievedAt: a.achievedAt,
      value: Number(a.value),
      prevBest: a.prevBest ? Number(a.prevBest) : null,
    })),
    scoreType,
  );

  const last = attempts[attempts.length - 1];
  return {
    points,
    firstAttempt: attempts[0].achievedAt,
    currentBest: Number(last.value),
    totalAttempts: attempts.length,
    daysSinceLast: daysSinceLastAttempt(last.achievedAt),
    movementName: movement?.name ?? null,
    unit: last.unit,
  };
}

/**
 * Convenience wrapper for the current athlete (resolves their athleteId from
 * the session). Returns an empty result if the user isn't an athlete in any
 * box.
 */
export async function getMyPRProgression(
  movementId: string,
  days = 180,
): Promise<PRProgressionResult> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) {
    return {
      points: [],
      firstAttempt: null,
      currentBest: null,
      totalAttempts: 0,
      daysSinceLast: null,
      movementName: null,
      unit: null,
    };
  }
  return getPRProgression(me.id, movementId, days);
}
