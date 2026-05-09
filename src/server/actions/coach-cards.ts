"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import {
  generateCoachCards,
  type CoachCardInput,
  type GeneratedCoachCard,
} from "../ai/coach-cards-prompt";
import { progressionToSlug } from "@/lib/skill-tree";
import type { Progression } from "@/lib/validations/movement";
import type { CoachCardType, Prisma } from "@prisma/client";

export type CoachCardRow = {
  id: string;
  type: CoachCardType;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  priority: number;
  generatedAt: Date;
  validUntil: Date;
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function requireAthleteSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true, firstName: true, tenantId: true },
  });
  if (!athlete) throw new Error("Athlete profile not found");
  return { ...session, athlete };
}

/**
 * Lee las cards activas (no dismissed, validUntil > now) del atleta
 * logueado. Si no hay ninguna fresca, dispara generación on-demand
 * en background (self-healing si el cron falla).
 */
export async function getMyCoachCards(): Promise<CoachCardRow[]> {
  const session = await requireAthleteSession();
  const now = new Date();

  const cards = await rawDb.coachCard.findMany({
    where: {
      tenantId: session.athlete.tenantId,
      athleteId: session.athlete.id,
      dismissed: false,
      validUntil: { gt: now },
    },
    orderBy: [{ priority: "asc" }, { generatedAt: "desc" }],
    take: 3,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      ctaLabel: true,
      ctaHref: true,
      priority: true,
      generatedAt: true,
      validUntil: true,
    },
  });

  if (cards.length === 0) {
    // Self-healing: si no hay cards frescas, intentar generar ahora.
    // Best-effort, ignoramos errores para no bloquear el render.
    void generateCoachCardsForAthlete(session.athlete.id).catch((err) => {
      console.error("[coach-cards] background generation failed:", err);
    });
  }

  return cards;
}

/**
 * Marca una card como dismissed (no vuelve a aparecer hasta el próximo
 * ciclo de generación).
 */
export async function dismissCoachCard(
  cardId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const session = await requireAthleteSession();

  const card = await rawDb.coachCard.findUnique({
    where: { id: cardId },
    select: { athleteId: true, tenantId: true },
  });
  if (!card) return { ok: false, reason: "not_found" };
  if (
    card.athleteId !== session.athlete.id ||
    card.tenantId !== session.athlete.tenantId
  ) {
    return { ok: false, reason: "forbidden" };
  }

  await rawDb.coachCard.update({
    where: { id: cardId },
    data: { dismissed: true, dismissedAt: new Date() },
  });

  revalidatePath("/atleta");
  return { ok: true };
}

/**
 * Genera y persiste cards para un athlete. Llamado por cron lunes 6am
 * y on-demand como self-healing fallback.
 *
 * Idempotente por semana: si ya hay cards frescas (<7 días), no regenera.
 */
export async function generateCoachCardsForAthlete(
  athleteId: string,
): Promise<{ generated: number }> {
  const athlete = await rawDb.athlete.findUnique({
    where: { id: athleteId },
    select: {
      id: true,
      firstName: true,
      tenantId: true,
      box: {
        select: { slug: true },
      },
    },
  });
  if (!athlete) return { generated: 0 };

  const now = new Date();

  // Skip si ya tiene cards frescas (<7 días)
  const fresh = await rawDb.coachCard.count({
    where: {
      athleteId,
      generatedAt: { gt: new Date(now.getTime() - ONE_WEEK_MS) },
      dismissed: false,
    },
  });
  if (fresh > 0) return { generated: 0 };

  const facts = await collectAthleteFacts(athleteId, athlete.tenantId);

  // Si no hay nada que reportar, no llamamos AI (cost saver)
  const hasSignal =
    facts.stagnantPRs.length > 0 ||
    facts.recentPRs.length > 0 ||
    facts.nextUnlocks.length > 0 ||
    facts.avoidancePatterns.length > 0;

  if (!hasSignal) return { generated: 0 };

  const input: CoachCardInput = {
    athleteFirstName: athlete.firstName,
    isPersonalBox: athlete.box?.slug?.startsWith("me-") ?? false,
    facts,
  };

  let generated: GeneratedCoachCard[];
  try {
    generated = await generateCoachCards(input);
  } catch (err) {
    console.error("[coach-cards] AI generation failed:", err);
    return { generated: 0 };
  }

  if (generated.length === 0) return { generated: 0 };

  const validUntil = new Date(now.getTime() + ONE_WEEK_MS);
  await rawDb.coachCard.createMany({
    data: generated.map((c) => ({
      tenantId: athlete.tenantId,
      athleteId,
      type: c.type,
      title: c.title,
      body: c.body,
      ctaLabel: c.ctaLabel ?? null,
      ctaHref: c.ctaHref ?? null,
      priority: c.priority,
      meta: (c.meta ?? null) as Prisma.InputJsonValue,
      generatedAt: now,
      validUntil,
      dismissed: false,
    })),
  });

  revalidatePath("/atleta");
  return { generated: generated.length };
}

/**
 * Recolecta los hechos del atleta para el AI: stagnant PRs, recent PRs,
 * next unlocks, avoidance patterns. Sin LLM — pure DB queries.
 */
async function collectAthleteFacts(
  athleteId: string,
  tenantId: string,
): Promise<CoachCardInput["facts"]> {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 1. Stagnant PRs: PRs cuya última actualización fue >30 días
  const allPRs = await rawDb.pR.findMany({
    where: { athleteId, tenantId },
    select: {
      value: true,
      achievedAt: true,
      movement: { select: { name: true, slug: true } },
    },
    orderBy: { achievedAt: "desc" },
    take: 20,
  });
  const stagnantPRs = allPRs
    .filter((pr) => pr.achievedAt < thirtyDaysAgo)
    .slice(0, 4)
    .map((pr) => ({
      movementName: pr.movement.name,
      daysStuck: Math.floor(
        (now.getTime() - pr.achievedAt.getTime()) / (24 * 60 * 60 * 1000),
      ),
      lastValue: String(pr.value),
    }));

  // 2. Recent PRs: PRAttempt con prevBest != null y delta > 0 en últimos 14 días
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const recentAttempts = await rawDb.pRAttempt.findMany({
    where: {
      athleteId,
      tenantId,
      achievedAt: { gte: fourteenDaysAgo },
      prevBest: { not: null },
    },
    select: {
      value: true,
      prevBest: true,
      achievedAt: true,
      movement: { select: { name: true } },
    },
    orderBy: { achievedAt: "desc" },
    take: 10,
  });
  const recentPRs = recentAttempts
    .filter((a) => {
      if (!a.prevBest) return false;
      return Number(a.value) > Number(a.prevBest);
    })
    .slice(0, 3)
    .map((a) => {
      const value = Number(a.value);
      const prev = a.prevBest ? Number(a.prevBest) : value;
      return {
        movementName: a.movement.name,
        deltaPct: ((value - prev) / (prev || 1)) * 100,
        achievedAt: a.achievedAt,
      };
    });

  // 3. Next unlocks: AthleteSkillLevel.CURRENT con un nodo siguiente disponible
  const myCurrent = await rawDb.athleteSkillLevel.findMany({
    where: { athleteId, tenantId, status: "CURRENT" },
    select: { movementSlug: true, progressionSlug: true },
    take: 5,
  });
  const nextUnlocks: CoachCardInput["facts"]["nextUnlocks"] = [];
  for (const lvl of myCurrent) {
    const movement = await rawDb.movement.findUnique({
      where: {
        tenantId_slug: { tenantId, slug: lvl.movementSlug },
      },
      select: { name: true, progressions: true },
    });
    if (!movement) continue;
    const progressions = movement.progressions as Progression[] | null;
    if (!progressions) continue;

    const idx = progressions.findIndex(
      (p) => progressionToSlug(p.name) === lvl.progressionSlug,
    );
    if (idx === -1 || idx >= progressions.length - 1) continue;

    const current = progressions[idx];
    const next = progressions[idx + 1];
    if (!current || !next) continue;
    nextUnlocks.push({
      movementName: movement.name,
      currentProgressionName: current.name,
      nextProgressionName: next.name,
    });
    if (nextUnlocks.length >= 3) break;
  }

  // 4. Avoidance patterns: muscle groups con 0 logs en últimos 30 días
  // (heurística simple: scores en últimos 30d → set de movements → set de muscles)
  const recentScores = await rawDb.score.findMany({
    where: {
      athleteId,
      tenantId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      wod: {
        select: {
          movements: {
            select: {
              movement: { select: { musclesWorked: true } },
            },
          },
        },
      },
    },
    take: 50,
  });

  const muscleHits = new Set<string>();
  for (const s of recentScores) {
    for (const wm of s.wod.movements) {
      for (const m of wm.movement.musclesWorked) {
        muscleHits.add(m.toLowerCase());
      }
    }
  }

  const PRIMARY_MUSCLE_GROUPS = [
    "shoulders",
    "chest",
    "back",
    "lats",
    "core",
    "quads",
    "glutes",
    "hamstrings",
  ];
  const olderScores = await rawDb.score.count({
    where: {
      athleteId,
      tenantId,
      createdAt: { gte: ninetyDaysAgo },
    },
  });
  const avoidancePatterns: CoachCardInput["facts"]["avoidancePatterns"] =
    olderScores > 5
      ? PRIMARY_MUSCLE_GROUPS.filter((mg) => !muscleHits.has(mg))
          .slice(0, 2)
          .map((mg) => ({ muscleGroup: mg, daysWithout: 30 }))
      : [];

  return {
    stagnantPRs,
    recentPRs,
    nextUnlocks,
    avoidancePatterns,
  };
}

/**
 * Cron entry: regenera cards para todos los atletas que no tienen cards
 * frescas. Llamado lunes 6am UTC desde /api/cron/generate-coach-cards.
 */
export async function generateCoachCardsBatch(): Promise<{
  athletesProcessed: number;
  cardsGenerated: number;
}> {
  // Solo atletas activos con scores recientes (cost saver)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const activeAthletes = await rawDb.athlete.findMany({
    where: {
      status: "ACTIVE",
      scores: {
        some: { createdAt: { gte: ninetyDaysAgo } },
      },
    },
    select: { id: true },
    take: 500, // Cap por ejecución para no agotar quota Gemini
  });

  let cardsGenerated = 0;
  let athletesProcessed = 0;
  for (const athlete of activeAthletes) {
    try {
      const r = await generateCoachCardsForAthlete(athlete.id);
      cardsGenerated += r.generated;
      athletesProcessed += 1;
    } catch (err) {
      console.error(`[coach-cards-batch] athlete ${athlete.id} failed:`, err);
    }
  }

  return { athletesProcessed, cardsGenerated };
}
