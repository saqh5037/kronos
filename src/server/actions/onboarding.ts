"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import {
  onboardingPlanSchema,
  onboardingInviteSchema,
  type OnboardingPlanInput,
  type OnboardingInviteInput,
} from "@/lib/validations/onboarding";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede ejecutar onboarding");
  }
  return session.user.tenantId;
}

export type OnboardingStatus = {
  completedAt: Date | null;
  hasPlan: boolean;
  hasSchedule: boolean;
  staffCount: number;
};

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  const tenantId = await requireOwner();

  const [box, plan, staffCount] = await Promise.all([
    prismaBase.box.findUnique({
      where: { id: tenantId },
      select: { onboardingCompletedAt: true, weeklySchedule: true },
    }),
    prismaBase.membershipPlan.findFirst({
      where: { tenantId, isActive: true },
      select: { id: true },
    }),
    prismaBase.user.count({
      where: { tenantId, role: { in: ["COACH", "STAFF"] } },
    }),
  ]);

  return {
    completedAt: box?.onboardingCompletedAt ?? null,
    hasPlan: !!plan,
    hasSchedule: !!box?.weeklySchedule,
    staffCount,
  };
}

export type CreateFirstPlanResult =
  | { ok: true; planId: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export async function createFirstPlan(
  input: OnboardingPlanInput,
): Promise<CreateFirstPlanResult> {
  const tenantId = await requireOwner();

  const parsed = onboardingPlanSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path[0];
      if (typeof path === "string" && !fieldErrors[path]) {
        fieldErrors[path] = issue.message;
      }
    }
    return {
      ok: false,
      message: "Revisá los campos del plan",
      fieldErrors,
    };
  }

  const box = await prismaBase.box.findUnique({
    where: { id: tenantId },
    select: { currency: true },
  });
  if (!box) return { ok: false, message: "Box no encontrado" };

  const plan = await prismaBase.membershipPlan.create({
    data: {
      tenantId,
      name: parsed.data.name,
      type: parsed.data.type,
      price: parsed.data.price,
      currency: box.currency,
      classesPerMonth: parsed.data.classesPerMonth ?? null,
      durationDays: parsed.data.durationDays ?? null,
    },
    select: { id: true },
  });

  return { ok: true, planId: plan.id };
}

export type InviteStaffResult =
  | { ok: true; created: number; skipped: { email: string; reason: string }[] }
  | { ok: false; message: string };

export async function inviteStaff(
  items: OnboardingInviteInput[],
): Promise<InviteStaffResult> {
  const tenantId = await requireOwner();

  const valid: OnboardingInviteInput[] = [];
  for (const item of items) {
    const parsed = onboardingInviteSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  if (valid.length === 0) {
    return { ok: true, created: 0, skipped: [] };
  }

  const emails = valid.map((v) => v.email);
  const existing = await prismaBase.user.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const taken = new Set(existing.map((u) => u.email));

  const skipped: { email: string; reason: string }[] = [];
  const toCreate: OnboardingInviteInput[] = [];
  for (const item of valid) {
    if (taken.has(item.email)) {
      skipped.push({ email: item.email, reason: "Email ya registrado" });
    } else {
      toCreate.push(item);
    }
  }

  if (toCreate.length === 0) {
    return { ok: true, created: 0, skipped };
  }

  await prismaBase.user.createMany({
    data: toCreate.map((item) => ({
      email: item.email,
      name: item.name,
      role: item.role,
      tenantId,
    })),
  });

  return { ok: true, created: toCreate.length, skipped };
}

export async function completeOnboarding(): Promise<{ ok: true }> {
  const tenantId = await requireOwner();

  await prismaBase.box.update({
    where: { id: tenantId },
    data: { onboardingCompletedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/onboarding");
  return { ok: true };
}
