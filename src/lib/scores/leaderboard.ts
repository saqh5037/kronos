/**
 * Pure leaderboard assembly: best-per-athlete, metric-direction ranking, and
 * the pinned "Tu posición" row.
 *
 * Audit 2026-09-15 (S10) found two separate defects this module fixes:
 *
 *  1. Direction. Rankings were built with either no `orderBy` at all
 *     (`getWODLeaderboard`) or `createdAt desc` (`listScoresForWOD`, which the
 *     home board reuses), so a TIME board showed 11:48 above 4:04.
 *  2. Source. A 1RM board read only `Score` rows for one `wodId`, while the
 *     athlete's profile rank reads the per-movement `PR` ledger. The same lift
 *     therefore had two different truths on two screens (Emma's 120 kg Back
 *     Squat PR vs a board topping at 111 kg). `mergeRankingSources` unions both
 *     for single-movement strength boards and keeps provenance per row.
 *
 * Pure: no DB, no auth, no React.
 */

import {
  compareByDirection,
  isBetterByDirection,
  type MetricDirection,
} from "./direction";

/**
 * How many rows an athlete-facing board shows before the pinned "Tu posición"
 * row kicks in. Lives here (not in the `"use server"` action) because a server
 * action module may only export async functions.
 */
export const LEADERBOARD_VISIBLE_ROWS = 10;

/** The home "hoy" card is a teaser, not a board: four rows plus the pinned row. */
export const HOME_BOARD_ROWS = 4;

/**
 * Upper bound on rows scanned to build one board. Safe because the query that
 * uses it orders by the metric first, so the cap drops the WORST rows — unlike
 * the previous `take: 200` with no `orderBy`, which dropped arbitrary ones and
 * could hide the leader.
 */
export const SCORE_SCAN_LIMIT = 500;

/** Where a ranking row came from — the board shows the union for 1RM WODs. */
export type RankingSource = "score" | "pr";

export type RankingCandidate = {
  athleteId: string;
  athleteName: string;
  value: number;
  unit: string;
  scaling: string;
  achievedAt: Date;
  source: RankingSource;
};

export type RankedEntry = RankingCandidate & { rank: number };

/**
 * Collapse many attempts into one row per athlete, keeping their best for the
 * given direction. On an exact tie a `score` row wins over a `pr` row: the
 * in-WOD attempt is the one the board is nominally about.
 */
export function bestPerAthlete(
  rows: readonly RankingCandidate[],
  direction: MetricDirection,
): RankingCandidate[] {
  const best = new Map<string, RankingCandidate>();
  for (const row of rows) {
    const current = best.get(row.athleteId);
    if (!current) {
      best.set(row.athleteId, row);
      continue;
    }
    if (isBetterByDirection(current.value, row.value, direction)) {
      best.set(row.athleteId, row);
      continue;
    }
    if (
      row.value === current.value &&
      row.source === "score" &&
      current.source === "pr"
    ) {
      best.set(row.athleteId, row);
    }
  }
  return Array.from(best.values());
}

/**
 * Union of the two ledgers. `prs` is only passed for boards where the two
 * sources genuinely measure the same thing (single-movement 1RM strength WODs);
 * for everything else the caller passes an empty list and nothing changes.
 */
export function mergeRankingSources(input: {
  scores: readonly RankingCandidate[];
  prs?: readonly RankingCandidate[];
}): RankingCandidate[] {
  return [...input.scores, ...(input.prs ?? [])];
}

/**
 * Competition ranking (1, 2, 2, 4) over best-per-athlete rows, sorted by metric
 * direction. Ties break on the earlier `achievedAt` so the order is stable and
 * the athlete who got there first is listed first.
 */
export function rankEntries(
  rows: readonly RankingCandidate[],
  direction: MetricDirection,
): RankedEntry[] {
  const sorted = [...rows].sort((a, b) => {
    const byValue = compareByDirection(a.value, b.value, direction);
    if (byValue !== 0) return byValue;
    const byDate = a.achievedAt.getTime() - b.achievedAt.getTime();
    if (byDate !== 0) return byDate;
    return a.athleteId.localeCompare(b.athleteId);
  });

  const ranked: RankedEntry[] = [];
  let lastValue: number | null = null;
  let lastRank = 0;
  sorted.forEach((row, index) => {
    const rank = lastValue !== null && row.value === lastValue ? lastRank : index + 1;
    ranked.push({ ...row, rank });
    lastValue = row.value;
    lastRank = rank;
  });
  return ranked;
}

/** One call that goes from raw rows to a ranked board. */
export function buildRanking(input: {
  scores: readonly RankingCandidate[];
  prs?: readonly RankingCandidate[];
  direction: MetricDirection;
}): RankedEntry[] {
  return rankEntries(
    bestPerAthlete(mergeRankingSources(input), input.direction),
    input.direction,
  );
}

export type PinnedBoard = {
  /** The visible head of the board. */
  top: RankedEntry[];
  /**
   * The athlete's own row when it falls OUTSIDE `top` — rendered as a pinned
   * "Tu posición" row so the board always answers "where am I".
   * `null` when the athlete is already visible in `top`, or has no row at all.
   */
  pinnedSelf: RankedEntry | null;
  /** The athlete's row wherever it is, for callers that only need the rank. */
  self: RankedEntry | null;
  total: number;
};

/**
 * Slice the head of a ranked board and pin the athlete's own row when it did
 * not make the cut. `selfAthleteId` may be null (anonymous / no profile).
 */
export function pinSelf(
  ranked: readonly RankedEntry[],
  selfAthleteId: string | null | undefined,
  topN: number,
): PinnedBoard {
  const top = ranked.slice(0, Math.max(0, topN));
  const self = selfAthleteId
    ? (ranked.find((r) => r.athleteId === selfAthleteId) ?? null)
    : null;
  const visible =
    self !== null && top.some((r) => r.athleteId === self.athleteId);
  return {
    top,
    pinnedSelf: self !== null && !visible ? self : null,
    self,
    total: ranked.length,
  };
}

/** A ranked row as the UI consumes it. */
export type BoardRow = RankedEntry & { isMe: boolean };

/**
 * The render-ready board every athlete-facing ranking returns: a visible head,
 * the pinned "Tu posición" row when the athlete did not make the head, and the
 * cohort size so the UI can say "#11 de 36" instead of "#11".
 */
export type Board = {
  entries: BoardRow[];
  myEntry: BoardRow | null;
  myRank: number | null;
  totalAthletes: number;
};

export function toBoard(
  ranked: readonly RankedEntry[],
  selfAthleteId: string | null | undefined,
  topN: number = LEADERBOARD_VISIBLE_ROWS,
): Board {
  const pinned = pinSelf(ranked, selfAthleteId, topN);
  const withMe = (row: RankedEntry): BoardRow => ({
    ...row,
    isMe: row.athleteId === selfAthleteId,
  });
  return {
    entries: pinned.top.map(withMe),
    myEntry: pinned.pinnedSelf ? withMe(pinned.pinnedSelf) : null,
    myRank: pinned.self?.rank ?? null,
    totalAthletes: pinned.total,
  };
}
