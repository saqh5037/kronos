"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { computeAttendanceStreak } from "@/lib/streak";
import { eachDayInRange, dayKey } from "@/lib/dates";
import { subDays, startOfDay } from "date-fns";

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

export type AttendanceByDayPoint = {
  day: string;
  attended: number;
  noShow: number;
  booked: number;
  capacity: number;
};

export async function getAttendanceByDay(opts: {
  dateFrom: Date;
  dateTo: Date;
  coachId?: string;
}): Promise<AttendanceByDayPoint[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const classes = await db.class.findMany({
    where: {
      isActive: true,
      startsAt: { gte: opts.dateFrom, lte: opts.dateTo },
      ...(opts.coachId ? { coachId: opts.coachId } : {}),
    },
    select: {
      startsAt: true,
      capacity: true,
      bookings: { select: { status: true } },
    },
  });

  const byDay = new Map<
    string,
    { attended: number; noShow: number; booked: number; capacity: number }
  >();

  for (const c of classes) {
    const k = dayKey(c.startsAt);
    const existing = byDay.get(k) ?? {
      attended: 0,
      noShow: 0,
      booked: 0,
      capacity: 0,
    };
    existing.capacity += c.capacity;
    for (const b of c.bookings) {
      if (b.status === "ATTENDED") existing.attended += 1;
      else if (b.status === "NOSHOW") existing.noShow += 1;
      else if (b.status === "BOOKED") existing.booked += 1;
    }
    byDay.set(k, existing);
  }

  return eachDayInRange({ from: opts.dateFrom, to: opts.dateTo }).map((d) => {
    const k = dayKey(d);
    const v = byDay.get(k) ?? {
      attended: 0,
      noShow: 0,
      booked: 0,
      capacity: 0,
    };
    return { day: k, ...v };
  });
}

export type AttendanceHeatmapCell = {
  weekday: number; // 0=Sun..6=Sat
  hour: number; // 0..23
  classes: number;
  attended: number;
  capacity: number;
};

/**
 * Utilization heatmap by weekday × hour-of-day for the given range.
 */
export async function getAttendanceHeatmap(opts: {
  dateFrom: Date;
  dateTo: Date;
}): Promise<AttendanceHeatmapCell[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const classes = await db.class.findMany({
    where: {
      isActive: true,
      startsAt: { gte: opts.dateFrom, lte: opts.dateTo },
    },
    select: {
      startsAt: true,
      capacity: true,
      bookings: { where: { status: "ATTENDED" }, select: { id: true } },
    },
  });

  const cells = new Map<string, AttendanceHeatmapCell>();
  for (const c of classes) {
    const wd = c.startsAt.getDay();
    const hr = c.startsAt.getHours();
    const k = `${wd}-${hr}`;
    const existing = cells.get(k) ?? {
      weekday: wd,
      hour: hr,
      classes: 0,
      attended: 0,
      capacity: 0,
    };
    existing.classes += 1;
    existing.attended += c.bookings.length;
    existing.capacity += c.capacity;
    cells.set(k, existing);
  }

  return Array.from(cells.values());
}

export type FrequentNoShow = {
  athleteId: string;
  athleteName: string;
  noShowCount: number;
  lastNoShowAt: Date | null;
};

export async function listFrequentNoShows(opts?: {
  windowDays?: number;
  threshold?: number;
}): Promise<FrequentNoShow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const windowDays = opts?.windowDays ?? 30;
  const threshold = opts?.threshold ?? 3;
  const cutoff = startOfDay(subDays(new Date(), windowDays));

  const noShows = await db.booking.findMany({
    where: {
      status: "NOSHOW",
      class: { startsAt: { gte: cutoff } },
    },
    select: {
      athleteId: true,
      class: { select: { startsAt: true } },
      athlete: { select: { firstName: true, lastName: true } },
    },
  });

  const map = new Map<string, FrequentNoShow>();
  for (const ns of noShows) {
    const existing = map.get(ns.athleteId);
    const startsAt = ns.class.startsAt;
    if (existing) {
      existing.noShowCount += 1;
      if (
        existing.lastNoShowAt === null ||
        startsAt.getTime() > existing.lastNoShowAt.getTime()
      ) {
        existing.lastNoShowAt = startsAt;
      }
    } else {
      map.set(ns.athleteId, {
        athleteId: ns.athleteId,
        athleteName: `${ns.athlete.firstName} ${ns.athlete.lastName}`,
        noShowCount: 1,
        lastNoShowAt: startsAt,
      });
    }
  }

  return Array.from(map.values())
    .filter((x) => x.noShowCount >= threshold)
    .sort((a, b) => b.noShowCount - a.noShowCount);
}

export async function getAthleteStreak(athleteId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const streak = await db.streak.findFirst({
    where: { athleteId, type: "ATTENDANCE" },
  });
  return streak?.count ?? 0;
}
