"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import {
  computeAthletesAtRisk,
  type AthleteAtRiskRow,
} from "../owner-digest/compute";

export type CoachClassToday = {
  id: string;
  startsAt: Date;
  durationMin: number;
  wodName: string | null;
  capacity: number;
  bookedCount: number;
  attendedCount: number;
};

export type CoachDashboardSnapshot = {
  classesToday: CoachClassToday[];
  attendanceTodayTotal: { booked: number; attended: number };
  athletesAtRisk: AthleteAtRiskRow[];
};

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function endOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(23, 59, 59, 999);
  return out;
}

export async function getCoachDashboardSnapshot(): Promise<CoachDashboardSnapshot | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return null;
  if (session.user.role !== "COACH" && session.user.role !== "STAFF") {
    return null;
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;
  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  const [classesRaw, attendanceTotal, athletesAtRisk] = await Promise.all([
    prismaBase.class.findMany({
      where: {
        tenantId,
        coachId: userId,
        startsAt: { gte: dayStart, lte: dayEnd },
        isActive: true,
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        startsAt: true,
        durationMin: true,
        capacity: true,
        wod: { select: { name: true } },
        bookings: {
          where: { status: { not: "CANCELLED" } },
          select: { status: true },
        },
      },
    }),
    prismaBase.booking.groupBy({
      by: ["status"],
      where: {
        tenantId,
        class: { startsAt: { gte: dayStart, lte: dayEnd } },
      },
      _count: true,
    }),
    computeAthletesAtRisk(tenantId, 5, now),
  ]);

  const classesToday: CoachClassToday[] = classesRaw.map((c) => {
    const bookedCount = c.bookings.length;
    const attendedCount = c.bookings.filter(
      (b) => b.status === "ATTENDED",
    ).length;
    return {
      id: c.id,
      startsAt: c.startsAt,
      durationMin: c.durationMin,
      wodName: c.wod?.name ?? null,
      capacity: c.capacity,
      bookedCount,
      attendedCount,
    };
  });

  const booked = attendanceTotal
    .filter((g) => g.status !== "CANCELLED")
    .reduce((sum, g) => sum + g._count, 0);
  const attended =
    attendanceTotal.find((g) => g.status === "ATTENDED")?._count ?? 0;

  return {
    classesToday,
    attendanceTodayTotal: { booked, attended },
    athletesAtRisk,
  };
}
