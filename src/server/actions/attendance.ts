"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { computeAttendanceStreak } from "@/lib/streak";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type DayClass = {
  id: string;
  startsAt: Date;
  capacity: number;
  bookedCount: number;
  attendedCount: number;
  noShowCount: number;
  wodName: string | null;
  coachName: string | null;
};

export async function getTodayClasses(): Promise<DayClass[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const classes = await db.class.findMany({
    where: { startsAt: { gte: start, lt: end }, isActive: true },
    orderBy: { startsAt: "asc" },
    include: {
      wod: { select: { name: true } },
      coach: { select: { name: true } },
      bookings: { select: { status: true } },
    },
  });

  return classes.map((c) => ({
    id: c.id,
    startsAt: c.startsAt,
    capacity: c.capacity,
    bookedCount: c.bookings.filter(
      (b) => b.status === "BOOKED" || b.status === "ATTENDED",
    ).length,
    attendedCount: c.bookings.filter((b) => b.status === "ATTENDED").length,
    noShowCount: c.bookings.filter((b) => b.status === "NOSHOW").length,
    wodName: c.wod?.name ?? null,
    coachName: c.coach?.name ?? null,
  }));
}

export type DayStats = {
  totalClasses: number;
  totalBooked: number;
  totalAttended: number;
  totalNoShow: number;
  attendanceRate: number;
};

export async function getTodayStats(): Promise<DayStats> {
  const classes = await getTodayClasses();
  const totalBooked = classes.reduce((acc, c) => acc + c.bookedCount, 0);
  const totalAttended = classes.reduce((acc, c) => acc + c.attendedCount, 0);
  const totalNoShow = classes.reduce((acc, c) => acc + c.noShowCount, 0);
  return {
    totalClasses: classes.length,
    totalBooked,
    totalAttended,
    totalNoShow,
    attendanceRate: totalBooked === 0 ? 0 : totalAttended / totalBooked,
  };
}

/**
 * Recompute a single athlete's ATTENDANCE streak from their booking history.
 * Idempotent — safe to call after any check-in/cancel/no-show.
 */
export async function recomputeAttendanceStreak(athleteId: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const attended = await db.booking.findMany({
    where: { athleteId, status: "ATTENDED" },
    select: { class: { select: { startsAt: true } } },
    orderBy: { bookedAt: "desc" },
  });

  const dates = attended.map((b) => b.class.startsAt);
  const count = computeAttendanceStreak(dates);

  await rawDb.streak.upsert({
    where: {
      athleteId_type: { athleteId, type: "ATTENDANCE" },
    },
    update: {
      count,
      lastEventAt: dates[0] ?? null,
    },
    create: {
      tenantId,
      athleteId,
      type: "ATTENDANCE",
      count,
      lastEventAt: dates[0] ?? null,
    },
  });

  revalidatePath("/atleta");
  return { count };
}

export async function getAthleteStreak(athleteId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const streak = await db.streak.findFirst({
    where: { athleteId, type: "ATTENDANCE" },
  });
  return streak?.count ?? 0;
}
