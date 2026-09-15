"use server";

import { requireCachedSession } from "@/server/session";
import { withTenant, db as rawDb } from "../db";
import type { ScoreType } from "@/lib/validations/wod";
import { scoreDirection, unitDirection } from "@/lib/scores/direction";
import {
  buildRanking,
  toBoard,
  LEADERBOARD_VISIBLE_ROWS,
  SCORE_SCAN_LIMIT,
  type RankingCandidate,
  type BoardRow,
} from "@/lib/scores/leaderboard";

async function requireSession() {
  return requireCachedSession();
}

/**
 * A ranked row. `rank` is competition ranking (ties share a rank) and `source`
 * says which ledger it came from — `pr` only appears on 1RM strength boards.
 */
export type LeaderboardEntry = BoardRow;

export type WODLeaderboard = {
  wodId: string;
  wodName: string;
  scoreType: ScoreType;
  entries: LeaderboardEntry[];
  /**
   * The athlete's own row when it fell outside `entries` — the UI pins it as
   * "Tu posición" so the board always answers "where am I".
   */
  myEntry: LeaderboardEntry | null;
  /** The athlete's rank wherever it is, or null when they have no result. */
  myRank: number | null;
  totalAthletes: number;
  /**
   * True when this board unions the per-movement PR ledger into the WOD's own
   * scores (single-movement 1RM strength WODs only).
   */
  includesPRLedger: boolean;
};

/** Resolve the signed-in athlete's id for this tenant, or null. */
async function getMyAthleteId(
  userId: string,
  tenantId: string,
): Promise<string | null> {
  const db = withTenant(tenantId);
  const me = await db.athlete.findFirst({
    where: { userId },
    select: { id: true },
  });
  return me?.id ?? null;
}

/**
 * Best-score-per-athlete for a given WOD, ranked by metric direction.
 *
 * Two audit findings (2026-09-15, S10) are fixed here:
 *
 *  - **Direction and truncation.** The previous query had no `orderBy` and a
 *    `take: 200`, so the cap was applied in whatever order Postgres returned
 *    rows — the top score could be silently dropped — and the final sort was an
 *    inline ternary that only knew about TIME. Ranking now goes through
 *    `buildRanking`, and best-per-athlete is resolved at the DB level with
 *    `groupBy` so there is no row cap to truncate.
 *
 *  - **Source.** For a single-movement 1RM strength WOD, the board now unions
 *    the per-movement `PR` ledger with the WOD's own `Score` rows. Emma's
 *    120 kg Back Squat PR lived only in `PR` (written by `submitScore` for ANY
 *    strength WOD on that movement, by the seed derivation, and by backfill
 *    scripts), while the board read only `Score` rows for one `wodId` — so a
 *    board topping at 111 kg contradicted her profile's "#1 de 36". They are
 *    the same fact and are now read from the same union.
 */
export async function getWODLeaderboard(
  wodId: string,
): Promise<WODLeaderboard> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const wod = await db.wOD.findUnique({
    where: { id: wodId },
    select: {
      id: true,
      name: true,
      scoreType: true,
      type: true,
      movements: { select: { movementId: true } },
    },
  });
  if (!wod) throw new Error("WOD not found");

  const scoreType = wod.scoreType as ScoreType;
  const direction = scoreDirection(scoreType);
  const myAthleteId = await getMyAthleteId(session.user.id, tenantId);

  // The row cap is applied AFTER ordering by the metric, so it can only ever
  // drop the worst rows. The previous query had `take: 200` with no `orderBy`
  // at all, which let Postgres drop the leader.
  const scoreRows = await db.score.findMany({
    where: { wodId, scaling: { not: "SCALED" } },
    orderBy: { value: direction },
    take: SCORE_SCAN_LIMIT,
    select: {
      athleteId: true,
      value: true,
      unit: true,
      scaling: true,
      createdAt: true,
      athlete: { select: { firstName: true, lastName: true } },
    },
  });

  const scores: RankingCandidate[] = scoreRows.map((s) => ({
    athleteId: s.athleteId,
    athleteName: `${s.athlete.firstName} ${s.athlete.lastName}`.trim(),
    value: Number(s.value),
    unit: s.unit,
    scaling: s.scaling,
    achievedAt: s.createdAt,
    source: "score" as const,
  }));

  // 1RM strength WOD on a single movement → the PR ledger measures the same
  // thing, so it belongs on the same board.
  const isSingleMovement1RM =
    wod.type === "STRENGTH" &&
    scoreType === "WEIGHT" &&
    wod.movements.length === 1;

  let prs: RankingCandidate[] = [];
  if (isSingleMovement1RM) {
    const ledger = await db.pR.findMany({
      where: { movementId: wod.movements[0].movementId },
      select: {
        athleteId: true,
        value: true,
        unit: true,
        achievedAt: true,
        athlete: { select: { firstName: true, lastName: true } },
      },
    });
    prs = ledger.map((p) => ({
      athleteId: p.athleteId,
      athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`.trim(),
      value: Number(p.value),
      unit: p.unit,
      scaling: "RX",
      achievedAt: p.achievedAt,
      source: "pr" as const,
    }));
  }

  const board = toBoard(
    buildRanking({ scores, prs, direction }),
    myAthleteId,
    LEADERBOARD_VISIBLE_ROWS,
  );

  return {
    wodId: wod.id,
    wodName: wod.name,
    scoreType,
    ...board,
    includesPRLedger: isSingleMovement1RM,
  };
}

export type MovementLeaderboard = {
  movementId: string;
  movementName: string;
  entries: LeaderboardEntry[];
  myEntry: LeaderboardEntry | null;
  myRank: number | null;
  totalAthletes: number;
  unit: string;
};

/**
 * PRs leaderboard for a single movement.
 *
 * `PR` has no `scoreType`, so direction is inferred from the stored `unit`:
 * a 1-mile-run PR in seconds ranks ascending, a Back Squat in kg descending.
 * The previous `orderBy: { value: "desc" }` silently ranked every time-based
 * movement backwards.
 */
export async function getMovementLeaderboard(
  movementId: string,
): Promise<MovementLeaderboard> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const movement = await db.movement.findUnique({
    where: { id: movementId },
    select: { id: true, name: true },
  });
  if (!movement) throw new Error("Movement not found");

  const myAthleteId = await getMyAthleteId(session.user.id, tenantId);

  const prs = await db.pR.findMany({
    where: { movementId },
    select: {
      athleteId: true,
      value: true,
      unit: true,
      achievedAt: true,
      athlete: { select: { firstName: true, lastName: true } },
    },
  });

  // All PRs on one movement share a unit in practice; take the modal one.
  const unit = prs[0]?.unit ?? "kg";
  const direction = unitDirection(unit);

  const candidates: RankingCandidate[] = prs.map((p) => ({
    athleteId: p.athleteId,
    athleteName: `${p.athlete.firstName} ${p.athlete.lastName}`.trim(),
    value: Number(p.value),
    unit: p.unit,
    scaling: "RX",
    achievedAt: p.achievedAt,
    source: "pr" as const,
  }));

  const board = toBoard(
    buildRanking({ scores: candidates, direction }),
    myAthleteId,
    LEADERBOARD_VISIBLE_ROWS,
  );

  return {
    movementId: movement.id,
    movementName: movement.name,
    ...board,
    unit,
  };
}

export type AttendanceLeader = {
  athleteId: string;
  athleteName: string;
  attendedCount: number;
  rank: number;
  isMe: boolean;
};

export type AttendanceLeaderboard = {
  entries: AttendanceLeader[];
  myEntry: AttendanceLeader | null;
  myRank: number | null;
  totalAthletes: number;
};

/**
 * Flat list, kept for the admin board (`/admin/leaderboards`), which shows a
 * longer table and has no "me" to pin. Same ranking, same 20-row window.
 */
export async function getWeeklyAttendanceLeaderboard(
  weeksBack = 0,
): Promise<AttendanceLeader[]> {
  const board = await rankWeeklyAttendance(weeksBack);
  return board.slice(0, 20);
}

/** Athlete-facing board: visible window plus the pinned "Tu posición" row. */
export async function getWeeklyAttendanceBoard(
  weeksBack = 0,
): Promise<AttendanceLeaderboard> {
  const ranked = await rankWeeklyAttendance(weeksBack);
  const top = ranked.slice(0, LEADERBOARD_VISIBLE_ROWS);
  const self = ranked.find((r) => r.isMe) ?? null;
  const selfVisible =
    self !== null && top.some((r) => r.athleteId === self.athleteId);

  return {
    entries: top,
    myEntry: self !== null && !selfVisible ? self : null,
    myRank: self?.rank ?? null,
    totalAthletes: ranked.length,
  };
}

async function rankWeeklyAttendance(
  weeksBack: number,
): Promise<AttendanceLeader[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;

  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - now.getDay() - 7 * weeksBack);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const [attendedCounts, myAthleteId] = await Promise.all([
    rawDb.booking.groupBy({
      by: ["athleteId"],
      where: {
        tenantId,
        status: "ATTENDED",
        class: { startsAt: { gte: start, lt: end } },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    getMyAthleteId(session.user.id, tenantId),
  ]);

  const athleteIds = attendedCounts.map((a) => a.athleteId);
  const athletes =
    athleteIds.length > 0
      ? await rawDb.athlete.findMany({
          where: { tenantId, id: { in: athleteIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];

  const nameMap = new Map(
    athletes.map((a) => [a.id, `${a.firstName} ${a.lastName}`.trim()]),
  );

  // Competition ranking on the attendance count (more is better).
  let lastCount: number | null = null;
  let lastRank = 0;
  return attendedCounts.map((a, index) => {
    const count = a._count.id;
    const rank =
      lastCount !== null && count === lastCount ? lastRank : index + 1;
    lastCount = count;
    lastRank = rank;
    return {
      athleteId: a.athleteId,
      athleteName: nameMap.get(a.athleteId) ?? "",
      attendedCount: count,
      rank,
      isMe: a.athleteId === myAthleteId,
    };
  });
}

export async function listWODOptions() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.wOD.findMany({
    where: { isActive: true },
    select: { id: true, name: true, scoreType: true },
    orderBy: { name: "asc" },
  });
}

export async function listMovementOptions() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.movement.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
