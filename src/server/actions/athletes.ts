"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  athleteSchema,
  FITNESS_GOAL_TAGS,
  withFitnessGoalTags,
  readFitnessGoalTags,
  type FitnessGoalTag,
} from "@/lib/validations/athlete";
import { revalidatePath } from "next/cache";
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import type { AthleteStatus } from "@prisma/client";
import { eachDayInRange, dayKey } from "@/lib/dates";
import { subDays, startOfDay } from "date-fns";
import { buildAthleteOrderBy } from "@/lib/athlete-helpers";

export { buildAthleteOrderBy };

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

  const orderBy = buildAthleteOrderBy(sortBy, sortDir);

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

export type AthleteDetail = {
  id: string;
  firstName: string;
  lastName: string;
  status: AthleteStatus;
  phone: string | null;
  email: string | null;
  createdAt: Date;
  activeMembership: {
    id: string;
    planName: string;
    planType: string;
    startDate: Date;
    endDate: Date | null;
    classesUsed: number;
  } | null;
  attendanceLast90d: { date: Date }[];
  prsTop: {
    id: string;
    movementName: string;
    value: number;
    unit: string;
    achievedAt: Date;
  }[];
  paymentsRecent: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    gateway: string;
    paidAt: Date | null;
    createdAt: Date;
  }[];
  nextClass: {
    id: string;
    startsAt: Date;
    wodName: string | null;
  } | null;
  bodyMetricsRecent: {
    id: string;
    type: string;
    label: string | null;
    value: number;
    unit: string;
    measuredAt: Date;
  }[];
};

export async function getAthleteDetail(
  athleteId: string,
): Promise<AthleteDetail | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const db = withTenant(session.user.tenantId);

  const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
  const now = new Date();

  const athlete = await db.athlete.findUnique({
    where: { id: athleteId },
    include: {
      user: { select: { email: true } },
      memberships: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { plan: true },
      },
      bookings: {
        where: {
          status: "ATTENDED",
          checkedInAt: { gte: ninetyDaysAgo },
        },
        select: { checkedInAt: true },
      },
      prs: {
        orderBy: { achievedAt: "desc" },
        take: 8,
        include: { movement: { select: { name: true } } },
      },
    },
  });
  if (!athlete) return null;

  const [paymentsRecent, nextBooking, bodyMetricRows] = await Promise.all([
    db.payment.findMany({
      where: { membership: { athleteId: athlete.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    db.booking.findFirst({
      where: {
        athleteId: athlete.id,
        status: { in: ["BOOKED", "WAITLIST"] },
        class: { startsAt: { gte: now } },
      },
      orderBy: { class: { startsAt: "asc" } },
      include: {
        class: {
          select: {
            id: true,
            startsAt: true,
            wod: { select: { name: true } },
          },
        },
      },
    }),
    db.bodyMetric.findMany({
      where: { athleteId: athlete.id },
      orderBy: { measuredAt: "desc" },
      take: 30,
    }),
  ]);

  const bodyMetricsRecent = bodyMetricRows.map((r) => ({
    id: r.id,
    type: r.type,
    label: r.label,
    value: Number(r.value),
    unit: r.unit,
    measuredAt: r.measuredAt,
  }));

  const activeMembership = athlete.memberships[0]
    ? {
        id: athlete.memberships[0].id,
        planName: athlete.memberships[0].plan.name,
        planType: athlete.memberships[0].plan.type,
        startDate: athlete.memberships[0].startDate,
        endDate: athlete.memberships[0].endDate,
        classesUsed: 0,
      }
    : null;

  if (activeMembership) {
    activeMembership.classesUsed = await db.booking.count({
      where: {
        athleteId: athlete.id,
        status: "ATTENDED",
        class: {
          startsAt: {
            gte: athlete.memberships[0].startDate,
            lte: athlete.memberships[0].endDate ?? new Date(),
          },
        },
      },
    });
  }

  return {
    id: athlete.id,
    firstName: athlete.firstName,
    lastName: athlete.lastName,
    status: athlete.status,
    phone: athlete.phone,
    email: athlete.user?.email ?? null,
    createdAt: athlete.createdAt,
    activeMembership,
    attendanceLast90d: athlete.bookings
      .filter((b) => b.checkedInAt !== null)
      .map((b) => ({ date: b.checkedInAt as Date })),
    prsTop: athlete.prs.map((p) => ({
      id: p.id,
      movementName: p.movement.name,
      value: Number(p.value),
      unit: p.unit,
      achievedAt: p.achievedAt,
    })),
    paymentsRecent: paymentsRecent.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      currency: p.currency,
      status: p.status,
      gateway: p.gateway,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
    nextClass: nextBooking
      ? {
          id: nextBooking.class.id,
          startsAt: nextBooking.class.startsAt,
          wodName: nextBooking.class.wod?.name ?? null,
        }
      : null,
    bodyMetricsRecent,
  };
}

export async function updateAthleteStatus(
  athleteId: string,
  status: AthleteStatus,
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const db = withTenant(session.user.tenantId);
  await db.athlete.update({ where: { id: athleteId }, data: { status } });
  revalidatePath("/admin/atletas");
  return { ok: true };
}

/**
 * Persist the athlete's fitness motivation tags. Used by the signup goals
 * step and the perfil settings panel. Idempotent: replaces all `goal:*`
 * tags while preserving other tag prefixes (e.g. `level:*`).
 */
export async function setMyFitnessGoals(
  goals: FitnessGoalTag[],
): Promise<{ ok: true; tags: FitnessGoalTag[] }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  const allowed = new Set<string>(FITNESS_GOAL_TAGS);
  const cleaned = goals.filter((g): g is FitnessGoalTag => allowed.has(g));

  const db = withTenant(tenantId);
  const me = await db.athlete.findFirst({ where: { userId } });
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const next = withFitnessGoalTags(me.tags, cleaned);
  await db.athlete.update({ where: { id: me.id }, data: { tags: next } });

  revalidatePath("/atleta");
  revalidatePath("/atleta/perfil");
  return { ok: true, tags: cleaned };
}

export async function getMyFitnessGoals(): Promise<FitnessGoalTag[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return [];
  const db = withTenant(session.user.tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { tags: true },
  });
  if (!me) return [];
  return readFitnessGoalTags(me.tags);
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

/**
 * Updates an athlete's profile fields.
 * Email lives on the linked User, not on Athlete, so we do NOT update it here
 * (changing auth email requires a separate flow).
 * Ownership is enforced by withTenant scoping the update.
 */
export async function updateAthleteProfile(
  athleteId: string,
  data: unknown,
): Promise<{ ok: true }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const parsed = athleteSchema.parse(data);
  const db = withTenant(session.user.tenantId);

  // withTenant injects tenantId into the WHERE, guarding cross-tenant edits
  await db.athlete.update({
    where: { id: athleteId },
    data: {
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      dob: parsed.dob,
      healthHistory: parsed.healthHistory,
      emergencyContact: parsed.emergencyContact,
      notes: parsed.notes,
      tags: parsed.tags,
      status: parsed.status,
    },
  });

  revalidatePath("/admin/atletas");
  return { ok: true };
}
