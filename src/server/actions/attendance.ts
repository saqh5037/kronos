"use server";

import { revalidatePath } from "next/cache";
import { requireCachedSession } from "@/server/session";
import { withTenant, db as rawDb } from "../db";
import { computeAttendanceStreak } from "@/lib/streak";
import { eachDayInRange, dayKey } from "@/lib/dates";
import { subDays, startOfDay } from "date-fns";
import { Prisma } from "@prisma/client";

async function requireSession() {
  return requireCachedSession();
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
    },
  });

  const classIds = classes.map((c) => c.id);

  const bookingCounts = await rawDb.booking.groupBy({
    by: ["classId", "status"],
    where: {
      tenantId: session.user.tenantId,
      classId: { in: classIds },
    },
    _count: { id: true },
  });

  const countMap = new Map<
    string,
    { booked: number; attended: number; noShow: number }
  >();
  for (const bc of bookingCounts) {
    const existing = countMap.get(bc.classId) ?? {
      booked: 0,
      attended: 0,
      noShow: 0,
    };
    if (bc.status === "BOOKED" || bc.status === "ATTENDED") {
      existing.booked += bc._count.id;
    }
    if (bc.status === "ATTENDED") {
      existing.attended += bc._count.id;
    }
    if (bc.status === "NOSHOW") {
      existing.noShow += bc._count.id;
    }
    countMap.set(bc.classId, existing);
  }

  return classes.map((c) => {
    const counts = countMap.get(c.id) ?? { booked: 0, attended: 0, noShow: 0 };
    return {
      id: c.id,
      startsAt: c.startsAt,
      capacity: c.capacity,
      bookedCount: counts.booked,
      attendedCount: counts.attended,
      noShowCount: counts.noShow,
      wodName: c.wod?.name ?? null,
      coachName: c.coach?.name ?? null,
    };
  });
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

  const classWhere: Record<string, unknown> = {
    tenantId: session.user.tenantId,
    isActive: true,
    startsAt: { gte: opts.dateFrom, lte: opts.dateTo },
  };
  if (opts.coachId) classWhere.coachId = opts.coachId;

  const coachClause = opts.coachId
    ? Prisma.sql`AND c.coach_id = ${opts.coachId}`
    : Prisma.sql``;

  const [classCapacities, bookingCounts] = await Promise.all([
    rawDb.class.findMany({
      where: classWhere,
      select: { startsAt: true, capacity: true },
    }),
    rawDb.$queryRaw<
      Array<{
        day: Date;
        attended: bigint;
        noShow: bigint;
        booked: bigint;
      }>
    >(Prisma.sql`
      SELECT
        DATE(c.starts_at) as day,
        COUNT(*) FILTER (WHERE b.status = 'ATTENDED') as attended,
        COUNT(*) FILTER (WHERE b.status = 'NOSHOW') as noShow,
        COUNT(*) FILTER (WHERE b.status = 'BOOKED') as booked
      FROM bookings b
      JOIN classes c ON b.class_id = c.id
      WHERE b.tenant_id = ${session.user.tenantId}
        AND c.is_active = true
        AND c.starts_at >= ${opts.dateFrom}
        AND c.starts_at <= ${opts.dateTo}
        ${coachClause}
      GROUP BY DATE(c.starts_at)
    `),
  ]);

  const capacityByDay = new Map<string, number>();
  for (const c of classCapacities) {
    const k = dayKey(c.startsAt);
    capacityByDay.set(k, (capacityByDay.get(k) ?? 0) + c.capacity);
  }

  const bookingByDay = new Map<
    string,
    { attended: number; noShow: number; booked: number }
  >();
  for (const b of bookingCounts) {
    const k = dayKey(b.day);
    bookingByDay.set(k, {
      attended: Number(b.attended),
      noShow: Number(b.noShow),
      booked: Number(b.booked),
    });
  }

  return eachDayInRange({ from: opts.dateFrom, to: opts.dateTo }).map((d) => {
    const k = dayKey(d);
    const counts = bookingByDay.get(k) ?? {
      attended: 0,
      noShow: 0,
      booked: 0,
    };
    return {
      day: k,
      attended: counts.attended,
      noShow: counts.noShow,
      booked: counts.booked,
      capacity: capacityByDay.get(k) ?? 0,
    };
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
  const windowDays = opts?.windowDays ?? 30;
  const threshold = opts?.threshold ?? 3;
  const cutoff = startOfDay(subDays(new Date(), windowDays));

  const results = await rawDb.$queryRaw<
    Array<{
      athlete_id: string;
      no_show_count: bigint;
      last_no_show_at: Date;
      first_name: string;
      last_name: string;
    }>
  >`
    SELECT
      b.athlete_id,
      COUNT(*) as no_show_count,
      MAX(b.booked_at) as last_no_show_at,
      a.first_name,
      a.last_name
    FROM bookings b
    JOIN athletes a ON b.athlete_id = a.id
    WHERE b.tenant_id = ${session.user.tenantId}
      AND b.status = 'NOSHOW'
      AND b.class_id IN (
        SELECT id FROM classes
        WHERE tenant_id = ${session.user.tenantId}
          AND starts_at >= ${cutoff}
      )
    GROUP BY b.athlete_id, a.first_name, a.last_name
    HAVING COUNT(*) >= ${threshold}
    ORDER BY no_show_count DESC
  `;

  return results.map((r) => ({
    athleteId: r.athlete_id,
    athleteName: `${r.first_name} ${r.last_name}`,
    noShowCount: Number(r.no_show_count),
    lastNoShowAt: r.last_no_show_at,
  }));
}

export async function getAthleteStreak(athleteId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const streak = await db.streak.findFirst({
    where: { athleteId, type: "ATTENDANCE" },
  });
  return streak?.count ?? 0;
}
