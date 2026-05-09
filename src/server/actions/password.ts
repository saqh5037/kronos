"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import { logAudit } from "../audit";
import { hashPassword } from "../auth-password";
import { setPasswordSchema } from "@/lib/validations/password";

export type PasswordResult =
  | { ok: true }
  | {
      ok: false;
      error: "UNAUTHENTICATED" | "VALIDATION" | "NOT_SET";
      message: string;
      fieldErrors?: Record<string, string>;
    };

export async function setPassword(input: {
  password: string;
  confirm: string;
}): Promise<PasswordResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "UNAUTHENTICATED",
      message: "Iniciá sesión primero",
    };
  }

  const parsed = setPasswordSchema.safeParse(input);
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
      error: "VALIDATION",
      message: "Revisá los campos del formulario",
      fieldErrors,
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();

  await rawDb.user.update({
    where: { id: session.user.id },
    data: { passwordHash, passwordSetAt: now },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "PASSWORD_SET",
    targetType: "User",
    targetId: session.user.id,
  });

  return { ok: true };
}

export async function clearPassword(): Promise<PasswordResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return {
      ok: false,
      error: "UNAUTHENTICATED",
      message: "Iniciá sesión primero",
    };
  }

  const user = await rawDb.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  if (!user?.passwordHash) {
    return {
      ok: false,
      error: "NOT_SET",
      message: "No tenés contraseña configurada",
    };
  }

  await rawDb.user.update({
    where: { id: session.user.id },
    data: { passwordHash: null, passwordSetAt: null },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "PASSWORD_CLEARED",
    targetType: "User",
    targetId: session.user.id,
  });

  return { ok: true };
}

export async function getPasswordStatus(): Promise<{ hasPassword: boolean }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { hasPassword: false };

  const user = await rawDb.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });
  return { hasPassword: Boolean(user?.passwordHash) };
}
