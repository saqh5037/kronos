"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import { athleteSchema } from "@/lib/validations/athlete";
import { revalidatePath } from "next/cache";
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import type { AthleteStatus } from "@prisma/client";
import { eachDayInRange, dayKey } from "@/lib/dates";
import { subDays, startOfDay } from "date-fns";

export async function listAthletes() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);
  return db.athlete.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      status: true,
      phone: true,
      createdAt: true,
    },
  });
}

export type AthleteSort =
  | "name"
  | "createdAt"
  | "lastAttendanceAt"
  | "totalScores";

export type AthleteRow = {
  id: string;
  firstName: string;
  lastName: string;
  status: AthleteStatus;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  lastAttendanceAt: Date | null;
  totalScores: number;
  activePlanName: string | null;
};

export async function listAthletesPaged(
  opts?: ListOpts<AthleteSort>,
): Promise<ListResult<AthleteRow>> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);
  const { page, pageSize, skip, take } = normalizePagination(opts);

  const search = opts?.search?.trim();
  const where = {
    ...(opts?.status ? { status: opts.status as AthleteStatus } : {}),
    ...(opts?.dateFrom || opts?.dateTo
      ? {
          createdAt: {
            ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
            ...(opts.dateTo ? { lte: opts.dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" as const } },
            { lastName: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search } },
            {
              user: {
                email: { contains: search, mode: "insensitive" as const },
              },
            },
          ],
        }
      : {}),
  };

  const sortBy = opts?.sortBy ?? "createdAt";
  const sortDir = opts?.sortDir ?? "desc";

  const orderBy =
    sortBy === "name"
      ? [{ firstName: sortDir }, { lastName: sortDir }]
      : sortBy === "createdAt"
        ? { createdAt: sortDir }
        : { createdAt: sortDir };

  const [total, athletes] = await Promise.all([
    db.athlete.count({ where }),
    db.athlete.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        user: { select: { email: true } },
        bookings: {
          where: { status: "ATTENDED" },
          orderBy: { checkedInAt: "desc" },
          take: 1,
          select: { checkedInAt: true },
        },
        memberships: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { plan: { select: { name: true } } },
        },
        _count: { select: { scores: true } },
      },
    }),
  ]);

  const rows: AthleteRow[] = athletes.map((a) => ({
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    status: a.status,
    phone: a.phone,
    email: a.user?.email ?? null,
    createdAt: a.createdAt,
    lastAttendanceAt: a.bookings[0]?.checkedInAt ?? null,
    totalScores: a._count.scores,
    activePlanName: a.memberships[0]?.plan.name ?? null,
  }));

  return { rows, total, page, pageSize };
}

export type AthleteGrowthPoint = { day: string; total: number; new: number };

/**
 * Daily cumulative + new athletes for a date range.
 */
export async function getAthleteGrowthByDay(opts: {
  dateFrom: Date;
  dateTo: Date;
}): Promise<AthleteGrowthPoint[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);

  const [totalBefore, inRange] = await Promise.all([
    db.athlete.count({ where: { createdAt: { lt: opts.dateFrom } } }),
    db.athlete.findMany({
      where: { createdAt: { gte: opts.dateFrom, lte: opts.dateTo } },
      select: { createdAt: true },
    }),
  ]);

  const newByDay = new Map<string, number>();
  for (const a of inRange) {
    const k = dayKey(a.createdAt);
    newByDay.set(k, (newByDay.get(k) ?? 0) + 1);
  }

  let runningTotal = totalBefore;
  return eachDayInRange({ from: opts.dateFrom, to: opts.dateTo }).map((d) => {
    const k = dayKey(d);
    const newCount = newByDay.get(k) ?? 0;
    runningTotal += newCount;
    return { day: k, total: runningTotal, new: newCount };
  });
}

export type AtRiskAthlete = {
  id: string;
  firstName: string;
  lastName: string;
  daysSinceLastAttendance: number | null;
  hasOverdueMembership: boolean;
};

/**
 * Atletas ACTIVE sin asistencia en N días o con membresía vencida.
 */
export async function getAtRiskAthletes(opts?: {
  inactivityDays?: number;
  limit?: number;
}): Promise<AtRiskAthlete[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const db = withTenant(session.user.tenantId);

  const inactivityDays = opts?.inactivityDays ?? 14;
  const limit = opts?.limit ?? 50;
  const cutoff = startOfDay(subDays(new Date(), inactivityDays));
  const now = new Date();

  const athletes = await db.athlete.findMany({
    where: { status: "ACTIVE" },
    include: {
      bookings: {
        where: { status: "ATTENDED" },
        orderBy: { checkedInAt: "desc" },
        take: 1,
        select: { checkedInAt: true },
      },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { endDate: true },
      },
    },
    take: limit * 4,
  });

  const out: AtRiskAthlete[] = [];
  for (const a of athletes) {
    const last = a.bookings[0]?.checkedInAt ?? null;
    const daysSince = last
      ? Math.floor((now.getTime() - last.getTime()) / 86400000)
      : null;
    const overdue = a.memberships[0]?.endDate
      ? a.memberships[0].endDate.getTime() < now.getTime()
      : false;

    const isAtRisk =
      (last === null && a.createdAt.getTime() < cutoff.getTime()) ||
      (last !== null && last.getTime() < cutoff.getTime()) ||
      overdue;

    if (isAtRisk) {
      out.push({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        daysSinceLastAttendance: daysSince,
        hasOverdueMembership: overdue,
      });
    }
    if (out.length >= limit) break;
  }

  out.sort((x, y) => {
    const xd = x.daysSinceLastAttendance ?? 9999;
    const yd = y.daysSinceLastAttendance ?? 9999;
    return yd - xd;
  });

  return out;
}

export async function createAthlete(data: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const parsed = athleteSchema.parse(data);
  const db = withTenant(session.user.tenantId);

  // tenantId is explicitly passed — withTenant also injects it at query level
  const athlete = await db.athlete.create({
    data: { ...parsed, tenantId: session.user.tenantId },
  });
  revalidatePath("/admin/atletas");
  return athlete;
}
