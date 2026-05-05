/**
 * Pure feed builder. No DB. Merges PR / Achievement / Streak / FirstScore
 * events into one chronological stream ready for UI rendering.
 */

export type FeedEventType = "PR" | "BADGE" | "STREAK" | "FIRST_SCORE";

export type FeedEvent<P = Record<string, unknown>> = {
  type: FeedEventType;
  athleteId: string;
  athleteName: string;
  ts: string;
  payload: P;
};

export type PRSourceRow = {
  athleteId: string;
  athleteName: string;
  achievedAt: Date | string;
  movementName: string;
  value: number;
  unit: string;
  prevBest: number | null;
  scoreId?: string | null;
};

export type BadgeSourceRow = {
  athleteId: string;
  athleteName: string;
  earnedAt: Date | string;
  badgeCode: string;
  badgeName: string;
};

export type StreakSourceRow = {
  athleteId: string;
  athleteName: string;
  lastEventAt: Date | string;
  count: number;
  streakType: "ATTENDANCE" | "PR";
};

export type ScoreSourceRow = {
  athleteId: string;
  athleteName: string;
  createdAt: Date | string;
  wodName: string;
  scoreId: string;
  isFirstEver: boolean;
};

function toIso(d: Date | string): string {
  return typeof d === "string" ? new Date(d).toISOString() : d.toISOString();
}

/**
 * Streak milestones we surface. 7/14/30/60/90/180/365 days.
 * The helper only flags streaks whose count crosses one of these values,
 * so the feed doesn't repeat one event per day.
 */
const STREAK_MILESTONES = new Set([7, 14, 30, 60, 90, 180, 365]);

export function buildFeedEvents(input: {
  prs?: PRSourceRow[];
  badges?: BadgeSourceRow[];
  streaks?: StreakSourceRow[];
  firstScores?: ScoreSourceRow[];
  since?: Date | string;
}): FeedEvent[] {
  const events: FeedEvent[] = [];

  for (const p of input.prs ?? []) {
    const deltaPct =
      p.prevBest === null || p.prevBest <= 0
        ? null
        : Math.round(((p.value - p.prevBest) / p.prevBest) * 1000) / 10;
    events.push({
      type: "PR",
      athleteId: p.athleteId,
      athleteName: p.athleteName,
      ts: toIso(p.achievedAt),
      payload: {
        movementName: p.movementName,
        value: p.value,
        unit: p.unit,
        prevBest: p.prevBest,
        deltaPct,
        scoreId: p.scoreId ?? null,
      },
    });
  }

  for (const b of input.badges ?? []) {
    events.push({
      type: "BADGE",
      athleteId: b.athleteId,
      athleteName: b.athleteName,
      ts: toIso(b.earnedAt),
      payload: { badgeCode: b.badgeCode, badgeName: b.badgeName },
    });
  }

  for (const s of input.streaks ?? []) {
    if (!STREAK_MILESTONES.has(s.count)) continue;
    events.push({
      type: "STREAK",
      athleteId: s.athleteId,
      athleteName: s.athleteName,
      ts: toIso(s.lastEventAt),
      payload: { count: s.count, streakType: s.streakType },
    });
  }

  for (const s of input.firstScores ?? []) {
    if (!s.isFirstEver) continue;
    events.push({
      type: "FIRST_SCORE",
      athleteId: s.athleteId,
      athleteName: s.athleteName,
      ts: toIso(s.createdAt),
      payload: { wodName: s.wodName, scoreId: s.scoreId },
    });
  }

  // Dedup: same (type, athleteId, ts within same day) collapses.
  const seen = new Set<string>();
  const deduped: FeedEvent[] = [];
  for (const e of events.sort((a, b) => (a.ts < b.ts ? 1 : -1))) {
    const day = e.ts.slice(0, 10);
    const key = `${e.type}|${e.athleteId}|${day}|${
      typeof e.payload === "object" && e.payload && "movementName" in e.payload
        ? (e.payload as { movementName: string }).movementName
        : ""
    }`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(e);
  }

  if (input.since) {
    const cursor = toIso(input.since);
    return deduped.filter((e) => e.ts > cursor);
  }
  return deduped;
}
