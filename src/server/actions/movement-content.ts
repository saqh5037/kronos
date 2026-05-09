"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { generateMovementContent } from "../ai/movement-content";
import { rateLimit } from "@/lib/rate-limit";
import { getMovementById, type MovementDetail } from "./movements";
import {
  cuesSchema,
  cuesArraySchema,
  progressionsArraySchema,
  musclesSchema,
  difficultySchema,
} from "@/lib/validations/movement";
import { z } from "zod";

const RATE_LIMIT_PER_TENANT_PER_DAY = 50;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type MovementContentResult =
  | { ok: true; movement: MovementDetail; generated: boolean }
  | { ok: false; reason: "rate_limited" | "ai_failed" | "not_found" };

/**
 * Lee Movement detail. Si no tiene contenido (contentSource = EMPTY),
 * dispara generación AI on-demand y la persiste en BD.
 *
 * Self-healing: si la generación falla, retorna el detail sin contenido
 * (la UI puede mostrar fallback) en vez de tirar.
 */
export async function getOrGenerateMovementContent(
  id: string,
): Promise<MovementContentResult> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const existing = await db.movement.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
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
    },
  });

  if (!existing) return { ok: false, reason: "not_found" };

  // Already has content (seed or AI or manual) — just return.
  if (existing.contentSource !== "EMPTY") {
    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: false };
  }

  // Empty — try to generate.
  const rl = rateLimit(
    `movement-content:${session.user.tenantId}`,
    RATE_LIMIT_PER_TENANT_PER_DAY,
    ONE_DAY_MS,
  );

  if (!rl.ok) {
    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: false };
  }

  try {
    const content = await generateMovementContent({
      name: existing.name,
      category: existing.category,
      equipment: existing.equipment,
    });

    await rawDb.movement.update({
      where: { id },
      data: {
        // Cast: Json fields use dynamic shape validated by Zod in AI module.
        cues: content.cues as never,
        commonMistakes: content.commonMistakes as never,
        progressions: content.progressions as never,
        musclesWorked:
          content.musclesWorked.length > 0 ? content.musclesWorked : undefined,
        difficulty: content.difficulty ?? undefined,
        videoUrl: existing.videoUrl ?? content.videoUrl ?? undefined,
        contentSource: "AI_GENERATED",
        contentGeneratedAt: new Date(),
      },
    });

    revalidatePath(`/atleta/movimientos/${id}`);
    revalidatePath(`/admin/movimientos/${id}`);

    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: true };
  } catch (err) {
    console.error("[movement-content] AI generation failed:", err);
    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: false };
  }
}

/**
 * Admin only: aplica override manual de contenido. El admin pasa los JSON
 * blobs de cues / commonMistakes / progressions y se guardan tal cual,
 * marcando contentSource=MANUAL_OVERRIDE. Validados con Zod.
 */
const overrideSchema = z.object({
  cues: cuesSchema.nullable().optional(),
  commonMistakes: cuesArraySchema.nullable(),
  progressions: progressionsArraySchema.nullable(),
  musclesWorked: musclesSchema,
  difficulty: difficultySchema.nullable(),
});

export async function applyManualOverride(
  id: string,
  data: unknown,
): Promise<MovementContentResult> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH") {
    throw new Error("Solo owner/coach pueden aplicar override manual");
  }

  const existing = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!existing) return { ok: false, reason: "not_found" };

  const parsed = overrideSchema.parse(data);

  const updateData: Record<string, unknown> = {
    contentSource: "MANUAL_OVERRIDE",
    contentGeneratedAt: new Date(),
  };
  if (parsed.cues !== undefined) {
    updateData.cues = parsed.cues === null ? { set: null } : parsed.cues;
  }
  if (parsed.commonMistakes !== undefined) {
    updateData.commonMistakes =
      parsed.commonMistakes === null ? { set: null } : parsed.commonMistakes;
  }
  if (parsed.progressions !== undefined) {
    updateData.progressions =
      parsed.progressions === null ? { set: null } : parsed.progressions;
  }
  if (parsed.musclesWorked !== undefined) {
    updateData.musclesWorked = parsed.musclesWorked;
  }
  if (parsed.difficulty !== undefined) {
    updateData.difficulty = parsed.difficulty;
  }

  await rawDb.movement.update({
    where: { id },
    data: updateData as never,
  });

  revalidatePath(`/atleta/movimientos/${id}`);
  revalidatePath(`/admin/movimientos/${id}`);
  revalidatePath("/admin/movimientos");

  const detail = await getMovementById(id);
  if (!detail) return { ok: false, reason: "not_found" };
  return { ok: true, movement: detail, generated: false };
}

/**
 * Admin only: regenera SOLO las progressions vía AI sin tocar cues ni
 * commonMistakes. Útil cuando un movement tiene contenido manual/seed bueno
 * pero el árbol de progresiones está vacío o desactualizado.
 *
 * No respeta rate limit (admin sabe lo que hace). No bloquea si
 * MANUAL_OVERRIDE — solo escribe progressions, deja contentSource intacto.
 */
export async function regenerateProgressionsOnly(
  id: string,
): Promise<MovementContentResult> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH") {
    throw new Error("Solo owner/coach pueden regenerar progresiones");
  }

  const existing = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!existing) return { ok: false, reason: "not_found" };

  try {
    const content = await generateMovementContent({
      name: existing.name,
      category: existing.category,
      equipment: existing.equipment,
    });

    await rawDb.movement.update({
      where: { id },
      data: {
        progressions: content.progressions as never,
      },
    });

    revalidatePath(`/atleta/movimientos/${id}`);
    revalidatePath(`/admin/movimientos/${id}`);

    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: true };
  } catch (err) {
    console.error("[movement-content] regenerate progressions failed:", err);
    return { ok: false, reason: "ai_failed" };
  }
}

/**
 * Admin only: fuerza regeneración del contenido AI. No respeta rate limit
 * (admin sabe lo que hace).
 */
export async function regenerateMovementContent(
  id: string,
): Promise<MovementContentResult> {
  const session = await requireSession();
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH") {
    throw new Error("Solo owner/coach pueden regenerar contenido");
  }

  const existing = await rawDb.movement.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!existing) return { ok: false, reason: "not_found" };

  if (existing.contentSource === "MANUAL_OVERRIDE") {
    throw new Error(
      "Este movement tiene override manual. Editá manualmente o quitá el override antes de regenerar.",
    );
  }

  try {
    const content = await generateMovementContent({
      name: existing.name,
      category: existing.category,
      equipment: existing.equipment,
    });

    await rawDb.movement.update({
      where: { id },
      data: {
        cues: content.cues as never,
        commonMistakes: content.commonMistakes as never,
        progressions: content.progressions as never,
        musclesWorked:
          content.musclesWorked.length > 0 ? content.musclesWorked : undefined,
        difficulty: content.difficulty ?? undefined,
        videoUrl: content.videoUrl ?? existing.videoUrl,
        contentSource: "AI_GENERATED",
        contentGeneratedAt: new Date(),
      },
    });

    revalidatePath(`/atleta/movimientos/${id}`);
    revalidatePath(`/admin/movimientos/${id}`);

    const detail = await getMovementById(id);
    if (!detail) return { ok: false, reason: "not_found" };
    return { ok: true, movement: detail, generated: true };
  } catch (err) {
    console.error("[movement-content] regenerate failed:", err);
    return { ok: false, reason: "ai_failed" };
  }
}
