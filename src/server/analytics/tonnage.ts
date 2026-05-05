"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { computeWODTonnage, type ScalingKey } from "@/lib/tonnage/compute";
import {
  aggregateTonnageByPeriod,
  type Period,
  type TonnageBucket,
} from "@/lib/tonnage/aggregate";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type TonnageTimelinePoint = TonnageBucket;

/**
 * Tonnage timeline for an athlete: kg moved bucketed by period.
 *
 * `range` is the lookback window in days (default 90). `period` controls the
 * bucket granularity (day/week/month). Output is sorted ascending and ready
 * for a BarChart or AreaChart.
 */
export async function getAthleteTonnageTimeline(
  athleteId: string,
  period: Period = "week",
  rangeDays = 90,
): Promise<TonnageTimelinePoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const scores = await db.score.findMany({
    where: { athleteId, createdAt: { gte: since } },
    select: {
      createdAt: true,
      scaling: true,
      wod: {
        select: {
          movements: {
            select: { reps: true, weight: true },
          },
        },
      },
    },
  });

  const entries = scores.map((s) => ({
    date: s.createdAt,
    kg: computeWODTonnage(
      s.wod.movements.map((m) => ({
        reps: m.reps,
        weight: m.weight === null ? null : Number(m.weight),
      })),
      s.scaling as ScalingKey,
    ),
  }));

  return aggregateTonnageByPeriod(entries, period);
}

/**
 * Convenience: tonnage timeline for the currently signed-in athlete.
 */
export async function getMyTonnageTimeline(
  period: Period = "week",
  rangeDays = 90,
): Promise<TonnageTimelinePoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return [];
  return getAthleteTonnageTimeline(me.id, period, rangeDays);
}

export type BoxTonnageMovement = {
  movementId: string;
  movementName: string;
  kg: number;
  sessions: number;
};

export type BoxTonnageSummary = {
  totalKg: number;
  totalSessions: number;
  topMovements: BoxTonnageMovement[];
};

/**
 * Box-level tonnage summary for admin views.
 * Aggregates kg across all athletes in the box for the given window and
 * surfaces the top 8 movements by total kg.
 */
export async function getBoxTonnageSummary(
  rangeDays = 30,
): Promise<BoxTonnageSummary> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const since = new Date();
  since.setDate(since.getDate() - rangeDays);

  const scores = await db.score.findMany({
    where: { createdAt: { gte: since } },
    select: {
      scaling: true,
      wod: {
        select: {
          movements: {
            select: {
              reps: true,
              weight: true,
              movementId: true,
              movement: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  let totalKg = 0;
  const totalSessions = scores.length;
  const byMovement = new Map<
    string,
    { name: string; kg: number; sessions: number }
  >();

  for (const s of scores) {
    const factor =
      s.scaling === "SCALED" ? 0.7 : s.scaling === "RXPLUS" ? 1.05 : 1;
    for (const m of s.wod.movements) {
      const reps = m.reps ?? 0;
      const weight = m.weight === null ? 0 : Number(m.weight);
      if (reps <= 0 || weight <= 0) continue;
      const kg = reps * weight * factor;
      totalKg += kg;
      const acc = byMovement.get(m.movementId);
      if (acc) {
        acc.kg += kg;
        acc.sessions += 1;
      } else {
        byMovement.set(m.movementId, {
          name: m.movement.name,
          kg,
          sessions: 1,
        });
      }
    }
  }

  const topMovements: BoxTonnageMovement[] = Array.from(byMovement.entries())
    .map(([movementId, v]) => ({
      movementId,
      movementName: v.name,
      kg: Math.round(v.kg * 100) / 100,
      sessions: v.sessions,
    }))
    .sort((a, b) => b.kg - a.kg)
    .slice(0, 8);

  return {
    totalKg: Math.round(totalKg * 100) / 100,
    totalSessions,
    topMovements,
  };
}
