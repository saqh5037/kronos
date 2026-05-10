import type {
  CatalogSkill,
  CatalogSkillStatus,
  Skill,
  SkillProgressTotals,
  SkillTier,
} from "./types";
import type { AthleteLevel } from "@/lib/skill-tree";

const TIER_LABEL: Record<SkillTier, string> = {
  principiante: "Principiante",
  escalado: "Escalado",
  rx: "RX",
};

const TIER_RANK: Record<SkillTier, number> = {
  principiante: 1,
  escalado: 2,
  rx: 3,
};

export function levelToTier(
  level: "rx" | "scaled" | "beginner" | null,
): SkillTier {
  if (level === "rx") return "rx";
  if (level === "scaled") return "escalado";
  if (level === "beginner") return "principiante";
  return "principiante";
}

export function computeSkillProgressTotals(
  athleteLevels: AthleteLevel[],
  movementSlug: string,
  totalProgressions: number,
): SkillProgressTotals {
  if (totalProgressions <= 0) {
    return { progressPercent: 0, achievedCount: 0, totalCount: 0 };
  }
  const achieved = athleteLevels.filter(
    (l) => l.movementSlug === movementSlug && l.status === "ACHIEVED",
  ).length;
  return {
    progressPercent: Math.round((achieved / totalProgressions) * 100),
    achievedCount: achieved,
    totalCount: totalProgressions,
  };
}

export function isSkillCompleted(
  athleteLevels: AthleteLevel[],
  movementSlug: string,
  totalProgressions: number,
): boolean {
  if (totalProgressions <= 0) return false;
  const achieved = athleteLevels.filter(
    (l) => l.movementSlug === movementSlug && l.status === "ACHIEVED",
  ).length;
  return achieved >= totalProgressions;
}

export function isSkillStarted(
  athleteLevels: AthleteLevel[],
  movementSlug: string,
): boolean {
  return athleteLevels.some((l) => l.movementSlug === movementSlug);
}

export function selectActiveSkillId(
  skills: readonly Skill[],
  athleteLevels: AthleteLevel[],
  totalsByMovementSlug: Map<string, number>,
): string | null {
  const startedNotCompleted = skills.filter((s) => {
    const total = totalsByMovementSlug.get(s.movementSlug) ?? 0;
    return (
      isSkillStarted(athleteLevels, s.movementSlug) &&
      !isSkillCompleted(athleteLevels, s.movementSlug, total)
    );
  });
  if (startedNotCompleted.length === 0) return null;
  const withCurrent = startedNotCompleted.find((s) =>
    athleteLevels.some(
      (l) => l.movementSlug === s.movementSlug && l.status === "CURRENT",
    ),
  );
  return (withCurrent ?? startedNotCompleted[0])?.id ?? null;
}

export function computeCatalogSkillStatus(args: {
  skill: Skill;
  athleteLevels: AthleteLevel[];
  athleteTier: SkillTier;
  completedSkillIds: Set<string>;
  activeSkillId: string | null;
  totalProgressions: number;
}): {
  status: CatalogSkillStatus;
  progressPercent?: number;
  lockReason?: string;
} {
  const {
    skill,
    athleteLevels,
    athleteTier,
    completedSkillIds,
    activeSkillId,
    totalProgressions,
  } = args;

  if (TIER_RANK[skill.tier] > TIER_RANK[athleteTier]) {
    return { status: "locked", lockReason: `Nivel ${TIER_LABEL[skill.tier]}` };
  }

  const missingPrereq = skill.prereqSkillIds.find(
    (id) => !completedSkillIds.has(id),
  );
  if (missingPrereq) {
    return {
      status: "locked",
      lockReason: `Completa ${prettyPrereq(missingPrereq)}`,
    };
  }

  if (isSkillCompleted(athleteLevels, skill.movementSlug, totalProgressions)) {
    return { status: "completed", progressPercent: 100 };
  }

  if (skill.id === activeSkillId) {
    const totals = computeSkillProgressTotals(
      athleteLevels,
      skill.movementSlug,
      totalProgressions,
    );
    return { status: "active", progressPercent: totals.progressPercent };
  }

  if (isSkillStarted(athleteLevels, skill.movementSlug)) {
    const totals = computeSkillProgressTotals(
      athleteLevels,
      skill.movementSlug,
      totalProgressions,
    );
    return { status: "active", progressPercent: totals.progressPercent };
  }

  return { status: "available" };
}

export function buildCatalog(args: {
  skills: readonly Skill[];
  athleteLevels: AthleteLevel[];
  athleteTier: SkillTier;
  totalsByMovementSlug: Map<string, number>;
}): CatalogSkill[] {
  const { skills, athleteLevels, athleteTier, totalsByMovementSlug } = args;

  const completedSkillIds = new Set<string>();
  for (const s of skills) {
    const total = totalsByMovementSlug.get(s.movementSlug) ?? 0;
    if (isSkillCompleted(athleteLevels, s.movementSlug, total)) {
      completedSkillIds.add(s.id);
    }
  }

  const activeSkillId = selectActiveSkillId(
    skills,
    athleteLevels,
    totalsByMovementSlug,
  );

  return skills.map((skill) => {
    const total = totalsByMovementSlug.get(skill.movementSlug) ?? 0;
    const result = computeCatalogSkillStatus({
      skill,
      athleteLevels,
      athleteTier,
      completedSkillIds,
      activeSkillId,
      totalProgressions: total,
    });
    return {
      id: skill.id,
      name: skill.name,
      status: result.status,
      progressPercent: result.progressPercent,
      lockReason: result.lockReason,
    };
  });
}

function prettyPrereq(prereqId: string): string {
  return prereqId
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}
