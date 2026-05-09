/**
 * Pure achievement criteria evaluator.
 *
 * Each badge has a `criteria` JSON. This module defines the supported
 * criterion shapes and a pure `evaluateCriterion` that decides whether
 * a given athlete state satisfies it.
 *
 * No DB access, no Prisma. Inputs are precomputed counters/values.
 */

export type AthleteState = {
  attendanceCount: number;
  attendanceStreak: number;
  prCount: number;
  rxScoreCount: number;
  /**
   * Best PR per movement name (lowercased). For weight-based PRs.
   */
  prByMovement: Record<string, number>;
  /**
   * Athlete's body weight (kg). May be undefined when not recorded.
   */
  bodyweightKg?: number;
  /**
   * Set of "movementSlug:progressionSlug" strings the athlete has
   * marked as ACHIEVED. Used by skill_level_reached criterion.
   */
  skillLevelsAchieved: Set<string>;
};

export type Criterion =
  | { type: "attendance"; count: number }
  | { type: "attendance_streak"; count: number }
  | { type: "pr"; count: number }
  | { type: "rx_count"; count: number }
  | { type: "ratio_pr"; movement: string; ratio: number }
  | {
      type: "skill_level_reached";
      movementSlug: string;
      progressionSlug: string;
    };

export type AchievementTrigger =
  | "PR"
  | "ATTENDANCE"
  | "BULK"
  | "BACKFILL"
  | "SKILL";

/**
 * Triggers that should be considered for each criterion type.
 * Used to skip evaluating badges whose kind doesn't match the event.
 */
export const triggerMatchesType = (
  trigger: AchievementTrigger,
  type: Criterion["type"],
): boolean => {
  if (trigger === "BULK" || trigger === "BACKFILL") return true;
  if (trigger === "ATTENDANCE") {
    return type === "attendance" || type === "attendance_streak";
  }
  if (trigger === "PR") {
    return type === "pr" || type === "rx_count" || type === "ratio_pr";
  }
  if (trigger === "SKILL") {
    return type === "skill_level_reached";
  }
  return false;
};

export const isCriterion = (value: unknown): value is Criterion => {
  if (!value || typeof value !== "object") return false;
  const c = value as { type?: unknown };
  if (typeof c.type !== "string") return false;
  switch (c.type) {
    case "attendance":
    case "attendance_streak":
    case "pr":
    case "rx_count":
      return typeof (c as { count?: unknown }).count === "number";
    case "ratio_pr":
      return (
        typeof (c as { movement?: unknown }).movement === "string" &&
        typeof (c as { ratio?: unknown }).ratio === "number"
      );
    case "skill_level_reached":
      return (
        typeof (c as { movementSlug?: unknown }).movementSlug === "string" &&
        typeof (c as { progressionSlug?: unknown }).progressionSlug === "string"
      );
    default:
      return false;
  }
};

export const evaluateCriterion = (
  criterion: Criterion,
  state: AthleteState,
): boolean => {
  switch (criterion.type) {
    case "attendance":
      return state.attendanceCount >= criterion.count;
    case "attendance_streak":
      return state.attendanceStreak >= criterion.count;
    case "pr":
      return state.prCount >= criterion.count;
    case "rx_count":
      return state.rxScoreCount >= criterion.count;
    case "ratio_pr": {
      if (state.bodyweightKg == null || state.bodyweightKg <= 0) return false;
      const key = criterion.movement.toLowerCase();
      const best = state.prByMovement[key];
      if (best == null) return false;
      return best >= criterion.ratio * state.bodyweightKg;
    }
    case "skill_level_reached": {
      const key = `${criterion.movementSlug}:${criterion.progressionSlug}`;
      return state.skillLevelsAchieved.has(key);
    }
  }
};

/**
 * XP awarded per badge code. Falls back to 25 XP for unknown codes
 * so newly added badges still grant points without code change.
 */
export const xpForBadgeCode = (code: string): number => {
  const map: Record<string, number> = {
    "first-class": 10,
    "first-pr": 50,
    "streak-7": 25,
    "streak-30": 75,
    "rx-warrior": 50,
    "double-bw-deadlift": 100,
  };
  return map[code] ?? 25;
};
