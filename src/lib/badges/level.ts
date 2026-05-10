export const XP_LEVEL_THRESHOLDS = [0, 300, 800, 1800, 3500] as const;

export type AthleteLevelInfo = {
  level: number;
  xpInLevel: number;
  xpToNext: number | null;
  progressToNext: number;
  threshold: number;
  nextThreshold: number | null;
};

export function getAthleteLevel(xp: number): AthleteLevelInfo {
  const safe = Math.max(0, Math.floor(xp));
  let level = 1;
  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    const t = XP_LEVEL_THRESHOLDS[i] ?? 0;
    if (safe >= t) {
      level = i + 1;
      break;
    }
  }
  const threshold = XP_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold =
    level < XP_LEVEL_THRESHOLDS.length
      ? (XP_LEVEL_THRESHOLDS[level] ?? null)
      : null;
  const xpInLevel = safe - threshold;
  const xpToNext = nextThreshold !== null ? nextThreshold - safe : null;
  const progressToNext =
    nextThreshold !== null
      ? Math.min(1, xpInLevel / (nextThreshold - threshold))
      : 1;
  return {
    level,
    xpInLevel,
    xpToNext,
    progressToNext,
    threshold,
    nextThreshold,
  };
}
