"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant } from "../db";
import {
  isCriterion,
  xpForBadgeCode,
  type Criterion,
  type AthleteState,
} from "../achievements/criteria";
import { loadAthleteState } from "../achievements/evaluate";

export type BadgeProgress = {
  current: number;
  target: number;
  ratio: number;
  human: string;
};

export type BadgeDetail = {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  criteria: Criterion | null;
  criteriaHuman: string;
  unlocked: boolean;
  earnedAt: Date | null;
  xp: number;
  progress: BadgeProgress | null;
};

async function requireAthleteSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

function humanizeCriterion(c: Criterion): string {
  switch (c.type) {
    case "attendance":
      return c.count === 1
        ? "Asistir a tu primera clase"
        : `Asistir a ${c.count} clases en total`;
    case "attendance_streak":
      return `Asistir ${c.count} días seguidos`;
    case "pr":
      return c.count === 1 ? "Lograr tu primer PR" : `Lograr ${c.count} PRs`;
    case "rx_count":
      return `Completar ${c.count} WODs en RX`;
    case "ratio_pr":
      return `Levantar ${c.ratio}× tu peso corporal en ${c.movement}`;
    case "skill_level_reached":
      return `Dominar la progresión "${c.progressionSlug.replace(/-/g, " ")}" en ${c.movementSlug.replace(/-/g, " ")}`;
  }
}

function progressFor(c: Criterion, state: AthleteState): BadgeProgress {
  switch (c.type) {
    case "attendance":
      return {
        current: state.attendanceCount,
        target: c.count,
        ratio: Math.min(1, state.attendanceCount / c.count),
        human: `${state.attendanceCount} / ${c.count} clases`,
      };
    case "attendance_streak":
      return {
        current: state.attendanceStreak,
        target: c.count,
        ratio: Math.min(1, state.attendanceStreak / c.count),
        human: `${state.attendanceStreak} / ${c.count} días`,
      };
    case "pr":
      return {
        current: state.prCount,
        target: c.count,
        ratio: Math.min(1, state.prCount / c.count),
        human: `${state.prCount} / ${c.count} PRs`,
      };
    case "rx_count":
      return {
        current: state.rxScoreCount,
        target: c.count,
        ratio: Math.min(1, state.rxScoreCount / c.count),
        human: `${state.rxScoreCount} / ${c.count} WODs RX`,
      };
    case "ratio_pr": {
      const bw = state.bodyweightKg;
      if (!bw) {
        return {
          current: 0,
          target: 0,
          ratio: 0,
          human: "Falta registrar peso corporal",
        };
      }
      const target = bw * c.ratio;
      const best = state.prByMovement[c.movement.toLowerCase()] ?? 0;
      return {
        current: best,
        target,
        ratio: target > 0 ? Math.min(1, best / target) : 0,
        human: `${best.toFixed(1)} / ${target.toFixed(1)} kg`,
      };
    }
    case "skill_level_reached": {
      const key = `${c.movementSlug}:${c.progressionSlug}`;
      const reached = state.skillLevelsAchieved.has(key);
      return {
        current: reached ? 1 : 0,
        target: 1,
        ratio: reached ? 1 : 0,
        human: reached ? "Desbloqueada" : "Pendiente de desbloquear",
      };
    }
  }
}

export async function getBadgeDetail(
  code: string,
): Promise<BadgeDetail | null> {
  const session = await requireAthleteSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return null;

  const badge = await db.badge.findFirst({ where: { code, tenantId } });
  if (!badge) return null;

  const achievement = await db.achievement.findFirst({
    where: { athleteId: me.id, badgeId: badge.id, tenantId },
    select: { earnedAt: true },
  });

  const criteria = isCriterion(badge.criteria)
    ? (badge.criteria as Criterion)
    : null;
  const xp = xpForBadgeCode(badge.code);

  let progress: BadgeProgress | null = null;
  if (criteria) {
    const state = await loadAthleteState(tenantId, me.id, [
      { criteria: badge.criteria },
    ]);
    progress = progressFor(criteria, state);
  }

  return {
    id: badge.id,
    code: badge.code,
    name: badge.name,
    description: badge.description,
    iconUrl: badge.iconUrl,
    criteria,
    criteriaHuman: criteria
      ? humanizeCriterion(criteria)
      : "Criterio personalizado",
    unlocked: !!achievement,
    earnedAt: achievement?.earnedAt ?? null,
    xp,
    progress,
  };
}

export async function listBadgesWithProgress(): Promise<BadgeDetail[]> {
  const session = await requireAthleteSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!me) return [];

  const [badges, achievements] = await Promise.all([
    db.badge.findMany({ where: { tenantId }, orderBy: { code: "asc" } }),
    db.achievement.findMany({ where: { athleteId: me.id, tenantId } }),
  ]);

  const ownedMap = new Map(achievements.map((a) => [a.badgeId, a.earnedAt]));

  // Carga state UNA vez con todas las criterias en juego para evitar N+1.
  const state = await loadAthleteState(
    tenantId,
    me.id,
    badges.map((b) => ({ criteria: b.criteria })),
  );

  return badges.map((badge) => {
    const criteria = isCriterion(badge.criteria)
      ? (badge.criteria as Criterion)
      : null;
    const earnedAt = ownedMap.get(badge.id) ?? null;
    const xp = xpForBadgeCode(badge.code);
    const progress = criteria ? progressFor(criteria, state) : null;

    return {
      id: badge.id,
      code: badge.code,
      name: badge.name,
      description: badge.description,
      iconUrl: badge.iconUrl,
      criteria,
      criteriaHuman: criteria
        ? humanizeCriterion(criteria)
        : "Criterio personalizado",
      unlocked: !!earnedAt,
      earnedAt,
      xp,
      progress,
    };
  });
}
