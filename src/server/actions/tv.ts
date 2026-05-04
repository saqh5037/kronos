"use server";

import { db as rawDb } from "../db";
import type { ScoreType, WODType } from "@/lib/validations/wod";

/**
 * TV display is a public, read-only mode meant to be left running on a
 * wall-mounted screen at the box. There's no session — auth is via the
 * box `slug` in the URL. Returns null when the slug doesn't exist.
 */

export type TVPRRow = {
  athleteName: string;
  movementName: string;
  value: number;
  unit: string;
  achievedAt: Date;
};

export type TVLeader = {
  athleteName: string;
  attendedCount: number;
};

export type TVData = {
  box: { name: string; brandColor: string | null };
  currentClass: TVClass | null;
  upcomingClasses: TVClass[];
  todaysWOD: TVWOD | null;
  weekLeaders: TVLeader[];
  recentPRs: TVPRRow[];
};

export type TVDisplay = TVData | null;

export type TVClass = {
  id: string;
  startsAt: Date;
  durationMin: number;
  capacity: number;
  bookedCount: number;
  attendedCount: number;
  coachName: string | null;
  wodName: string | null;
};

export type TVWOD = {
  name: string;
  type: WODType;
  scoreType: ScoreType;
  description: string | null;
  timeCap: number | null;
  movements: { name: string; reps: number | null; weight: number | null }[];
};

export async function getTVDisplay(slug: string): Promise<TVDisplay> {
  const box = await rawDb.box.findUnique({
    where: { slug },
    select: { id: true, name: true, brandColor: true },
  });
  if (!box) return null;

  const tenantId = box.id;
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  // Week range — Monday to Sunday
  const dow = now.getDay();
  const weekStart = new Date(startOfDay);
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [todayClasses, weekAttendance, recentPRs] = await Promise.all([
    rawDb.class.findMany({
      where: {
        tenantId,
        startsAt: { gte: startOfDay, lt: endOfDay },
        isActive: true,
      },
      orderBy: { startsAt: "asc" },
      include: {
        coach: { select: { name: true } },
        wod: {
          include: {
            movements: {
              orderBy: { order: "asc" },
              include: { movement: { select: { name: true } } },
            },
          },
        },
        bookings: { select: { status: true } },
      },
    }),
    rawDb.booking.findMany({
      where: {
        tenantId,
        status: "ATTENDED",
        class: { startsAt: { gte: weekStart, lt: weekEnd } },
      },
      include: {
        athlete: { select: { firstName: true, lastName: true } },
      },
    }),
    rawDb.pR.findMany({
      where: { tenantId },
      orderBy: { achievedAt: "desc" },
      take: 5,
      include: {
        athlete: { select: { firstName: true, lastName: true } },
        movement: { select: { name: true } },
      },
    }),
  ]);

  const mapClass = (c: (typeof todayClasses)[number]): TVClass => ({
    id: c.id,
    startsAt: c.startsAt,
    durationMin: c.durationMin,
    capacity: c.capacity,
    bookedCount: c.bookings.filter(
      (b) => b.status === "BOOKED" || b.status === "ATTENDED",
    ).length,
    attendedCount: c.bookings.filter((b) => b.status === "ATTENDED").length,
    coachName: c.coach?.name ?? null,
    wodName: c.wod?.name ?? null,
  });

  // Class is "current" if it started ≤30 min ago and hasn't finished + 15 min grace
  const current = todayClasses.find((c) => {
    const endTime = c.startsAt.getTime() + (c.durationMin + 15) * 60 * 1000;
    return c.startsAt.getTime() <= now.getTime() && now.getTime() <= endTime;
  });

  const upcoming = todayClasses
    .filter((c) => c.startsAt.getTime() > now.getTime())
    .slice(0, 3);

  // Today's WOD: current class's WOD if active, else next class's WOD
  const featuredClass = current ?? upcoming[0] ?? todayClasses[0];
  const todaysWOD: TVWOD | null = featuredClass?.wod
    ? {
        name: featuredClass.wod.name,
        type: featuredClass.wod.type as WODType,
        scoreType: featuredClass.wod.scoreType as ScoreType,
        description: featuredClass.wod.description,
        timeCap: featuredClass.wod.timeCap,
        movements: featuredClass.wod.movements.map((m) => ({
          name: m.movement.name,
          reps: m.reps,
          weight: m.weight ? Number(m.weight) : null,
        })),
      }
    : null;

  const weekCounts = new Map<string, { name: string; count: number }>();
  for (const b of weekAttendance) {
    const key = `${b.athlete.firstName} ${b.athlete.lastName}`;
    const existing = weekCounts.get(key);
    if (existing) existing.count++;
    else weekCounts.set(key, { name: key, count: 1 });
  }
  const weekLeaders = Array.from(weekCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((l) => ({ athleteName: l.name, attendedCount: l.count }));

  return {
    box: { name: box.name, brandColor: box.brandColor },
    currentClass: current ? mapClass(current) : null,
    upcomingClasses: upcoming.map(mapClass),
    todaysWOD,
    weekLeaders,
    recentPRs: recentPRs.map((p) => ({
      athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`,
      movementName: p.movement.name,
      value: Number(p.value),
      unit: p.unit,
      achievedAt: p.achievedAt,
    })),
  };
}
