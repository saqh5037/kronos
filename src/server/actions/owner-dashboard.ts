"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import {
  computeAthletesAtRisk,
  computeMonthlyRevenue,
  getNextBillingDate,
  type AthleteAtRiskRow,
} from "../owner-digest/compute";
import { db as prismaBase } from "../db";

export type OwnerDashboardSnapshot = {
  athletesAtRisk: AthleteAtRiskRow[];
  nextBilling: {
    date: Date;
    planName: string;
    amountMxnCents: number;
  } | null;
  monthlyRevenueCents: number;
  monthlyInvoiceCount: number;
};

export async function getOwnerDashboardSnapshot(): Promise<OwnerDashboardSnapshot | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;
  if (session.user.role !== "OWNER") return null;

  const tenantId = session.user.tenantId;
  const now = new Date();

  const [athletesAtRisk, revenue, nextBillingDate, currentSub] =
    await Promise.all([
      computeAthletesAtRisk(tenantId, 5, now),
      computeMonthlyRevenue(tenantId, now),
      getNextBillingDate(tenantId),
      prismaBase.saasSubscription.findFirst({
        where: { tenantId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: {
          plan: { select: { name: true, priceMxnCents: true } },
        },
      }),
    ]);

  return {
    athletesAtRisk,
    nextBilling:
      nextBillingDate && currentSub
        ? {
            date: nextBillingDate,
            planName: currentSub.plan.name,
            amountMxnCents: currentSub.plan.priceMxnCents,
          }
        : null,
    monthlyRevenueCents: revenue.amountCents,
    monthlyInvoiceCount: revenue.invoiceCount,
  };
}
