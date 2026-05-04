"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { membershipAssignSchema } from "@/lib/validations/membership";
import type { MembershipStatus, PlanType } from "@/lib/validations/membership";
import { computeMembershipEndDate, classesRemaining } from "@/lib/membership";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type MembershipRow = {
  id: string;
  athleteId: string;
  athleteName: string;
  planId: string;
  planName: string;
  planType: PlanType;
  startDate: Date;
  endDate: Date | null;
  status: MembershipStatus;
  autoRenew: boolean;
  amountPaid: number;
  classesUsed: number;
  classesRemaining: number | null;
};

export async function listMemberships(opts?: {
  status?: MembershipStatus;
  athleteId?: string;
}): Promise<MembershipRow[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const memberships = await db.membership.findMany({
    where: {
      ...(opts?.status ? { status: opts.status } : {}),
      ...(opts?.athleteId ? { athleteId: opts.athleteId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
      plan: true,
      payments: { where: { status: "PAID" }, select: { amount: true } },
    },
  });

  // Class counts per membership — count attended bookings within range
  const out: MembershipRow[] = [];
  for (const m of memberships) {
    const periodStart = m.startDate;
    const periodEnd = m.endDate ?? new Date();
    const attendedCount = await db.booking.count({
      where: {
        athleteId: m.athleteId,
        status: "ATTENDED",
        class: { startsAt: { gte: periodStart, lte: periodEnd } },
      },
    });

    const remaining = classesRemaining(
      {
        type: m.plan.type as PlanType,
        classesPerMonth: m.plan.classesPerMonth,
        durationDays: m.plan.durationDays,
      },
      attendedCount,
    );

    const amountPaid = m.payments.reduce((acc, p) => acc + Number(p.amount), 0);

    out.push({
      id: m.id,
      athleteId: m.athleteId,
      athleteName: `${m.athlete.firstName} ${m.athlete.lastName}`,
      planId: m.planId,
      planName: m.plan.name,
      planType: m.plan.type as PlanType,
      startDate: m.startDate,
      endDate: m.endDate,
      status: m.status as MembershipStatus,
      autoRenew: m.autoRenew,
      amountPaid,
      classesUsed: attendedCount,
      classesRemaining: remaining,
    });
  }

  return out;
}

export async function assignMembership(data: unknown) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = membershipAssignSchema.parse(data);
  const db = withTenant(tenantId);

  const plan = await db.membershipPlan.findUnique({
    where: { id: parsed.planId },
  });
  if (!plan) throw new Error("Plan no encontrado");
  if (!plan.isActive) throw new Error("El plan está archivado");

  const endDate = computeMembershipEndDate(parsed.startDate, {
    type: plan.type as PlanType,
    classesPerMonth: plan.classesPerMonth,
    durationDays: plan.durationDays,
  });

  const membership = await rawDb.membership.create({
    data: {
      tenantId,
      athleteId: parsed.athleteId,
      planId: parsed.planId,
      startDate: parsed.startDate,
      endDate,
      status: parsed.pendingPayment ? "PENDING" : "ACTIVE",
      autoRenew: parsed.autoRenew,
    },
  });

  // If pendingPayment, create a Payment row in PENDING for MP gateway with plan price.
  if (parsed.pendingPayment) {
    await rawDb.payment.create({
      data: {
        tenantId,
        membershipId: membership.id,
        amount: plan.price,
        currency: plan.currency,
        gateway: "MERCADOPAGO",
        status: "PENDING",
      },
    });
  }

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "MEMBERSHIP_ASSIGNED",
    targetType: "Membership",
    targetId: membership.id,
    metadata: {
      athleteId: parsed.athleteId,
      planId: parsed.planId,
      planType: plan.type,
    },
  });

  await trackEvent("membership_assigned", {
    tenantId,
    actorId: session.user.id,
    membershipId: membership.id,
    planType: plan.type,
    planPrice: Number(plan.price),
  });

  revalidatePath("/admin/pagos");
  revalidatePath("/admin/atletas");
  return membership;
}

export async function pauseMembership(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.membership.update({
    where: { id },
    data: { status: "PAUSED" },
  });
  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "MEMBERSHIP_PAUSED",
    targetType: "Membership",
    targetId: id,
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function resumeMembership(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.membership.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function cancelMembership(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.membership.update({
    where: { id },
    data: { status: "CANCELLED", autoRenew: false },
  });
  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "MEMBERSHIP_CANCELLED",
    targetType: "Membership",
    targetId: id,
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}
