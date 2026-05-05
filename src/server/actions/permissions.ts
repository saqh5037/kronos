"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import type { PermissionAction, Role } from "@prisma/client";

async function requireOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden — OWNER only");
  return session;
}

export type PermissionRow = {
  id: string;
  action: PermissionAction;
  allowedRoles: Role[];
  requiresOwnerApproval: boolean;
  threshold: number | null;
  updatedAt: Date;
};

export async function listPermissions(): Promise<PermissionRow[]> {
  const session = await requireOwnerSession();
  const perms = await rawDb.permission.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { action: "asc" },
  });
  return perms.map((p) => ({
    id: p.id,
    action: p.action,
    allowedRoles: p.allowedRoles as Role[],
    requiresOwnerApproval: p.requiresOwnerApproval,
    threshold: p.threshold ? Number(p.threshold) : null,
    updatedAt: p.updatedAt,
  }));
}

export async function updatePermission(
  action: PermissionAction,
  allowedRoles: Role[],
  threshold: number | null,
  requiresOwnerApproval: boolean,
) {
  const session = await requireOwnerSession();
  const tenantId = session.user.tenantId;

  await rawDb.permission.upsert({
    where: { tenantId_action: { tenantId, action } },
    update: {
      allowedRoles,
      threshold: threshold ?? null,
      requiresOwnerApproval,
      updatedById: session.user.id,
    },
    create: {
      tenantId,
      action,
      allowedRoles,
      threshold: threshold ?? null,
      requiresOwnerApproval,
      updatedById: session.user.id,
    },
  });

  revalidatePath("/admin/ajustes/permisos");
  return { ok: true };
}
