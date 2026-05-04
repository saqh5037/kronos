"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { membershipPlanSchema } from "@/lib/validations/membership";
import type { PlanType } from "@/lib/validations/membership";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type PlanRow = {
  id: string;
  name: string;
  type: PlanType;
  price: number;
  currency: string;
  classesPerMonth: number | null;
  durationDays: number | null;
  isActive: boolean;
  activeMembershipCount: number;
};

export async function listPlans(opts?: {
  includeArchived?: boolean;
}): Promise<PlanRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const plans = await db.membershipPlan.findMany({
    where: opts?.includeArchived ? {} : { isActive: true },
    orderBy: [{ isActive: "desc" }, { price: "asc" }],
    include: {
      _count: {
        select: { memberships: { where: { status: "ACTIVE" } } },
      },
    },
  });

  return plans.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type as PlanType,
    price: Number(p.price),
    currency: p.currency,
    classesPerMonth: p.classesPerMonth,
    durationDays: p.durationDays,
    isActive: p.isActive,
    activeMembershipCount: p._count.memberships,
  }));
}

export async function createPlan(data: unknown) {
  const session = await requireSession();
  const parsed = membershipPlanSchema.parse(data);
  await rawDb.membershipPlan.create({
    data: { tenantId: session.user.tenantId, ...parsed },
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function archivePlan(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.membershipPlan.update({
    where: { id },
    data: { isActive: false },
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}

export async function reactivatePlan(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.membershipPlan.update({
    where: { id },
    data: { isActive: true },
  });
  revalidatePath("/admin/pagos");
  return { ok: true };
}
