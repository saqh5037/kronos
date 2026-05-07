"use server";

import { z } from "zod";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import { logAudit } from "../audit";

export type BoxNotificationSettings = {
  weeklyDigestEnabled: boolean;
  transactionalEmailsEnabled: boolean;
};

const updateSchema = z.object({
  weeklyDigestEnabled: z.boolean(),
  transactionalEmailsEnabled: z.boolean(),
});

export async function getBoxNotifications(): Promise<BoxNotificationSettings | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return null;

  const box = await prismaBase.box.findUnique({
    where: { id: session.user.tenantId },
    select: {
      weeklyDigestEnabled: true,
      transactionalEmailsEnabled: true,
    },
  });
  if (!box) return null;
  return {
    weeklyDigestEnabled: box.weeklyDigestEnabled,
    transactionalEmailsEnabled: box.transactionalEmailsEnabled,
  };
}

export async function updateBoxNotifications(
  input: BoxNotificationSettings,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    return { ok: false, message: "Unauthorized" };
  }
  if (session.user.role !== "OWNER") {
    return {
      ok: false,
      message: "Solo OWNER puede ajustar notificaciones",
    };
  }

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Inputs inválidos" };
  }

  await prismaBase.box.update({
    where: { id: session.user.tenantId },
    data: {
      weeklyDigestEnabled: parsed.data.weeklyDigestEnabled,
      transactionalEmailsEnabled: parsed.data.transactionalEmailsEnabled,
    },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "USER_LOGIN",
    targetType: "Box",
    targetId: session.user.tenantId,
    metadata: {
      kind: "BOX_NOTIFICATIONS_UPDATED",
      weeklyDigestEnabled: parsed.data.weeklyDigestEnabled,
      transactionalEmailsEnabled: parsed.data.transactionalEmailsEnabled,
    },
  });

  revalidatePath("/admin/ajustes/notificaciones");
  return { ok: true };
}
