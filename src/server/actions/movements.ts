"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { movementSchema } from "@/lib/validations/movement";
import type { MovementCategory } from "@prisma/client";

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

export async function getMovementById(id: string): Promise<MovementRow | null> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.movement.findUnique({
    where: { id },
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

  revalidatePath("/admin/wods");
  return movement;
}
