/**
 * The SQL/Prisma building blocks behind `getPeriodSummary`.
 *
 * Two jobs:
 *
 * 1. **One `where` builder per list.** `buildPaymentsWhere` is used by BOTH
 *    `listPaymentsPaged` (the Pagos table) and the period summary (the Pagos
 *    KPI). They cannot drift apart any more: the audit's "27 (KPI) vs 33
 *    (table) under the same filter" came from the KPI counting only PAID rows
 *    by `paidAt` while the table counted every row by `createdAt`.
 *
 * 2. **Timezone-aware day buckets.** Both day series bucket by the civil day
 *    in the BOX timezone (`("col" AT TIME ZONE 'UTC') AT TIME ZONE $tz`).
 *    Columns are `timestamp without time zone` holding UTC instants, and the
 *    Postgres session runs in UTC, so the double cast is the correct
 *    conversion. `DATE(col)` — what the old queries used — buckets in the
 *    server timezone and moved evening CDMX classes to the next day.
 *
 * Multi-tenancy: `$queryRaw`, `aggregate` and `groupBy` are NOT covered by the
 * `withTenant` Prisma extension, so every raw statement here filters
 * `"tenantId" = $tenantId` explicitly and every helper takes `tenantId` as a
 * required argument.
 */

import { Prisma } from "@prisma/client";
import { db as rawDb } from "../db";
import type { Period } from "./period";
import { DEFAULT_TIMEZONE, eachDayKeyInPeriod } from "./period";

export type PaymentStatusLike = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type PaymentGatewayLike = "MERCADOPAGO" | "STRIPE" | "CASH";

/** The filter surface the Pagos screen exposes, minus pagination and sort. */
export type PaymentsFilter = {
  status?: PaymentStatusLike;
  gateway?: PaymentGatewayLike;
  /** Free-text search over the athlete's first/last name. */
  search?: string;
};

/**
 * The single `where` used by the Pagos table AND the Pagos KPIs.
 *
 * Date basis is `createdAt`: "cuántos pagos hubo en el rango" must include the
 * PENDING and FAILED rows the table shows, and those have no `paidAt`.
 * Revenue is a different question and uses `paidAt` (see `paidRevenueWhere`).
 */
export function buildPaymentsWhere(input: {
  /** Both bounds optional so an unbounded list keeps working. */
  period: { from?: Date | null; to?: Date | null };
  filter?: PaymentsFilter;
}): Prisma.PaymentWhereInput {
  const search = input.filter?.search?.trim();
  const { from, to } = input.period;
  return {
    ...(input.filter?.status ? { status: input.filter.status } : {}),
    ...(input.filter?.gateway ? { gateway: input.filter.gateway } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          membership: {
            athlete: {
              OR: [
                {
                  firstName: { contains: search, mode: "insensitive" as const },
                },
                {
                  lastName: { contains: search, mode: "insensitive" as const },
                },
              ],
            },
          },
        }
      : {}),
  };
}

/**
 * Revenue recognition: a payment counts toward a period when it was PAID and
 * `paidAt` falls inside it. This is the ONLY definition of revenue; Pagos and
 * Reportes both read it, which is what makes $138,750 and $214,000 collapse
 * into one number for one period.
 */
export function paidRevenueWhere(
  period: Pick<Period, "from" | "to">,
): Prisma.PaymentWhereInput {
  return { status: "PAID", paidAt: { gte: period.from, lte: period.to } };
}

function tzExpr(column: Prisma.Sql, tz: string): Prisma.Sql {
  return Prisma.sql`to_char((${column} AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD')`;
}

export type RawDayBucket = { day: string; revenue: number; count: number };

/**
 * PAID revenue and payment count per civil day, bucketed in the box timezone.
 * Returns only the days that have rows; the caller pads the full period.
 */
export async function queryPaidRevenueBuckets(
  tenantId: string,
  period: Period,
): Promise<RawDayBucket[]> {
  const tz = period.tz || DEFAULT_TIMEZONE;
  const rows = await rawDb.$queryRaw<
    Array<{ day: string; revenue: number | null; count: number }>
  >(Prisma.sql`
    SELECT
      ${tzExpr(Prisma.sql`"paidAt"`, tz)} AS day,
      COALESCE(SUM(amount), 0)::float8 AS revenue,
      COUNT(*)::int AS count
    FROM "Payment"
    WHERE "tenantId" = ${tenantId}
      AND status = 'PAID'
      AND "paidAt" IS NOT NULL
      AND "paidAt" >= ${period.from}
      AND "paidAt" <= ${period.to}
    GROUP BY 1
  `);
  return rows.map((r) => ({
    day: r.day,
    revenue: Number(r.revenue ?? 0),
    count: Number(r.count),
  }));
}

export type RawAttendanceBucket = {
  day: string;
  attended: number;
  noShow: number;
  booked: number;
};

/**
 * Booking outcomes per civil day for classes that START inside the period.
 *
 * `booked` keeps its historical meaning — bookings still in `BOOKED` (i.e.
 * reserved and not yet resolved) — because `/admin/asistencia` renders it as
 * "Reservadas". Seats taken is `attended + noShow + booked` and is exposed as
 * `seats` by the summary.
 */
export async function queryAttendanceBuckets(
  tenantId: string,
  period: Period,
  coachId?: string,
): Promise<RawAttendanceBucket[]> {
  const tz = period.tz || DEFAULT_TIMEZONE;
  const coachClause = coachId
    ? Prisma.sql`AND c."coachId" = ${coachId}`
    : Prisma.sql``;

  const rows = await rawDb.$queryRaw<
    Array<{
      day: string;
      attended: number;
      noShow: number;
      booked: number;
    }>
  >(Prisma.sql`
    SELECT
      ${tzExpr(Prisma.sql`c."startsAt"`, tz)} AS day,
      COUNT(*) FILTER (WHERE b.status = 'ATTENDED')::int AS attended,
      COUNT(*) FILTER (WHERE b.status = 'NOSHOW')::int AS "noShow",
      COUNT(*) FILTER (WHERE b.status = 'BOOKED')::int AS booked
    FROM "Booking" b
    JOIN "Class" c ON b."classId" = c.id
    WHERE b."tenantId" = ${tenantId}
      AND c."isActive" = true
      AND c."startsAt" >= ${period.from}
      AND c."startsAt" <= ${period.to}
      ${coachClause}
    GROUP BY 1
  `);

  return rows.map((r) => ({
    day: r.day,
    attended: Number(r.attended),
    noShow: Number(r.noShow),
    booked: Number(r.booked),
  }));
}

export type RawCapacityBucket = {
  day: string;
  capacity: number;
  classes: number;
};

/** Offered capacity and class count per civil day, in the box timezone. */
export async function queryCapacityBuckets(
  tenantId: string,
  period: Period,
  coachId?: string,
): Promise<RawCapacityBucket[]> {
  const tz = period.tz || DEFAULT_TIMEZONE;
  const coachClause = coachId
    ? Prisma.sql`AND "coachId" = ${coachId}`
    : Prisma.sql``;

  const rows = await rawDb.$queryRaw<
    Array<{ day: string; capacity: number; classes: number }>
  >(Prisma.sql`
    SELECT
      ${tzExpr(Prisma.sql`"startsAt"`, tz)} AS day,
      COALESCE(SUM(capacity), 0)::int AS capacity,
      COUNT(*)::int AS classes
    FROM "Class"
    WHERE "tenantId" = ${tenantId}
      AND "isActive" = true
      AND "startsAt" >= ${period.from}
      AND "startsAt" <= ${period.to}
      ${coachClause}
    GROUP BY 1
  `);

  return rows.map((r) => ({
    day: r.day,
    capacity: Number(r.capacity),
    classes: Number(r.classes),
  }));
}

export type AttendanceSeriesPoint = {
  day: string;
  attended: number;
  noShow: number;
  booked: number;
  seats: number;
  capacity: number;
  classes: number;
};

/**
 * Pads the sparse buckets into one entry per civil day of the period.
 *
 * This is the step the old code skipped: the chart was fed whatever days
 * had rows, so an empty September rendered April under a 30-day label.
 */
export function buildAttendanceSeries(
  period: Period,
  attendance: RawAttendanceBucket[],
  capacity: RawCapacityBucket[],
): AttendanceSeriesPoint[] {
  const byDay = new Map(attendance.map((b) => [b.day, b]));
  const capByDay = new Map(capacity.map((b) => [b.day, b]));
  return eachDayKeyInPeriod(period).map((day) => {
    const a = byDay.get(day);
    const c = capByDay.get(day);
    const attended = a?.attended ?? 0;
    const noShow = a?.noShow ?? 0;
    const booked = a?.booked ?? 0;
    return {
      day,
      attended,
      noShow,
      booked,
      seats: attended + noShow + booked,
      capacity: c?.capacity ?? 0,
      classes: c?.classes ?? 0,
    };
  });
}
