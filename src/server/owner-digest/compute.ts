import { db as prismaBase } from "../db";
import type { Severity } from "@/lib/insights/detectors";
import { getBoxPeriodTimezone, getPeriodSummary } from "../period-summary";

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

/**
 * At-risk athletes for the digest and the owner/coach dashboards, from the
 * shared `AT_RISK_RULE` in `server/period-summary/rules`.
 *
 * This used to run `detectChurnRisk` — a multi-signal detector that weighed
 * attendance decline, PR staleness and cancellation ratio. It disagreed with
 * both of the other two at-risk numbers in the product: the audit found the
 * dashboard and Reportes printing 0 while /admin/atletas printed 3 and Pagos
 * printed 4 morosos (P0 #6, systemic issue S4). There is now exactly one rule,
 * and the digest reads it too, so an owner's Monday email and their dashboard
 * cannot open with two different numbers.
 *
 * `reasons` are the rule's own Spanish reason labels, which is what the email
 * template renders per athlete.
 *
 * The count is NOT this array's length: `limit` truncates it. Callers that
 * need the number read `getPeriodSummary(...).athletes.atRisk`.
 */
export async function computeAthletesAtRisk(
  tenantId: string,
  limit: number = 5,
  now: Date = new Date(),
): Promise<AthleteAtRiskRow[]> {
  const tz = await getBoxPeriodTimezone(tenantId);
  const summary = await getPeriodSummary(tenantId, {
    preset: "last30",
    tz,
    now,
  });

  return summary.athletes.atRiskRows.slice(0, limit).map((row) => ({
    athleteId: row.athleteId,
    name: row.name,
    severity: row.severity as Severity,
    reasons: row.reasonLabels,
  }));
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
