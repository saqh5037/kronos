"use server";

import { requireCachedSession } from "@/server/session";
import { withTenant, db as rawDb } from "../db";
import type { ScoreType } from "@/lib/validations/wod";
import { isBetterScore } from "@/lib/scores";

async function requireSession() {
  return requireCachedSession();
}

export type LeaderboardEntry = {
  athleteId: string;
  athleteName: string;
  value: number;
  unit: string;
  scaling: string;
  achievedAt: Date;
};

export type WODLeaderboard = {
  wodId: string;
  wodName: string;
  scoreType: ScoreType;
  entries: LeaderboardEntry[];
};

/**
 * Best-score-per-athlete for a given WOD, sorted according to scoreType.
 * RX scores rank above SCALED at equal value (separate buckets later).
 */
export async function getWODLeaderboard(
  wodId: string,
): Promise<WODLeaderboard> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const wod = await db.wOD.findUnique({
    where: { id: wodId },
    select: { id: true, name: true, scoreType: true },
  });
  if (!wod) throw new Error("WOD not found");

  const scores = await db.score.findMany({
    where: { wodId, scaling: { not: "SCALED" } },
    take: 200,
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  // Best per athlete
  const bestByAthlete = new Map<string, LeaderboardEntry>();
  for (const s of scores) {
    const value = Number(s.value);
    const existing = bestByAthlete.get(s.athleteId);
    if (
      !existing ||
      isBetterScore(existing.value, value, wod.scoreType as ScoreType)
    ) {
      bestByAthlete.set(s.athleteId, {
        athleteId: s.athleteId,
        athleteName: `${s.athlete.firstName} ${s.athlete.lastName}`,
        value,
        unit: s.unit,
        scaling: s.scaling,
        achievedAt: s.createdAt,
      });
    }
  }

  const entries = Array.from(bestByAthlete.values());
  entries.sort((a, b) => {
    if (wod.scoreType === "TIME") return a.value - b.value;
    return b.value - a.value;
  });

  return {
    wodId: wod.id,
    wodName: wod.name,
    scoreType: wod.scoreType as ScoreType,
    entries: entries.slice(0, 50),
  };
}

export type MovementLeaderboard = {
  movementId: string;
  movementName: string;
  entries: LeaderboardEntry[];
};

/**
 * PRs leaderboard for a single movement (highest weight wins).
 */
export async function getMovementLeaderboard(
  movementId: string,
): Promise<MovementLeaderboard> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const movement = await db.movement.findUnique({
    where: { id: movementId },
    select: { id: true, name: true },
  });
  if (!movement) throw new Error("Movement not found");

  const prs = await db.pR.findMany({
    where: { movementId },
    orderBy: { value: "desc" },
    take: 50,
    include: {
      athlete: { select: { firstName: true, lastName: true } },
    },
  });

  return {
    movementId: movement.id,
    movementName: movement.name,
    entries: prs.map((p) => ({
      athleteId: p.athleteId,
      athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
      value: Number(p.value),
      unit: p.unit,
      scaling: "RX",
      achievedAt: p.achievedAt,
    })),
  };
}

export type AttendanceLeader = {
  athleteId: string;
  athleteName: string;
  attendedCount: number;
};

export async function getWeeklyAttendanceLeaderboard(
  weeksBack = 0,
): Promise<AttendanceLeader[]> {
  const session = await requireSession();

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - now.getDay() - 7 * weeksBack);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const attendedCounts = await rawDb.booking.groupBy({
    by: ["athleteId"],
    where: {
      tenantId: session.user.tenantId,
      status: "ATTENDED",
      class: { startsAt: { gte: start, lt: end } },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 20,
  });

  const athleteIds = attendedCounts.map((a) => a.athleteId);
  const athletes =
    athleteIds.length > 0
      ? await rawDb.athlete.findMany({
          where: { tenantId: session.user.tenantId, id: { in: athleteIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

  const nameMap = new Map(
    athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`]),
  );

  return attendedCounts.map((a) => ({
    athleteId: a.athleteId,
    athleteName: nameMap.get(a.athleteId) ?? "",
    attendedCount: a._count.id,
  }));
}

export async function listWODOptions() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.wOD.findMany({
    where: { isActive: true },
    select: { id: true, name: true, scoreType: true },
    orderBy: { name: "asc" },
  });
}

export async function listMovementOptions() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.movement.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
