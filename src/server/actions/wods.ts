"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { wodSchema } from "@/lib/validations/wod";
import type { WODType, ScoreType } from "@/lib/validations/wod";
import { normalizeWODMovements } from "@/lib/wod-helpers";

export { normalizeWODMovements };

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

export type WODSummaryWithMovements = WODSummary & {
  existingMovements: {
    movementId: string;
    reps: number | null;
    weight: number | null;
    notes: string | null;
    order: number;
  }[];
};

export async function listWODsWithMovements(opts?: {
  type?: WODType;
  search?: string;
}): Promise<WODSummaryWithMovements[]> {
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
    include: {
      movements: {
        orderBy: { order: "asc" },
        select: {
          movementId: true,
          reps: true,
          weight: true,
          notes: true,
          order: true,
        },
      },
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
    existingMovements: w.movements.map((m) => ({
      movementId: m.movementId,
      reps: m.reps,
      weight: m.weight ? Number(m.weight) : null,
      notes: m.notes,
      order: m.order,
    })),
  }));
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

/**
 * Updates an existing WOD including its nested movements.
 *
 * Strategy for movements: DELETE all existing WODMovement rows for this wod,
 * then INSERT the new ordered list. This sidesteps the @@unique([wodId, movementId])
 * constraint that would block upsert when the same movement appears after a reorder.
 *
 * Uses rawDb.$transaction with explicit tenantId because withTenant() does NOT
 * extend $transaction (see bug.kronos.withtenant_no_createmany pattern).
 * Ownership guard: the initial findUnique check uses withTenant to verify the WOD
 * belongs to this tenant before entering the transaction.
 */
export async function updateWOD(
  wodId: string,
  data: unknown,
): Promise<{ ok: true }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const parsed = wodSchema.parse(data);

  // Ownership guard — withTenant scopes this to the tenant
  const db = withTenant(tenantId);
  const existing = await db.wOD.findUnique({ where: { id: wodId } });
  if (!existing) throw new Error("WOD not found");

  const normalizedMovements = normalizeWODMovements(parsed.movements);

  await rawDb.$transaction([
    // 1. Update scalar fields
    rawDb.wOD.update({
      where: { id: wodId, tenantId },
      data: {
        name: parsed.name,
        type: parsed.type,
        scoreType: parsed.scoreType,
        description: parsed.description ?? null,
        timeCap: parsed.timeCap ?? null,
      },
    }),
    // 2. Replace movement rows atomically (avoids unique constraint conflicts on reorder)
    rawDb.wODMovement.deleteMany({ where: { wodId } }),
    rawDb.wODMovement.createMany({
      data: normalizedMovements.map((m) => ({
        wodId,
        movementId: m.movementId,
        reps: m.reps,
        weight: m.weight,
        notes: m.notes,
        order: m.order,
      })),
    }),
  ]);

  revalidatePath("/admin/wods");
  return { ok: true };
}
