"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { invalidateMovementCatalog } from "@/server/cache";
import {
  movementSchema,
  cuesSchema,
  cuesArraySchema,
  progressionsArraySchema,
  musclesSchema,
  difficultySchema,
  isAllowedVideoUrl,
  type Cues,
  type CommonMistake,
  type Progression,
} from "@/lib/validations/movement";
import { z } from "zod";
import type { MovementCategory, MovementContentSource } from "@prisma/client";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type MovementRow = {
  id: string;
  slug: string;
  name: string;
  category: MovementCategory;
  isStandard: boolean;
  videoUrl: string | null;
  standardDescription: string | null;
  equipment: string[];
};

export type MovementDetail = MovementRow & {
  videoUrlCues: string | null;
  cues: Cues | null;
  commonMistakes: CommonMistake[] | null;
  progressions: Progression[] | null;
  musclesWorked: string[];
  difficulty: number | null;
  contentSource: MovementContentSource;
  contentGeneratedAt: Date | null;
};

const movementDetailSelect = {
  id: true,
  slug: true,
  name: true,
  category: true,
  isStandard: true,
  videoUrl: true,
  videoUrlCues: true,
  standardDescription: true,
  equipment: true,
  cues: true,
  commonMistakes: true,
  progressions: true,
  musclesWorked: true,
  difficulty: true,
  contentSource: true,
  contentGeneratedAt: true,
} as const;

export async function listMovements(opts?: {
  category?: MovementCategory;
  search?: string;
}): Promise<MovementRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.movement.findMany({
    where: {
      ...(opts?.search
        ? { name: { contains: opts.search, mode: "insensitive" } }
        : {}),
      ...(opts?.category ? { category: opts.category } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      isStandard: true,
      videoUrl: true,
      standardDescription: true,
      equipment: true,
    },
  });
}

export async function getMovementById(
  id: string,
): Promise<MovementDetail | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const row = await db.movement.findUnique({
    where: { id },
    select: movementDetailSelect,
  });
  if (!row) return null;
  return {
    ...row,
    cues: parseCues(row.cues),
    commonMistakes: parseCommonMistakes(row.commonMistakes),
    progressions: parseProgressions(row.progressions),
  };
}

function parseCues(raw: unknown): Cues | null {
  if (raw == null) return null;
  const r = cuesSchema.safeParse(raw);
  return r.success ? r.data : null;
}

function parseCommonMistakes(raw: unknown): CommonMistake[] | null {
  if (raw == null) return null;
  const r = cuesArraySchema.safeParse(raw);
  return r.success ? (r.data ?? null) : null;
}

function parseProgressions(raw: unknown): Progression[] | null {
  if (raw == null) return null;
  const r = progressionsArraySchema.safeParse(raw);
  return r.success ? (r.data ?? null) : null;
}

const movementUpdateSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    videoUrl: z
      .string()
      .nullable()
      .refine((v) => v == null || isAllowedVideoUrl(v), {
        message: "Solo URLs de YouTube o Vimeo",
      })
      .optional(),
    videoUrlCues: z
      .string()
      .nullable()
      .refine((v) => v == null || isAllowedVideoUrl(v), {
        message: "Solo URLs de YouTube o Vimeo",
      })
      .optional(),
    standardDescription: z.string().max(1000).nullable().optional(),
    equipment: z.array(z.string().max(40)).optional(),
    cues: cuesSchema.nullable().optional(),
    commonMistakes: cuesArraySchema.nullable(),
    progressions: progressionsArraySchema.nullable(),
    musclesWorked: musclesSchema,
    difficulty: difficultySchema.nullable(),
  })
  .strict();

export async function updateMovement(
  id: string,
  data: unknown,
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Solo coaches/owners pueden editar movimientos");
  }

  const mv = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!mv) throw new Error("Movimiento no encontrado");

  const parsed = movementUpdateSchema.parse(data);

  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed)) {
    if (v === undefined) continue;
    if (
      v === null &&
      (k === "cues" || k === "commonMistakes" || k === "progressions")
    ) {
      updateData[k] = { set: null };
      continue;
    }
    updateData[k] = v;
  }

  await rawDb.movement.update({
    where: { id },
    // Cast: dynamic shape; validated by Zod above.
    data: updateData as never,
  });
  invalidateMovementCatalog(session.user.tenantId);
  revalidatePath("/admin/movimientos");
  revalidatePath(`/admin/movimientos/${id}`);
  revalidatePath("/atleta/movimientos");
  revalidatePath(`/atleta/movimientos/${id}`);
  return { ok: true };
}

export async function getMovementBySlug(
  slug: string,
): Promise<MovementRow | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.movement.findUnique({
    where: { tenantId_slug: { tenantId: session.user.tenantId, slug } },
    select: {
      id: true,
      slug: true,
      name: true,
      category: true,
      isStandard: true,
      videoUrl: true,
      standardDescription: true,
      equipment: true,
    },
  });
}

export async function updateMovementVideoUrl(
  id: string,
  videoUrl: string,
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  // Verify belongs to this tenant
  const mv = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!mv) throw new Error("Movimiento no encontrado");

  await rawDb.movement.update({
    where: { id },
    data: { videoUrl },
  });
  invalidateMovementCatalog(session.user.tenantId);
  revalidatePath("/admin/movimientos");
  revalidatePath("/atleta/movimientos");
  return { ok: true };
}

export async function restoreStandardMovement(
  id: string,
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const mv = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId, isStandard: true },
  });
  if (!mv) throw new Error("Movimiento estándar no encontrado");

  // Restore the standard videoUrl from the STANDARD_MOVEMENTS catalog
  const { STANDARD_MOVEMENTS } = await import("../../../prisma/seed-movements");
  const standard = STANDARD_MOVEMENTS.find((s) => s.slug === mv.slug);
  if (!standard) throw new Error("Movimiento no encontrado en catálogo");

  await rawDb.movement.update({
    where: { id },
    data: { videoUrl: standard.videoUrl },
  });
  invalidateMovementCatalog(session.user.tenantId);
  revalidatePath("/admin/movimientos");
  revalidatePath("/atleta/movimientos");
  return { ok: true };
}

export async function createMovement(data: unknown) {
  const session = await requireSession();
  const parsed = movementSchema.parse(data);

  const slug = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const movement = await rawDb.movement.create({
    data: {
      tenantId: session.user.tenantId,
      slug,
      name: parsed.name,
      videoUrl: parsed.videoUrl,
      standardDescription: parsed.standardDescription,
      equipment: parsed.equipment,
    },
  });

  invalidateMovementCatalog(session.user.tenantId);
  revalidatePath("/admin/wods");
  return movement;
}
