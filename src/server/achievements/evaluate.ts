import { withTenant, db as prismaBase } from "@/server/db";
import {
  evaluateCriterion,
  isCriterion,
  triggerMatchesType,
  xpForBadgeCode,
  type AchievementTrigger,
  type AthleteState,
  type Criterion,
} from "./criteria";

export type UnlockedBadge = {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string | null;
  xp: number;
};

export type EvaluateInput = {
  tenantId: string;
  athleteId: string;
  trigger: AchievementTrigger;
  /**
   * Optional pre-loaded state. When provided, skips DB reads.
   * Used by backfill to batch-evaluate cheaply.
   */
  state?: AthleteState;
};

export type EvaluateResult = {
  unlockedBadges: UnlockedBadge[];
  xpAwarded: number;
};

/**
 * Evaluate all candidate badges for the given athlete & trigger.
 * Idempotent: re-running won't double-grant achievements (Achievement
 * @@unique on athleteId+badgeId; XPLedger @@unique on sourceType+sourceId+reason).
 */
export async function runAchievementEvaluation(
  input: EvaluateInput,
): Promise<EvaluateResult> {
  const { tenantId, athleteId, trigger } = input;
  const db = withTenant(tenantId);

  const allBadges = await db.badge.findMany({ where: { tenantId } });
  const candidateBadges = allBadges.filter((b) => {
    if (!isCriterion(b.criteria)) return false;
    return triggerMatchesType(trigger, (b.criteria as Criterion).type);
  });

  if (candidateBadges.length === 0) {
    return { unlockedBadges: [], xpAwarded: 0 };
  }

  const owned = await db.achievement.findMany({
    where: { athleteId, tenantId },
    select: { badgeId: true },
  });
  const ownedSet = new Set(owned.map((a) => a.badgeId));
  const pending = candidateBadges.filter((b) => !ownedSet.has(b.id));
  if (pending.length === 0) {
    return { unlockedBadges: [], xpAwarded: 0 };
  }

  const state =
    input.state ?? (await loadAthleteState(tenantId, athleteId, pending));

  const unlocked: UnlockedBadge[] = [];
  for (const b of pending) {
    const criterion = b.criteria as Criterion;
    if (!evaluateCriterion(criterion, state)) continue;

    try {
      await db.achievement.create({
        data: {
          tenantId,
          athleteId,
          badgeId: b.id,
        },
      });
    } catch {
      continue;
    }

    const xp = xpForBadgeCode(b.code);
    try {
      await prismaBase.xPLedger.create({
        data: {
          tenantId,
          athleteId,
          amount: xp,
          reason: `BADGE_${b.code}`,
          sourceType: "Achievement",
          sourceId: b.id,
        },
      });
    } catch {
      // unique violation = already credited; safe to ignore
    }

    unlocked.push({
      badgeId: b.id,
      code: b.code,
      name: b.name,
      description: b.description,
      iconUrl: b.iconUrl,
      xp,
    });
  }

  const xpAwarded = unlocked.reduce((sum, u) => sum + u.xp, 0);
  return { unlockedBadges: unlocked, xpAwarded };
}

/**
 * Award XP for an event that is not a badge unlock (raw event XP:
 * attending a class, registering a score, hitting a PR).
 *
 * Idempotent via XPLedger unique on (sourceType, sourceId, reason).
 */
export async function awardXP({
  tenantId,
  athleteId,
  amount,
  reason,
  sourceType,
  sourceId,
}: {
  tenantId: string;
  athleteId: string;
  amount: number;
  reason: string;
  sourceType: string;
  sourceId: string;
}): Promise<{ awarded: boolean }> {
  if (amount <= 0) return { awarded: false };
  try {
    await prismaBase.xPLedger.create({
      data: { tenantId, athleteId, amount, reason, sourceType, sourceId },
    });
    return { awarded: true };
  } catch {
    return { awarded: false };
  }
}

export async function getAthleteXPTotal(
  tenantId: string,
  athleteId: string,
): Promise<number> {
  const sum = await prismaBase.xPLedger.aggregate({
    where: { tenantId, athleteId },
    _sum: { amount: true },
  });
  return sum._sum.amount ?? 0;
}

function toBodyweightKg(metric: {
  value: unknown;
  unit: string;
}): number | undefined {
  const v = Number(metric.value);
  if (!Number.isFinite(v) || v <= 0) return undefined;
  const unit = metric.unit.toLowerCase();
  if (unit === "lb" || unit === "lbs") return v * 0.453592;
  return v;
}

async function loadAthleteState(
  tenantId: string,
  athleteId: string,
  candidates: Array<{ criteria: unknown }>,
): Promise<AthleteState> {
  const types = new Set<Criterion["type"]>();
  let needsRatio = false;
  for (const b of candidates) {
    if (!isCriterion(b.criteria)) continue;
    const c = b.criteria as Criterion;
    types.add(c.type);
    if (c.type === "ratio_pr") needsRatio = true;
  }

  const db = withTenant(tenantId);

  const [attendance, streak, prs, rxScores, latestBody] = await Promise.all([
    types.has("attendance")
      ? db.booking.count({
          where: { tenantId, athleteId, status: "ATTENDED" },
        })
      : Promise.resolve(0),
    types.has("attendance_streak")
      ? db.streak
          .findUnique({
            where: { athleteId_type: { athleteId, type: "ATTENDANCE" } },
          })
          .then((s) => s?.count ?? 0)
      : Promise.resolve(0),
    types.has("pr")
      ? db.pR.count({ where: { tenantId, athleteId } })
      : Promise.resolve(0),
    types.has("rx_count")
      ? db.score.count({
          where: { tenantId, athleteId, scaling: "RX" },
        })
      : Promise.resolve(0),
    needsRatio
      ? db.bodyMetric.findFirst({
          where: { tenantId, athleteId, type: "WEIGHT" },
          orderBy: { measuredAt: "desc" },
        })
      : Promise.resolve(null),
  ]);

  const prByMovement: Record<string, number> = {};
  if (needsRatio) {
    const movementPRs = await db.pR.findMany({
      where: { tenantId, athleteId },
      include: { movement: { select: { name: true } } },
    });
    for (const pr of movementPRs) {
      const key = pr.movement.name.toLowerCase();
      const v = Number(pr.value);
      if (!Number.isFinite(v)) continue;
      if (prByMovement[key] == null || v > prByMovement[key]) {
        prByMovement[key] = v;
      }
    }
  }

  return {
    attendanceCount: attendance,
    attendanceStreak: streak,
    prCount: prs,
    rxScoreCount: rxScores,
    prByMovement,
    bodyweightKg: latestBody?.value ? toBodyweightKg(latestBody) : undefined,
  };
}
