"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  computeAdherence,
  adherenceDelta,
  type AdherenceRatios,
} from "@/lib/adherence/compute";
import { buildAthleteHeatmap, type HeatmapCell } from "@/lib/adherence/heatmap";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type AdherencePeriod = "month" | "quarter";

export type AdherenceReport = {
  period: AdherencePeriod;
  current: AdherenceRatios;
  previous: AdherenceRatios;
  delta: AdherenceRatios;
  raw: {
    offered: number;
    booked: number;
    attended: number;
    prevOffered: number;
    prevBooked: number;
    prevAttended: number;
  };
};

function periodWindow(period: AdherencePeriod, now = new Date()) {
  const days = period === "month" ? 30 : 90;
  const currentEnd = now;
  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);
  const prevEnd = currentStart;
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  return { currentStart, currentEnd, prevStart, prevEnd };
}

async function computeAthleteAdherenceFor(
  athleteId: string,
  tenantId: string,
  period: AdherencePeriod,
): Promise<AdherenceReport> {
  const db = withTenant(tenantId);
  const { currentStart, currentEnd, prevStart, prevEnd } = periodWindow(period);

  const [offered, prevOffered, bookings] = await Promise.all([
    db.class.count({
      where: {
        isActive: true,
        startsAt: { gte: currentStart, lt: currentEnd },
      },
    }),
    db.class.count({
      where: { isActive: true, startsAt: { gte: prevStart, lt: prevEnd } },
    }),
    db.booking.findMany({
      where: {
        athleteId,
        class: { startsAt: { gte: prevStart, lt: currentEnd } },
      },
      select: { status: true, class: { select: { startsAt: true } } },
    }),
  ]);

  let booked = 0,
    attended = 0,
    prevBooked = 0,
    prevAttended = 0;
  for (const b of bookings) {
    const t = b.class.startsAt;
    const isCurrent = t >= currentStart && t < currentEnd;
    const isCounted = b.status !== "CANCELLED";
    const wasAttended = b.status === "ATTENDED";
    if (isCurrent) {
      if (isCounted) booked += 1;
      if (wasAttended) attended += 1;
    } else {
      if (isCounted) prevBooked += 1;
      if (wasAttended) prevAttended += 1;
    }
  }

  const current = computeAdherence({ booked, attended, offered });
  const previous = computeAdherence({
    booked: prevBooked,
    attended: prevAttended,
    offered: prevOffered,
  });

  return {
    period,
    current,
    previous,
    delta: adherenceDelta(current, previous),
    raw: { offered, booked, attended, prevOffered, prevBooked, prevAttended },
  };
}

export async function getMyAdherence(
  period: AdherencePeriod = "month",
): Promise<AdherenceReport | null> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return null;
  return computeAthleteAdherenceFor(me.id, tenantId, period);
}

export async function getAthleteAdherence(
  athleteId: string,
  period: AdherencePeriod = "month",
): Promise<AdherenceReport> {
  const session = await requireSession();
  return computeAthleteAdherenceFor(athleteId, session.user.tenantId, period);
}

export type AthleteHeatmapResult = {
  cells: HeatmapCell[];
  totalAttended: number;
  windowDays: number;
};

export async function getMyAttendanceHeatmap(
  days = 90,
): Promise<AthleteHeatmapResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
  });
  if (!me) return { cells: [], totalAttended: 0, windowDays: days };

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [bookings, box] = await Promise.all([
    db.booking.findMany({
      where: {
        athleteId: me.id,
        status: "ATTENDED",
        class: { startsAt: { gte: since } },
      },
      select: { class: { select: { startsAt: true } } },
    }),
    db.box.findUnique({
      where: { id: tenantId },
      select: { timezone: true },
    }),
  ]);

  const cells = buildAthleteHeatmap(
    bookings.map((b) => ({ date: b.class.startsAt })),
    box?.timezone ?? "UTC",
  );

  return {
    cells,
    totalAttended: bookings.length,
    windowDays: days,
  };
}
