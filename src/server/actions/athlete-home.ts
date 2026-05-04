"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type AthleteHome = {
  athlete: { id: string; firstName: string; lastName: string } | null;
  streak: number;
  weekAttendance: number; // ATTENDED count this week
  weekGoal: number; // capacity goal (default 5)
  nextBooking: {
    bookingId: string;
    classId: string;
    startsAt: Date;
    wodName: string | null;
    coachName: string | null;
    status: string;
  } | null;
  lastScore: {
    wodName: string;
    value: number;
    unit: string;
    scoreType: string;
    createdAt: Date;
  } | null;
  prCount: number;
} | null;

export async function getAthleteHome(): Promise<AthleteHome> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!me) return null;

  const now = new Date();
  const weekStart = new Date(now);
  const dow = weekStart.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  weekStart.setDate(weekStart.getDate() + offset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [streak, weekAttended, nextBookingRaw, lastScore, prCount] =
    await Promise.all([
      db.streak.findFirst({
        where: { athleteId: me.id, type: "ATTENDANCE" },
      }),
      db.booking.count({
        where: {
          athleteId: me.id,
          status: "ATTENDED",
          class: { startsAt: { gte: weekStart, lt: weekEnd } },
        },
      }),
      db.booking.findFirst({
        where: {
          athleteId: me.id,
          status: { in: ["BOOKED", "WAITLIST"] },
          class: { startsAt: { gte: now } },
        },
        orderBy: { class: { startsAt: "asc" } },
        include: {
          class: {
            include: {
              wod: { select: { name: true } },
              coach: { select: { name: true } },
            },
          },
        },
      }),
      db.score.findFirst({
        where: { athleteId: me.id },
        orderBy: { createdAt: "desc" },
        include: { wod: { select: { name: true, scoreType: true } } },
      }),
      db.pR.count({ where: { athleteId: me.id } }),
    ]);

  return {
    athlete: me,
    streak: streak?.count ?? 0,
    weekAttendance: weekAttended,
    weekGoal: 5,
    nextBooking: nextBookingRaw
      ? {
          bookingId: nextBookingRaw.id,
          classId: nextBookingRaw.classId,
          startsAt: nextBookingRaw.class.startsAt,
          wodName: nextBookingRaw.class.wod?.name ?? null,
          coachName: nextBookingRaw.class.coach?.name ?? null,
          status: nextBookingRaw.status,
        }
      : null,
    lastScore: lastScore
      ? {
          wodName: lastScore.wod.name,
          value: Number(lastScore.value),
          unit: lastScore.unit,
          scoreType: lastScore.wod.scoreType,
          createdAt: lastScore.createdAt,
        }
      : null,
    prCount,
  };
}
