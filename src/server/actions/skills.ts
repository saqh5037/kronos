"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { annotateProgressionTree, type AthleteLevel } from "@/lib/skill-tree";
import { readPrefs } from "@/lib/atleta-prefs";
import type { Progression } from "@/lib/validations/movement";
import { SKILL_CATALOG, getSkillById } from "@/lib/skills/catalog";
import {
  buildCatalog,
  computeSkillProgressTotals,
  levelToTier,
  selectActiveSkillId,
} from "@/lib/skills/progress";
import type {
  ActiveSkillData,
  CatalogSkill,
  SkillTier,
} from "@/lib/skills/types";

type AthleteSession = {
  tenantId: string;
  userId: string;
  athleteId: string;
  athleteTier: SkillTier;
};

async function getAthleteSession(): Promise<AthleteSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return null;
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true, tags: true },
  });
  if (!athlete) return null;
  const prefs = readPrefs(athlete.tags);
  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    athleteId: athlete.id,
    athleteTier: levelToTier(prefs.level),
  };
}

async function loadCatalogProgressions(
  tenantId: string,
): Promise<Map<string, { name: string; progressions: Progression[] }>> {
  const db = withTenant(tenantId);
  const slugs = SKILL_CATALOG.map((s) => s.movementSlug);
  const movements = await db.movement.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, name: true, progressions: true },
  });
  const map = new Map<string, { name: string; progressions: Progression[] }>();
  for (const m of movements) {
    const progressions = (m.progressions as Progression[] | null) ?? [];
    map.set(m.slug, { name: m.name, progressions });
  }
  return map;
}

async function loadAthleteLevels(
  tenantId: string,
  athleteId: string,
  movementSlugs: string[],
): Promise<AthleteLevel[]> {
  const rows = await rawDb.athleteSkillLevel.findMany({
    where: {
      tenantId,
      athleteId,
      movementSlug: { in: movementSlugs },
    },
    select: {
      movementSlug: true,
      progressionSlug: true,
      status: true,
      achievedAt: true,
    },
  });
  return rows.map((r) => ({
    movementSlug: r.movementSlug,
    progressionSlug: r.progressionSlug,
    status: r.status,
    achievedAt: r.achievedAt,
  }));
}

export async function getActiveSkillForAthlete(): Promise<ActiveSkillData | null> {
  const session = await getAthleteSession();
  if (!session) return null;

  const slugs = SKILL_CATALOG.map((s) => s.movementSlug);
  const [movementsBySlug, levels] = await Promise.all([
    loadCatalogProgressions(session.tenantId),
    loadAthleteLevels(session.tenantId, session.athleteId, slugs),
  ]);

  const totalsByMovementSlug = new Map(
    Array.from(movementsBySlug.entries()).map(([slug, m]) => [
      slug,
      m.progressions.length,
    ]),
  );

  const activeSkillId = selectActiveSkillId(
    SKILL_CATALOG,
    levels,
    totalsByMovementSlug,
  );
  if (!activeSkillId) return null;

  const skill = getSkillById(activeSkillId);
  if (!skill) return null;

  const movement = movementsBySlug.get(skill.movementSlug);
  if (!movement || movement.progressions.length === 0) return null;

  const totals = computeSkillProgressTotals(
    levels,
    skill.movementSlug,
    movement.progressions.length,
  );
  const nodes = annotateProgressionTree(
    movement.progressions,
    levels,
    skill.movementSlug,
  );

  return {
    skill,
    progressPercent: totals.progressPercent,
    achievedCount: totals.achievedCount,
    totalCount: totals.totalCount,
    progressions: nodes,
  };
}

export async function getSkillCatalogForAthlete(): Promise<{
  athleteTier: SkillTier;
  catalog: CatalogSkill[];
}> {
  const session = await getAthleteSession();
  if (!session) {
    return {
      athleteTier: "principiante",
      catalog: SKILL_CATALOG.map((s) => ({
        id: s.id,
        name: s.name,
        status: "available" as const,
      })),
    };
  }

  const slugs = SKILL_CATALOG.map((s) => s.movementSlug);
  const [movementsBySlug, levels] = await Promise.all([
    loadCatalogProgressions(session.tenantId),
    loadAthleteLevels(session.tenantId, session.athleteId, slugs),
  ]);

  const totalsByMovementSlug = new Map(
    Array.from(movementsBySlug.entries()).map(([slug, m]) => [
      slug,
      m.progressions.length,
    ]),
  );

  const catalog = buildCatalog({
    skills: SKILL_CATALOG,
    athleteLevels: levels,
    athleteTier: session.athleteTier,
    totalsByMovementSlug,
  });

  return { athleteTier: session.athleteTier, catalog };
}

export async function getAthleteTier(): Promise<SkillTier> {
  const session = await getAthleteSession();
  return session?.athleteTier ?? "principiante";
}

/**
 * Returns PR predictions filtered by movements relevant to the given skill's
 * movementSlug. If the skill or its movement is not found, returns all
 * predictions as fallback. Empty array if athlete has insufficient data.
 */
export async function getSkillContextualPRPredictions(skillId: string) {
  const skill = SKILL_CATALOG.find((s) => s.id === skillId);
  if (!skill) return [];

  const session = await getAthleteSession();
  if (!session) return [];

  const { getTop3PRPredictions } = await import("./ai");
  const allPredictions = await getTop3PRPredictions().catch(() => []);
  if (allPredictions.length === 0) return [];

  const db = withTenant(session.tenantId);
  const movement = await db.movement.findUnique({
    where: {
      tenantId_slug: {
        tenantId: session.tenantId,
        slug: skill.movementSlug,
      },
    },
    select: { id: true },
  });

  if (!movement) return allPredictions;

  const filtered = allPredictions.filter((p) => p.movementId === movement.id);
  return filtered.length > 0 ? filtered : allPredictions;
}
