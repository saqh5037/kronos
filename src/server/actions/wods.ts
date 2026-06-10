"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { wodSchema } from "@/lib/validations/wod";
import type { WODType, ScoreType } from "@/lib/validations/wod";
import { invalidateTodayWod } from "@/server/cache";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type WODSummary = {
  id: string;
  name: string;
  type: WODType;
  scoreType: ScoreType;
  description: string | null;
  timeCap: number | null;
  movementCount: number;
  isActive: boolean;
  createdAt: Date;
};

export async function listWODs(opts?: {
  type?: WODType;
  search?: string;
}): Promise<WODSummary[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const wods = await db.wOD.findMany({
    where: {
      isActive: true,
      ...(opts?.type ? { type: opts.type } : {}),
      ...(opts?.search
        ? { name: { contains: opts.search, mode: "insensitive" } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      scoreType: true,
      description: true,
      timeCap: true,
      isActive: true,
      createdAt: true,
      _count: { select: { movements: true } },
    },
  });

  return wods.map((w) => ({
    id: w.id,
    name: w.name,
    type: w.type as WODType,
    scoreType: w.scoreType as ScoreType,
    description: w.description,
    timeCap: w.timeCap,
    movementCount: w._count.movements,
    isActive: w.isActive,
    createdAt: w.createdAt,
  }));
}

export async function getWOD(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.wOD.findUnique({
    where: { id },
    include: {
      movements: {
        orderBy: { order: "asc" },
        include: { movement: true },
      },
    },
  });
}

export async function createWOD(data: unknown) {
  const session = await requireSession();
  const parsed = wodSchema.parse(data);
  const tenantId = session.user.tenantId;

  const wod = await rawDb.wOD.create({
    data: {
      tenantId,
      name: parsed.name,
      type: parsed.type,
      scoreType: parsed.scoreType,
      description: parsed.description,
      timeCap: parsed.timeCap ?? null,
      movements: {
        create: parsed.movements.map((m, i) => ({
          movementId: m.movementId,
          reps: m.reps ?? null,
          weight: m.weight ?? null,
          notes: m.notes,
          order: m.order ?? i,
        })),
      },
    },
  });

  // Invalidate today's WOD cache — the new WOD might be scheduled for today.
  const todayKey = new Date().toISOString().slice(0, 10);
  invalidateTodayWod(tenantId, todayKey);
  revalidatePath("/admin/wods");
  return wod;
}

export async function archiveWOD(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  await db.wOD.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin/wods");
  return { ok: true };
}
