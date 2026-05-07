import { db as prismaBase } from "../db";
import {
  detectChurnRisk,
  type ChurnDetection,
  type Severity,
} from "@/lib/insights/detectors";

const RISK_WINDOW_DAYS = 30;
const PR_LOOKBACK_DAYS = 180;

export type AthleteAtRiskRow = {
  athleteId: string;
  name: string;
  severity: Severity;
  reasons: string[];
};

export type OwnerDigestData = {
  boxName: string;
  ownerName: string | null;
  ownerEmail: string;
  monthlyRevenueCents: number;
  invoiceCount: number;
  activeAthletesCount: number;
  activeAthletesDelta: number;
  bookingsLastWeek: number;
  athletesAtRisk: AthleteAtRiskRow[];
  nextBillingDate: Date | null;
};

export async function computeMonthlyRevenue(
  tenantId: string,
  now: Date = new Date(),
): Promise<{ amountCents: number; invoiceCount: number }> {
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const invoices = await prismaBase.saasInvoice.findMany({
    where: {
      tenantId,
      paidAt: { gte: monthAgo },
      status: "PAID",
    },
    select: { amountMxnCents: true },
  });

  const amountCents = invoices.reduce((sum, i) => sum + i.amountMxnCents, 0);
  return { amountCents, invoiceCount: invoices.length };
}

export async function computeActiveAthletes(
  tenantId: string,
  now: Date = new Date(),
): Promise<{ current: number; delta: number }> {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [current, weekAgoCount] = await Promise.all([
    prismaBase.athlete.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prismaBase.athlete.count({
      where: {
        tenantId,
        status: "ACTIVE",
        createdAt: { lt: weekAgo },
      },
    }),
  ]);

  return { current, delta: current - weekAgoCount };
}

export async function computeBookingsLastWeek(
  tenantId: string,
  now: Date = new Date(),
): Promise<number> {
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  return prismaBase.booking.count({
    where: {
      tenantId,
      class: { startsAt: { gte: weekAgo, lte: now } },
      status: { not: "CANCELLED" },
    },
  });
}

export async function computeAthletesAtRisk(
  tenantId: string,
  limit: number = 5,
  now: Date = new Date(),
): Promise<AthleteAtRiskRow[]> {
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - RISK_WINDOW_DAYS);
  const prevWindowStart = new Date(windowStart);
  prevWindowStart.setDate(prevWindowStart.getDate() - RISK_WINDOW_DAYS);
  const prLookback = new Date(now);
  prLookback.setDate(prLookback.getDate() - PR_LOOKBACK_DAYS);

  const athletes = await prismaBase.athlete.findMany({
    where: { tenantId, status: "ACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bookings: {
        where: { class: { startsAt: { gte: prevWindowStart } } },
        select: {
          status: true,
          checkedInAt: true,
          class: { select: { startsAt: true } },
        },
      },
      prs: {
        orderBy: { achievedAt: "desc" },
        take: 1,
        select: { achievedAt: true },
      },
    },
  });

  const atRisk: AthleteAtRiskRow[] = [];

  for (const a of athletes) {
    let currentAttended = 0;
    let currentTotal = 0;
    let prevAttended = 0;
    let prevTotal = 0;
    let lastAttendedAt: Date | null = null;
    let recentCancellations = 0;
    let recentBookings = 0;

    for (const b of a.bookings) {
      const t = b.class.startsAt;
      const inCurrent = t >= windowStart;
      const counted = b.status !== "CANCELLED";
      const attended = b.status === "ATTENDED";
      if (inCurrent) {
        if (counted) currentTotal += 1;
        if (attended) currentAttended += 1;
        recentBookings += 1;
        if (b.status === "CANCELLED") recentCancellations += 1;
        if (attended && b.checkedInAt) {
          if (!lastAttendedAt || b.checkedInAt > lastAttendedAt) {
            lastAttendedAt = b.checkedInAt;
          }
        }
      } else {
        if (counted) prevTotal += 1;
        if (attended) prevAttended += 1;
      }
    }

    const currentRate = currentTotal === 0 ? 0 : currentAttended / currentTotal;
    const previousRate = prevTotal === 0 ? 0 : prevAttended / prevTotal;
    const attendanceDeltaPct = currentRate - previousRate;

    const daysSinceLastAttended = lastAttendedAt
      ? Math.floor((now.getTime() - lastAttendedAt.getTime()) / 86400000)
      : null;

    const lastPRAt = a.prs[0]?.achievedAt ?? null;
    const daysSinceLastPR = lastPRAt
      ? Math.floor((now.getTime() - lastPRAt.getTime()) / 86400000)
      : null;

    const cancelRatio =
      recentBookings > 0 ? recentCancellations / recentBookings : 0;

    const detection: ChurnDetection = detectChurnRisk({
      daysSinceLastAttended,
      attendanceDeltaPct,
      daysSinceLastPR,
      recentCancellationsRatio: cancelRatio,
    });

    if (detection.atRisk) {
      atRisk.push({
        athleteId: a.id,
        name: `${a.firstName} ${a.lastName}`,
        severity: detection.severity,
        reasons: detection.reasons,
      });
    }
  }

  const severityRank: Record<Severity, number> = { high: 3, med: 2, low: 1 };
  atRisk.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  return atRisk.slice(0, limit);
}

export async function getNextBillingDate(
  tenantId: string,
): Promise<Date | null> {
  const sub = await prismaBase.saasSubscription.findFirst({
    where: { tenantId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { currentPeriodEnd: true },
  });
  return sub?.currentPeriodEnd ?? null;
}

export async function getLastDigestSentAt(
  tenantId: string,
): Promise<Date | null> {
  const audit = await prismaBase.auditEvent.findFirst({
    where: {
      tenantId,
      targetType: "Box",
      metadata: { path: ["kind"], equals: "EMAIL_SENT_OWNER_DIGEST" },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return audit?.createdAt ?? null;
}

export async function buildDigestData(
  tenantId: string,
  now: Date = new Date(),
): Promise<OwnerDigestData | null> {
  const owner = await prismaBase.user.findFirst({
    where: { tenantId, role: "OWNER" },
    select: { email: true, name: true, box: { select: { name: true } } },
  });
  if (!owner) return null;

  const [revenue, athletes, bookingsLastWeek, athletesAtRisk, nextBilling] =
    await Promise.all([
      computeMonthlyRevenue(tenantId, now),
      computeActiveAthletes(tenantId, now),
      computeBookingsLastWeek(tenantId, now),
      computeAthletesAtRisk(tenantId, 5, now),
      getNextBillingDate(tenantId),
    ]);

  return {
    boxName: owner.box?.name ?? "tu Box",
    ownerName: owner.name,
    ownerEmail: owner.email,
    monthlyRevenueCents: revenue.amountCents,
    invoiceCount: revenue.invoiceCount,
    activeAthletesCount: athletes.current,
    activeAthletesDelta: athletes.delta,
    bookingsLastWeek,
    athletesAtRisk,
    nextBillingDate: nextBilling,
  };
}
