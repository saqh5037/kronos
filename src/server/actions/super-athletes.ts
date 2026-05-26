"use server";

import { db as prismaBase } from "@/server/db";
import { requireSuperAdmin } from "@/server/super-admin-guard";
import { normalizePagination } from "./types";
import type { ListOpts, ListResult } from "./types";
import type { AthleteSort, AthleteDetail } from "./athletes";
import type { AthleteStatus } from "@prisma/client";
import { startOfDay, subDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SuperAthleteRow = {
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
  boxId: string;
  boxName: string;
  boxSlug: string;
};

export type BoxFilterItem = {
  id: string;
  name: string;
};

// ─── listAllAthletesCrossTenant ───────────────────────────────────────────────

/**
 * Cross-tenant athlete listing for super-admin.
 * Uses prismaBase directly — no tenant filter unless boxId is provided.
 */
export async function listAllAthletesCrossTenant(
  opts?: ListOpts<AthleteSort> & { boxId?: string | null },
): Promise<ListResult<SuperAthleteRow>> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return { rows: [], total: 0, page: 1, pageSize: 25 };

  const { page, pageSize, skip, take } = normalizePagination(opts);
  const search = opts?.search?.trim();

  const where = {
    ...(opts?.boxId ? { tenantId: opts.boxId } : {}),
    ...(opts?.status ? { status: opts.status as AthleteStatus } : {}),
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
      ? [
          { firstName: sortDir as "asc" | "desc" },
          { lastName: sortDir as "asc" | "desc" },
        ]
      : { createdAt: sortDir as "asc" | "desc" };

  const [total, athletes] = await Promise.all([
    prismaBase.athlete.count({ where }),
    prismaBase.athlete.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        user: { select: { email: true } },
        box: { select: { id: true, name: true, slug: true } },
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

  const rows: SuperAthleteRow[] = athletes.map((a) => ({
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
    boxId: a.box.id,
    boxName: a.box.name,
    boxSlug: a.box.slug,
  }));

  return { rows, total, page, pageSize };
}

// ─── getSuperAthleteDetail ────────────────────────────────────────────────────

/**
 * Read-only athlete detail for super-admin drawer.
 * Clones the select shape of getAthleteDetail but uses prismaBase (cross-tenant).
 */
export async function getSuperAthleteDetail(
  athleteId: string,
): Promise<AthleteDetail | null> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return null;

  const ninetyDaysAgo = startOfDay(subDays(new Date(), 90));
  const now = new Date();

  const athlete = await prismaBase.athlete.findUnique({
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
    prismaBase.payment.findMany({
      where: { membership: { athleteId: athlete.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prismaBase.booking.findFirst({
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
    prismaBase.bodyMetric.findMany({
      where: { athleteId: athlete.id },
      orderBy: { measuredAt: "desc" },
      take: 30,
    }),
  ]);

  const activeMembership = athlete.memberships[0]
    ? {
        id: athlete.memberships[0].id,
        planName: athlete.memberships[0].plan.name,
        planType: athlete.memberships[0].plan.type,
        startDate: athlete.memberships[0].startDate,
        endDate: athlete.memberships[0].endDate,
        classesUsed: await prismaBase.booking.count({
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
        }),
      }
    : null;

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
          bookingId: nextBooking.id,
          classId: nextBooking.class.id,
          startsAt: nextBooking.class.startsAt,
          wodName: nextBooking.class.wod?.name ?? null,
        }
      : null,
    bodyMetricsRecent: bodyMetricRows.map((r) => ({
      id: r.id,
      type: r.type,
      label: r.label,
      value: Number(r.value),
      unit: r.unit,
      measuredAt: r.measuredAt,
    })),
  };
}

// ─── listAllBoxesForFilter ────────────────────────────────────────────────────

/**
 * Minimal box list for the "filter by box" SelectFilter.
 * Returns {id, name} sorted by name.
 */
export async function listAllBoxesForFilter(): Promise<BoxFilterItem[]> {
  const gate = await requireSuperAdmin();
  if (gate !== true) return [];

  const boxes = await prismaBase.box.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return boxes;
}
