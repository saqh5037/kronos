"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import { logAudit } from "../audit";
import { sendEmail } from "@/lib/email";
import { buildInvitationExpiry } from "@/lib/staff-invitation";
import { buildInvitationToken } from "../invitation-token";
import { renderStaffInvitationEmail } from "../email-templates/staff-invitation";
import {
  onboardingPlanSchema,
  onboardingInviteSchema,
  type OnboardingPlanInput,
  type OnboardingInviteInput,
} from "@/lib/validations/onboarding";
import { UnauthorizedError, DBError } from "@/lib/errors";

async function requireOwner() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UnauthorizedError();
  if (session.user.role !== "OWNER") {
    throw new UnauthorizedError(
      "Forbidden: solo OWNER puede ejecutar onboarding",
    );
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

  let result;
  try {
    result = await Promise.all([
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
  } catch (e) {
    throw new DBError(e, "getOnboardingStatus: prisma queries failed");
  }
  const [box, plan, staffCount] = result;

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
  const session = await getServerSession(authOptions);
  const actorId = session?.user?.id;
  if (!actorId) throw new Error("Unauthorized");

  const valid: OnboardingInviteInput[] = [];
  for (const item of items) {
    const parsed = onboardingInviteSchema.safeParse(item);
    if (parsed.success) valid.push(parsed.data);
  }
  if (valid.length === 0) {
    return { ok: true, created: 0, skipped: [] };
  }

  const emails = valid.map((v) => v.email);
  const now = new Date();

  const [existingUsers, existingInvites, box] = await Promise.all([
    prismaBase.user.findMany({
      where: { email: { in: emails } },
      select: { email: true },
    }),
    prismaBase.staffInvitation.findMany({
      where: {
        tenantId,
        email: { in: emails },
        acceptedAt: null,
        revokedAt: null,
      },
      select: { email: true, expiresAt: true },
    }),
    prismaBase.box.findUnique({
      where: { id: tenantId },
      select: { name: true },
    }),
  ]);

  const taken = new Set(existingUsers.map((u) => u.email));
  const pendingByEmail = new Set(
    existingInvites
      .filter((i) => i.expiresAt.getTime() > now.getTime())
      .map((i) => i.email),
  );

  const skipped: { email: string; reason: string }[] = [];
  const toCreate: OnboardingInviteInput[] = [];
  for (const item of valid) {
    if (taken.has(item.email)) {
      skipped.push({ email: item.email, reason: "Email ya registrado" });
      continue;
    }
    if (pendingByEmail.has(item.email)) {
      skipped.push({ email: item.email, reason: "Invitación pendiente" });
      continue;
    }
    toCreate.push(item);
  }

  if (toCreate.length === 0) {
    return { ok: true, created: 0, skipped };
  }

  const expiresAt = buildInvitationExpiry();
  const created = await prismaBase.$transaction(
    toCreate.map((item) =>
      prismaBase.staffInvitation.create({
        data: {
          tenantId,
          email: item.email,
          name: item.name,
          role: item.role,
          token: buildInvitationToken(),
          expiresAt,
          createdById: actorId,
        },
        select: { id: true, email: true, name: true, role: true, token: true },
      }),
    ),
  );

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";

  await Promise.all(
    created.map((inv) =>
      sendEmail({
        to: [inv.email],
        subject: `Te invitamos a sumarte como ${inv.role === "COACH" ? "coach" : "staff"} en ${box?.name ?? "tu Box"}`,
        html: renderStaffInvitationEmail({
          boxName: box?.name ?? "tu Box",
          name: inv.name,
          role: inv.role as "COACH" | "STAFF",
          link: `${baseUrl}/invitacion-staff/${inv.token}`,
        }),
      }),
    ),
  );

  for (const inv of created) {
    await logAudit({
      tenantId,
      actorId,
      action: "BOOKING_CREATED",
      targetType: "StaffInvitation",
      targetId: inv.id,
      metadata: {
        kind: "STAFF_INVITATION_SENT",
        email: inv.email,
        role: inv.role,
      },
    });
  }

  revalidatePath("/admin/onboarding");
  revalidatePath("/admin/ajustes");

  return { ok: true, created: created.length, skipped };
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
