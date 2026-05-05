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
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import { can, createGrantRequest } from "../permissions";
import type { PendingApprovalResult } from "./payments";

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

export type MembershipSort = "createdAt" | "startDate" | "endDate";

export async function listMembershipsPaged(
  opts?: ListOpts<MembershipSort> & { planId?: string },
): Promise<ListResult<MembershipRow>> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);
  const { page, pageSize, skip, take } = normalizePagination(opts);

  const search = opts?.search?.trim();
  const where = {
    ...(opts?.status ? { status: opts.status as MembershipStatus } : {}),
    ...(opts?.planId ? { planId: opts.planId } : {}),
    ...(opts?.dateFrom || opts?.dateTo
      ? {
          startDate: {
            ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
            ...(opts.dateTo ? { lte: opts.dateTo } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          athlete: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  const sortBy = opts?.sortBy ?? "createdAt";
  const sortDir = opts?.sortDir ?? "desc";

  const [total, memberships] = await Promise.all([
    db.membership.count({ where }),
    db.membership.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take,
      include: {
        athlete: { select: { id: true, firstName: true, lastName: true } },
        plan: true,
        payments: { where: { status: "PAID" }, select: { amount: true } },
      },
    }),
  ]);

  const rows: MembershipRow[] = [];
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

    rows.push({
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

  return { rows, total, page, pageSize };
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

export async function cancelMembership(
  id: string,
): Promise<{ ok: true } | PendingApprovalResult> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;

  // RBAC gate — APPLY_DISCOUNT maps to membership cancel (sensitive operation)
  // Using a direct role check: only OWNER or COACH with permission
  const perm = await can("REFUND_PAYMENT", session); // reuse sensitive gate
  if (perm.requiresApproval) {
    const requestId = await createGrantRequest({
      tenantId,
      requesterId: session.user.id,
      action: "REFUND_PAYMENT",
      targetType: "Membership",
      targetId: id,
      payload: { membershipId: id, operation: "cancel" },
    });
    return { status: "pending_approval", requestId };
  }

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
