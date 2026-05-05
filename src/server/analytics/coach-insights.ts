"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  detectStagnation,
  detectDecline,
  rankImprovers,
  type Severity,
} from "@/lib/insights/detectors";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role === "ATHLETE") throw new Error("Forbidden");
  return session;
}

export type AthleteInsight = {
  athleteId: string;
  name: string;
  metric: string;
  delta: number;
  lastEventAt: Date | null;
  severity: Severity;
};

export type CoachInsightsReport = {
  stagnant: AthleteInsight[];
  declining: AthleteInsight[];
  improvers: AthleteInsight[];
  generatedAt: Date;
  windowDays: number;
};

/**
 * Single batch of coach-actionable lists for the box.
 *
 * - stagnant:  trained in last 30d, no PR in last 30d
 * - declining: attendance dropped >=20% vs previous window
 * - improvers: top 5 by recent PR delta% in last 60d
 */
export async function getCoachInsights(
  windowDays = 60,
): Promise<CoachInsightsReport> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - windowDays);
  const prevWindowStart = new Date(windowStart);
  prevWindowStart.setDate(prevWindowStart.getDate() - windowDays);
  const stagnationThreshold = new Date(now);
  stagnationThreshold.setDate(stagnationThreshold.getDate() - 30);

  const athletes = await db.athlete.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      scores: {
        where: { createdAt: { gte: stagnationThreshold } },
        select: { id: true },
        take: 1,
      },
      prAttempts: {
        where: { isCurrentBest: true },
        orderBy: { achievedAt: "desc" },
        take: 1,
        select: {
          achievedAt: true,
          value: true,
          prevBest: true,
          movement: { select: { name: true } },
        },
      },
      bookings: {
        where: { class: { startsAt: { gte: prevWindowStart } } },
        select: {
          status: true,
          class: { select: { startsAt: true } },
        },
      },
    },
  });

  const stagnant: AthleteInsight[] = [];
  const declining: AthleteInsight[] = [];
  const improverInputs: Parameters<typeof rankImprovers>[0] = [];

  for (const a of athletes) {
    const fullName = `${a.firstName} ${a.lastName}`;
    const lastPRAt = a.prAttempts[0]?.achievedAt ?? null;
    const trainedRecently = a.scores.length > 0;
    const daysSinceLastPR =
      lastPRAt === null
        ? null
        : Math.floor((now.getTime() - lastPRAt.getTime()) / 86400000);

    const stag = detectStagnation({
      daysSinceLastPR,
      trainedRecently,
      thresholdDays: 30,
    });
    if (stag.stagnant) {
      stagnant.push({
        athleteId: a.id,
        name: fullName,
        metric: "Sin PR en 30+ días",
        delta: daysSinceLastPR ?? 0,
        lastEventAt: lastPRAt,
        severity: stag.severity,
      });
    }

    let currentAttended = 0;
    let currentTotal = 0;
    let prevAttended = 0;
    let prevTotal = 0;
    for (const b of a.bookings) {
      const t = b.class.startsAt;
      const inCurrent = t >= windowStart;
      const counted = b.status !== "CANCELLED";
      const attended = b.status === "ATTENDED";
      if (inCurrent) {
        if (counted) currentTotal += 1;
        if (attended) currentAttended += 1;
      } else {
        if (counted) prevTotal += 1;
        if (attended) prevAttended += 1;
      }
    }
    const currentRate = currentTotal === 0 ? 0 : currentAttended / currentTotal;
    const previousRate = prevTotal === 0 ? 0 : prevAttended / prevTotal;
    const decl = detectDecline({
      currentAttendanceRate: currentRate,
      previousAttendanceRate: previousRate,
      thresholdPct: 0.2,
    });
    if (decl.declining && prevTotal > 0) {
      declining.push({
        athleteId: a.id,
        name: fullName,
        metric: "Asistencia bajó",
        delta: decl.deltaPct,
        lastEventAt:
          a.bookings
            .filter((b) => b.status === "ATTENDED")
            .map((b) => b.class.startsAt)
            .sort((x, y) => y.getTime() - x.getTime())[0] ?? null,
        severity: decl.severity,
      });
    }

    const lastPR = a.prAttempts[0];
    if (lastPR && lastPR.achievedAt >= windowStart) {
      const prev = lastPR.prevBest === null ? null : Number(lastPR.prevBest);
      const curr = Number(lastPR.value);
      if (prev !== null && prev > 0) {
        const recentDeltaPct = ((curr - prev) / prev) * 100;
        improverInputs.push({
          athleteId: a.id,
          name: fullName,
          recentDeltaPct: Math.round(recentDeltaPct * 10) / 10,
          movementName: lastPR.movement?.name ?? null,
          lastEventAt: lastPR.achievedAt,
        });
      }
    }
  }

  const improvers: AthleteInsight[] = rankImprovers(improverInputs, 5).map(
    (i) => ({
      athleteId: i.athleteId,
      name: i.name,
      metric: i.movementName
        ? `+${i.recentDeltaPct}% en ${i.movementName}`
        : `+${i.recentDeltaPct}%`,
      delta: i.recentDeltaPct,
      lastEventAt: i.lastEventAt instanceof Date ? i.lastEventAt : null,
      severity:
        i.recentDeltaPct >= 10 ? "high" : i.recentDeltaPct >= 5 ? "med" : "low",
    }),
  );

  stagnant.sort((a, b) => b.delta - a.delta);
  declining.sort((a, b) => a.delta - b.delta);

  return {
    stagnant,
    declining,
    improvers,
    generatedAt: now,
    windowDays,
  };
}
