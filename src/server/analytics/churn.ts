"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  detectChurnRisk,
  type ChurnDetection,
  type Severity,
} from "@/lib/insights/detectors";

async function requireCoachSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role === "ATHLETE") throw new Error("Forbidden");
  return session;
}

export type ChurnRiskRow = {
  athleteId: string;
  name: string;
  severity: Severity;
  signalCount: number;
  reasons: string[];
  daysSinceLastAttended: number | null;
};

const WINDOW_DAYS = 30;
const PR_LOOKBACK_DAYS = 180;

export async function getChurnRiskList(): Promise<ChurnRiskRow[]> {
  const session = await requireCoachSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - WINDOW_DAYS);
  const prevWindowStart = new Date(windowStart);
  prevWindowStart.setDate(prevWindowStart.getDate() - WINDOW_DAYS);
  const prLookback = new Date(now);
  prLookback.setDate(prLookback.getDate() - PR_LOOKBACK_DAYS);

  const athletes = await db.athlete.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bookings: {
        where: { class: { startsAt: { gte: prevWindowStart } } },
        select: {
          status: true,
          checkedInAt: true,
          class: { select: { startsAt: true } },
        },
      },
      prs: {
        orderBy: { achievedAt: "desc" },
        take: 1,
        select: { achievedAt: true },
      },
    },
  });

  const rows: ChurnRiskRow[] = [];

  for (const a of athletes) {
    let currentAttended = 0;
    let currentTotal = 0;
    let prevAttended = 0;
    let prevTotal = 0;
    let lastAttendedAt: Date | null = null;
    let recentCancellations = 0;
    let recentBookings = 0;

    for (const b of a.bookings) {
      const t = b.class.startsAt;
      const inCurrent = t >= windowStart;
      const counted = b.status !== "CANCELLED";
      const attended = b.status === "ATTENDED";
      if (inCurrent) {
        if (counted) currentTotal += 1;
        if (attended) currentAttended += 1;
        recentBookings += 1;
        if (b.status === "CANCELLED") recentCancellations += 1;
        if (attended && b.checkedInAt) {
          if (!lastAttendedAt || b.checkedInAt > lastAttendedAt) {
            lastAttendedAt = b.checkedInAt;
          }
        }
      } else {
        if (counted) prevTotal += 1;
        if (attended) prevAttended += 1;
      }
    }

    const currentRate = currentTotal === 0 ? 0 : currentAttended / currentTotal;
    const previousRate = prevTotal === 0 ? 0 : prevAttended / prevTotal;
    const attendanceDeltaPct = currentRate - previousRate;

    const daysSinceLastAttended = lastAttendedAt
      ? Math.floor((now.getTime() - lastAttendedAt.getTime()) / 86400000)
      : null;

    const lastPRAt = a.prs[0]?.achievedAt ?? null;
    const daysSinceLastPR = lastPRAt
      ? Math.floor((now.getTime() - lastPRAt.getTime()) / 86400000)
      : null;

    const cancelRatio =
      recentBookings > 0 ? recentCancellations / recentBookings : 0;

    const detection: ChurnDetection = detectChurnRisk({
      daysSinceLastAttended,
      attendanceDeltaPct,
      daysSinceLastPR,
      recentCancellationsRatio: cancelRatio,
    });

    if (detection.atRisk) {
      rows.push({
        athleteId: a.id,
        name: `${a.firstName} ${a.lastName}`,
        severity: detection.severity,
        signalCount: detection.signalCount,
        reasons: detection.reasons,
        daysSinceLastAttended,
      });
    }
  }

  const severityRank: Record<Severity, number> = { high: 3, med: 2, low: 1 };
  rows.sort((a, b) => {
    const sd = severityRank[b.severity] - severityRank[a.severity];
    if (sd !== 0) return sd;
    return b.signalCount - a.signalCount;
  });

  return rows;
}
