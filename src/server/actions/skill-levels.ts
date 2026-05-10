"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  annotateProgressionTree,
  canAchieveNode,
  progressionToSlug,
  type AthleteLevel,
  type ProgressionNode,
} from "@/lib/skill-tree";
import type { Progression } from "@/lib/validations/movement";
import { runAchievementEvaluation } from "@/server/achievements/evaluate";

async function requireAthleteSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  // Find the Athlete row for this user.
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!athlete) throw new Error("Athlete profile not found");
  return { ...session, athleteId: athlete.id };
}

export type MovementSkillTree = {
  movementSlug: string;
  movementName: string;
  nodes: ProgressionNode[];
};

/**
 * Lee el árbol de progressions de un movement (por slug) anotado con el
 * estado del atleta logueado.
 */
export async function getMyMovementSkillTree(
  movementSlug: string,
): Promise<MovementSkillTree | null> {
  const session = await requireAthleteSession();
  const db = withTenant(session.user.tenantId);

  const movement = await db.movement.findUnique({
    where: {
      tenantId_slug: { tenantId: session.user.tenantId, slug: movementSlug },
    },
    select: {
      slug: true,
      name: true,
      progressions: true,
    },
  });

  if (!movement) return null;
  const progressions = movement.progressions as Progression[] | null;
  if (!progressions || progressions.length === 0) {
    return {
      movementSlug: movement.slug,
      movementName: movement.name,
      nodes: [],
    };
  }

  const levels = await rawDb.athleteSkillLevel.findMany({
    where: {
      tenantId: session.user.tenantId,
      athleteId: session.athleteId,
      movementSlug,
    },
    select: {
      progressionSlug: true,
      status: true,
      achievedAt: true,
    },
  });

  const athleteLevels: AthleteLevel[] = levels.map((l) => ({
    movementSlug,
    progressionSlug: l.progressionSlug,
    status: l.status,
    achievedAt: l.achievedAt,
  }));

  const nodes = annotateProgressionTree(
    progressions,
    athleteLevels,
    movementSlug,
  );

  return {
    movementSlug: movement.slug,
    movementName: movement.name,
    nodes,
  };
}

export type UnlockedBadgeRef = {
  code: string;
  name: string;
  description: string;
};

import {
  SKILL_PROGRESSION_XP,
  SKILL_XP_LEDGER_REASON,
  SKILL_XP_LEDGER_SOURCE_TYPE,
  buildSkillXPLedgerSourceId,
} from "@/lib/skills/xp";

export type MarkSkillLevelResult =
  | {
      ok: true;
      status: "CURRENT" | "ACHIEVED";
      xpAwarded: number;
      unlockedBadges: UnlockedBadgeRef[];
    }
  | { ok: false; reason: string };

/**
 * Marca un nodo como CURRENT o ACHIEVED. Valida prerequisitos antes de
 * permitir ACHIEVED — el nodo previo debe estar ACHIEVED.
 */
export async function markMyProgressionStatus(args: {
  movementSlug: string;
  progressionSlug: string;
  status: "CURRENT" | "ACHIEVED";
  notes?: string;
}): Promise<MarkSkillLevelResult> {
  const { movementSlug, progressionSlug, status, notes } = args;
  const session = await requireAthleteSession();
  const db = withTenant(session.user.tenantId);

  const movement = await db.movement.findUnique({
    where: {
      tenantId_slug: { tenantId: session.user.tenantId, slug: movementSlug },
    },
    select: { progressions: true },
  });
  if (!movement) return { ok: false, reason: "movement-not-found" };

  const progressions = movement.progressions as Progression[] | null;
  if (!progressions || progressions.length === 0) {
    return { ok: false, reason: "no-progressions" };
  }

  // Verify progressionSlug exists in this movement's tree
  const exists = progressions.some(
    (p) => progressionToSlug(p.name) === progressionSlug,
  );
  if (!exists) return { ok: false, reason: "progression-not-found" };

  if (status === "ACHIEVED") {
    const existingLevels = await rawDb.athleteSkillLevel.findMany({
      where: {
        tenantId: session.user.tenantId,
        athleteId: session.athleteId,
        movementSlug,
      },
    });
    const can = canAchieveNode({
      progressions,
      movementSlug,
      targetSlug: progressionSlug,
      athleteLevels: existingLevels.map((l) => ({
        movementSlug,
        progressionSlug: l.progressionSlug,
        status: l.status,
        achievedAt: l.achievedAt,
      })),
    });
    if (!can.ok) return { ok: false, reason: can.reason };
  }

  // Detect transition to ACHIEVED to award XP only once per progression.
  const previousLevel = await rawDb.athleteSkillLevel.findUnique({
    where: {
      athleteId_movementSlug_progressionSlug: {
        athleteId: session.athleteId,
        movementSlug,
        progressionSlug,
      },
    },
    select: { status: true },
  });
  const wasAchievedBefore = previousLevel?.status === "ACHIEVED";

  await rawDb.athleteSkillLevel.upsert({
    where: {
      athleteId_movementSlug_progressionSlug: {
        athleteId: session.athleteId,
        movementSlug,
        progressionSlug,
      },
    },
    update: {
      status,
      achievedAt: status === "ACHIEVED" ? new Date() : null,
      notes: notes ?? undefined,
    },
    create: {
      tenantId: session.user.tenantId,
      athleteId: session.athleteId,
      movementSlug,
      progressionSlug,
      status,
      achievedAt: status === "ACHIEVED" ? new Date() : null,
      notes: notes ?? undefined,
    },
  });

  // Award XP only on transition into ACHIEVED. Idempotent via XPLedger
  // @@unique([sourceType, sourceId, reason]).
  let xpAwarded = 0;
  if (status === "ACHIEVED" && !wasAchievedBefore) {
    try {
      await rawDb.xPLedger.create({
        data: {
          tenantId: session.user.tenantId,
          athleteId: session.athleteId,
          amount: SKILL_PROGRESSION_XP,
          reason: SKILL_XP_LEDGER_REASON,
          sourceType: SKILL_XP_LEDGER_SOURCE_TYPE,
          sourceId: buildSkillXPLedgerSourceId(movementSlug, progressionSlug),
        },
      });
      xpAwarded = SKILL_PROGRESSION_XP;
    } catch {
      // Already awarded — XPLedger unique constraint guards against dupes.
    }
  }

  // When a node is achieved, demote any other CURRENT in this movement
  // to "no row" by deleting CURRENT rows on superseded slugs (idempotente).
  let unlockedBadges: UnlockedBadgeRef[] = [];
  if (status === "ACHIEVED") {
    await rawDb.athleteSkillLevel.deleteMany({
      where: {
        athleteId: session.athleteId,
        movementSlug,
        status: "CURRENT",
        progressionSlug: { not: progressionSlug },
      },
    });

    // Trigger badge evaluation for SKILL trigger
    try {
      const r = await runAchievementEvaluation({
        tenantId: session.user.tenantId,
        athleteId: session.athleteId,
        trigger: "SKILL",
      });
      unlockedBadges = r.unlockedBadges.map((b) => ({
        code: b.code,
        name: b.name,
        description: b.description,
      }));
    } catch (err) {
      console.error("[skill-levels] badge evaluation failed:", err);
    }
  }

  revalidatePath("/atleta/movimientos");
  revalidatePath("/atleta/logros");
  revalidatePath("/atleta/skills");
  revalidatePath("/atleta");
  // Find the Movement.id for path revalidation
  const mv = await rawDb.movement.findUnique({
    where: {
      tenantId_slug: { tenantId: session.user.tenantId, slug: movementSlug },
    },
    select: { id: true },
  });
  if (mv) revalidatePath(`/atleta/movimientos/${mv.id}`);

  return { ok: true, status, xpAwarded, unlockedBadges };
}

/**
 * Borra el nivel del atleta para una progression (vuelve a "locked"/"current"
 * según contexto). Útil si el atleta marca por error.
 */
export async function unmarkMyProgression(args: {
  movementSlug: string;
  progressionSlug: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = await requireAthleteSession();

  await rawDb.athleteSkillLevel.deleteMany({
    where: {
      tenantId: session.user.tenantId,
      athleteId: session.athleteId,
      movementSlug: args.movementSlug,
      progressionSlug: args.progressionSlug,
    },
  });

  revalidatePath("/atleta/movimientos");
  return { ok: true };
}
