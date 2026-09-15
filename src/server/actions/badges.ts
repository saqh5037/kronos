"use server";

import { getServerSession } from "next-auth";
import type { BadgeTier } from "@prisma/client";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { getCachedBadgeCatalog } from "@/server/cache";
import {
  isCriterion,
  xpForBadgeCode,
  type Criterion,
  type AthleteState,
} from "../achievements/criteria";
import { loadAthleteState } from "../achievements/evaluate";
import { readPrefs } from "@/lib/atleta-prefs";
import { computeAthleteTier, levelToTier } from "@/lib/skills/progress";
import { getAthleteLevel, type AthleteLevelInfo } from "@/lib/badges/level";
import {
  badgeProgressHuman,
  badgeProgressView,
  type BadgeIconName,
  badgeIconName,
} from "@/lib/badges/progress";
import {
  badgeTierFromSkillTier,
  isBadgeAboveAthleteTier,
} from "@/lib/badges/tier";
import { reconcileBadgeXPLedger } from "../achievements/xp";
import { loadAttendanceStreak } from "../achievements/attendance-streak";
import type { AthleteTierInfo, SkillTier } from "@/lib/skills/types";

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
  tier: BadgeTier | null;
  isAboveTier: boolean;
  /** lucide icon name — badges never render two-letter text codes. */
  icon: BadgeIconName;
};

export type AthleteCollectionStats = {
  athleteTier: SkillTier;
  tierInfo: AthleteTierInfo;
  /** Ledger sum — the single XP source for every screen. */
  xpTotal: number;
  level: AthleteLevelInfo;
  unlockedCount: number;
  totalCount: number;
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

/**
 * Every counter goes through `badgeProgressView`, which clamps the raw value to
 * the target. That is what kills "17 / 1 clases · 100 %" (audit 2026-09-15):
 * the athlete's lifetime attendance was printed against a target of 1.
 */
function counted(raw: number, target: number, noun: string): BadgeProgress {
  const view = badgeProgressView(raw, target);
  return {
    current: view.current,
    target: view.target,
    ratio: view.ratio,
    human: badgeProgressHuman(raw, target, noun),
  };
}

/**
 * The badge *grid* must show the streak the athlete actually has, not the
 * cached `Streak.count` (audit 2026-09-15: "30 días seguidos · 0 %" on day 7).
 * Unlocking still runs off the cached counter inside the evaluation
 * transaction; only what we render is recomputed.
 */
async function withRealStreak(
  tenantId: string,
  athleteId: string,
  state: AthleteState,
  needed: boolean,
): Promise<AthleteState> {
  if (!needed) return state;
  const streak = await loadAttendanceStreak(tenantId, athleteId).catch(
    () => state.attendanceStreak,
  );
  return { ...state, attendanceStreak: Math.max(streak, 0) };
}

function progressFor(c: Criterion, state: AthleteState): BadgeProgress {
  switch (c.type) {
    case "attendance":
      return counted(state.attendanceCount, c.count, "clases");
    case "attendance_streak":
      return counted(state.attendanceStreak, c.count, "días");
    case "pr":
      return counted(state.prCount, c.count, "PRs");
    case "rx_count":
      return counted(state.rxScoreCount, c.count, "WODs RX");
    case "ratio_pr": {
      const bw = state.bodyweightKg;
      if (!bw) {
        return {
          current: 0,
          target: 0,
          ratio: 0,
          human: "Falta registrar tu peso corporal",
        };
      }
      const target = Math.round(bw * c.ratio * 10) / 10;
      const best = state.prByMovement[c.movement.toLowerCase()] ?? 0;
      return counted(Math.round(best * 10) / 10, target, "kg");
    }
    case "skill_level_reached": {
      const key = `${c.movementSlug}:${c.progressionSlug}`;
      const reached = state.skillLevelsAchieved.has(key);
      return {
        current: reached ? 1 : 0,
        target: 1,
        ratio: reached ? 1 : 0,
        human: reached ? "Progresión dominada" : "Aún sin dominar",
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
    select: { id: true, tags: true },
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
  const xp = badge.xpReward ?? xpForBadgeCode(badge.code);
  const athleteTier = levelToTier(readPrefs(me.tags).level);
  const isAboveTier = isBadgeAboveAthleteTier(badge.tier, athleteTier);

  let progress: BadgeProgress | null = null;
  if (criteria) {
    const state = await withRealStreak(
      tenantId,
      me.id,
      await loadAthleteState(tenantId, me.id, [{ criteria: badge.criteria }]),
      criteria.type === "attendance_streak",
    );
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
    tier: badge.tier,
    isAboveTier,
    icon: badgeIconName(badge.code),
  };
}

export async function getMyAthleteFirstName(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return null;
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { firstName: true },
  });
  return athlete?.firstName ?? null;
}

async function resolveAthleteContext() {
  const session = await requireAthleteSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);
  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, tags: true },
  });
  return { session, tenantId, db, athlete: me };
}

export async function listBadgesWithProgress(): Promise<BadgeDetail[]> {
  const { tenantId, db, athlete } = await resolveAthleteContext();
  if (!athlete) return [];

  const prefs = readPrefs(athlete.tags);
  const athleteTier = levelToTier(prefs.level);

  const [badges, achievements] = await Promise.all([
    getCachedBadgeCatalog(tenantId),
    db.achievement.findMany({ where: { athleteId: athlete.id, tenantId } }),
  ]);

  const ownedMap = new Map(achievements.map((a) => [a.badgeId, a.earnedAt]));

  const needsStreak = badges.some(
    (b) =>
      isCriterion(b.criteria) &&
      (b.criteria as Criterion).type === "attendance_streak",
  );
  const state = await withRealStreak(
    tenantId,
    athlete.id,
    await loadAthleteState(
      tenantId,
      athlete.id,
      badges.map((b) => ({ criteria: b.criteria })),
    ),
    needsStreak,
  );

  return badges.map((badge) => {
    const criteria = isCriterion(badge.criteria)
      ? (badge.criteria as Criterion)
      : null;
    const earnedAt = ownedMap.get(badge.id) ?? null;
    const xp = badge.xpReward ?? xpForBadgeCode(badge.code);
    const progress = criteria ? progressFor(criteria, state) : null;
    const isAboveTier = isBadgeAboveAthleteTier(badge.tier, athleteTier);

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
      tier: badge.tier,
      isAboveTier,
      icon: badgeIconName(badge.code),
    };
  });
}

/**
 * The one XP number. Reconciles the ledger first so badges unlocked outside
 * `runAchievementEvaluation` (seed, backfills) are credited — that mismatch is
 * what produced "LOGROS · 0 XP" above four unlocked badges.
 */
export async function getAthleteXPTotal(): Promise<number> {
  const { tenantId, athlete } = await resolveAthleteContext();
  if (!athlete) return 0;
  return reconcileBadgeXPLedger(tenantId, athlete.id);
}

export async function getCollectionStats(): Promise<AthleteCollectionStats | null> {
  const { tenantId, db, athlete } = await resolveAthleteContext();
  if (!athlete) return null;

  const prefs = readPrefs(athlete.tags);
  const tierInfo = computeAthleteTier({ declaredLevel: prefs.level });
  const accessibleBadgeTier = badgeTierFromSkillTier(tierInfo.tier);

  const [xpTotal, badges, ownedCount] = await Promise.all([
    reconcileBadgeXPLedger(tenantId, athlete.id),
    db.badge.findMany({
      where: {
        tenantId,
        OR: [
          { tier: null },
          { tier: { in: badgeTierAtOrBelow(accessibleBadgeTier) } },
        ],
      },
      select: { id: true },
    }),
    db.achievement.count({
      where: { athleteId: athlete.id, tenantId },
    }),
  ]);

  return {
    athleteTier: tierInfo.tier,
    tierInfo,
    xpTotal,
    level: getAthleteLevel(xpTotal),
    unlockedCount: ownedCount,
    totalCount: badges.length,
  };
}

function badgeTierAtOrBelow(tier: BadgeTier): BadgeTier[] {
  if (tier === "RX") return ["PRINCIPIANTE", "ESCALADO", "RX"];
  if (tier === "ESCALADO") return ["PRINCIPIANTE", "ESCALADO"];
  return ["PRINCIPIANTE"];
}
