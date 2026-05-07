"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase, withTenant } from "../db";
import { logAudit } from "../audit";
import { sendEmail } from "@/lib/email";
import {
  buildInvitationExpiry,
  isInvitationActionable,
} from "@/lib/staff-invitation";
import {
  acceptStaffInvitationSchema,
  type AcceptStaffInvitationInput,
} from "@/lib/validations/staff-invitation";
import { renderStaffInvitationEmail } from "../email-templates/staff-invitation";

async function requireOwner(): Promise<{ tenantId: string; actorId: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede gestionar staff");
  }
  return { tenantId: session.user.tenantId, actorId: session.user.id };
}

export async function getStaffInvitationByToken(token: string) {
  if (!token) return null;
  const inv = await prismaBase.staffInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      tenantId: true,
      box: { select: { name: true, slug: true, brandColor: true } },
    },
  });
  return inv;
}

export type AcceptStaffInvitationResult =
  | {
      ok: true;
      email: string;
      role: "COACH" | "STAFF";
      boxSlug: string;
    }
  | {
      ok: false;
      reason: "NOT_FOUND" | "EXPIRED" | "ACCEPTED" | "REVOKED" | "VALIDATION";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function acceptStaffInvitation(
  input: AcceptStaffInvitationInput,
): Promise<AcceptStaffInvitationResult> {
  const parsed = acceptStaffInvitationSchema.safeParse(input);
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
      reason: "VALIDATION",
      message: "Revisá los campos",
      fieldErrors,
    };
  }

  const { token, name } = parsed.data;

  const inv = await prismaBase.staffInvitation.findUnique({
    where: { token },
    select: {
      id: true,
      tenantId: true,
      email: true,
      role: true,
      acceptedAt: true,
      revokedAt: true,
      expiresAt: true,
      box: { select: { slug: true } },
    },
  });
  if (!inv) {
    return {
      ok: false,
      reason: "NOT_FOUND",
      message: "Invitación no encontrada",
    };
  }

  const check = isInvitationActionable(inv);
  if (!check.ok) {
    return {
      ok: false,
      reason: check.reason,
      message:
        check.reason === "EXPIRED"
          ? "La invitación expiró"
          : check.reason === "ACCEPTED"
            ? "La invitación ya fue aceptada"
            : "La invitación fue revocada",
    };
  }

  const result = await prismaBase.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email: inv.email },
      select: { id: true, tenantId: true, role: true },
    });
    if (user && user.tenantId !== inv.tenantId) {
      throw new Error("Email registrado en otro Box");
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: inv.email,
          name,
          role: inv.role,
          tenantId: inv.tenantId,
        },
        select: { id: true, tenantId: true, role: true },
      });
    } else {
      user = await tx.user.update({
        where: { id: user.id },
        data: { name, role: inv.role },
        select: { id: true, tenantId: true, role: true },
      });
    }

    await tx.staffInvitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });

    return { userId: user.id };
  });

  await logAudit({
    tenantId: inv.tenantId,
    actorId: result.userId,
    action: "BOOKING_CREATED",
    targetType: "StaffInvitation",
    targetId: inv.id,
    metadata: {
      kind: "STAFF_INVITATION_ACCEPTED",
      email: inv.email,
      role: inv.role,
    },
  });

  revalidatePath("/admin/onboarding");

  return {
    ok: true,
    email: inv.email,
    role: inv.role as "COACH" | "STAFF",
    boxSlug: inv.box.slug,
  };
}

export type PendingStaffInvitationRow = {
  id: string;
  email: string;
  name: string | null;
  role: "COACH" | "STAFF";
  createdAt: Date;
  expiresAt: Date;
  status: "PENDING" | "EXPIRED";
};

export async function listPendingStaffInvitations(): Promise<
  PendingStaffInvitationRow[]
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");

  const db = withTenant(session.user.tenantId);
  const rows = await db.staffInvitation.findMany({
    where: { acceptedAt: null, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  const now = new Date();
  return rows.map((r) => ({
    ...r,
    role: r.role as "COACH" | "STAFF",
    status: (r.expiresAt.getTime() <= now.getTime() ? "EXPIRED" : "PENDING") as
      | "EXPIRED"
      | "PENDING",
  }));
}

export async function revokeStaffInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { tenantId, actorId } = await requireOwner();

  const inv = await prismaBase.staffInvitation.findUnique({
    where: { id },
    select: { tenantId: true, acceptedAt: true, revokedAt: true },
  });
  if (!inv || inv.tenantId !== tenantId) {
    return { ok: false, message: "Invitación no encontrada" };
  }
  if (inv.acceptedAt) {
    return { ok: false, message: "Ya aceptada" };
  }
  if (inv.revokedAt) {
    return { ok: true };
  }

  await prismaBase.staffInvitation.update({
    where: { id },
    data: { revokedAt: new Date() },
  });

  await logAudit({
    tenantId,
    actorId,
    action: "BOOKING_CANCELLED",
    targetType: "StaffInvitation",
    targetId: id,
    metadata: { kind: "STAFF_INVITATION_REVOKED" },
  });

  revalidatePath("/admin/onboarding");
  return { ok: true };
}

export async function resendStaffInvitation(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { tenantId } = await requireOwner();

  const inv = await prismaBase.staffInvitation.findUnique({
    where: { id },
    select: {
      tenantId: true,
      email: true,
      name: true,
      role: true,
      token: true,
      acceptedAt: true,
      revokedAt: true,
      box: { select: { name: true } },
    },
  });
  if (!inv || inv.tenantId !== tenantId) {
    return { ok: false, message: "Invitación no encontrada" };
  }
  if (inv.acceptedAt) return { ok: false, message: "Ya aceptada" };
  if (inv.revokedAt) return { ok: false, message: "Revocada" };

  const newExpiry = buildInvitationExpiry();
  await prismaBase.staffInvitation.update({
    where: { id },
    data: { expiresAt: newExpiry },
  });

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";

  await sendEmail({
    to: [inv.email],
    subject: `Recordatorio: invitación a ${inv.box.name} en Kronos`,
    html: renderStaffInvitationEmail({
      boxName: inv.box.name,
      name: inv.name,
      role: inv.role as "COACH" | "STAFF",
      link: `${baseUrl}/invitacion-staff/${inv.token}`,
    }),
  });

  revalidatePath("/admin/onboarding");
  return { ok: true };
}
