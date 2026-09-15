import { describe, it, expect } from "vitest";
import {
  bestPerAthlete,
  buildRanking,
  mergeRankingSources,
  pinSelf,
  rankEntries,
  type RankingCandidate,
} from "@/lib/scores/leaderboard";
import { scoreDirection, unitDirection } from "@/lib/scores/direction";

const at = (iso: string) => new Date(iso);

function candidate(
  partial: Partial<RankingCandidate> & { athleteId: string; value: number },
): RankingCandidate {
  return {
    athleteName: `Atleta ${partial.athleteId}`,
    unit: "kg",
    scaling: "RX",
    achievedAt: at("2026-09-01T10:00:00.000Z"),
    source: "score",
    ...partial,
  };
}

describe("best per athlete", () => {
  it("keeps the fastest attempt on a TIME board", () => {
    const rows = [
      candidate({ athleteId: "emma", value: 2480, unit: "s" }),
      candidate({ athleteId: "emma", value: 2600, unit: "s" }),
      candidate({ athleteId: "leo", value: 2500, unit: "s" }),
    ];
    const best = bestPerAthlete(rows, "asc");
    expect(best).toHaveLength(2);
    expect(best.find((r) => r.athleteId === "emma")!.value).toBe(2480);
  });

  it("keeps the heaviest attempt on a WEIGHT board", () => {
    const rows = [
      candidate({ athleteId: "emma", value: 110 }),
      candidate({ athleteId: "emma", value: 120 }),
    ];
    expect(bestPerAthlete(rows, "desc")[0].value).toBe(120);
  });

  it("prefers the in-WOD score over the PR ledger on an exact tie", () => {
    const rows = [
      candidate({ athleteId: "emma", value: 120, source: "pr" }),
      candidate({ athleteId: "emma", value: 120, source: "score" }),
    ];
    expect(bestPerAthlete(rows, "desc")[0].source).toBe("score");
  });
});

describe("ranking direction", () => {
  it("ranks a TIME board ascending", () => {
    const ranked = buildRanking({
      scores: [
        candidate({ athleteId: "a", value: 708, unit: "s" }),
        candidate({ athleteId: "b", value: 544, unit: "s" }),
        candidate({ athleteId: "c", value: 244, unit: "s" }),
        candidate({ athleteId: "d", value: 540, unit: "s" }),
      ],
      direction: scoreDirection("TIME"),
    });
    expect(ranked.map((r) => r.athleteId)).toEqual(["c", "d", "b", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it("ranks REPS, WEIGHT and ROUNDS_REPS boards descending", () => {
    for (const scoreType of ["REPS", "WEIGHT", "ROUNDS_REPS"] as const) {
      const ranked = buildRanking({
        scores: [
          candidate({ athleteId: "low", value: 90 }),
          candidate({ athleteId: "high", value: 120 }),
          candidate({ athleteId: "mid", value: 111 }),
        ],
        direction: scoreDirection(scoreType),
      });
      expect(ranked.map((r) => r.athleteId)).toEqual(["high", "mid", "low"]);
    }
  });

  it("ranks a PR board by its unit when there is no scoreType", () => {
    const rows = [
      candidate({ athleteId: "slow", value: 400, unit: "s" }),
      candidate({ athleteId: "fast", value: 320, unit: "s" }),
    ];
    expect(
      rankEntries(rows, unitDirection("s")).map((r) => r.athleteId),
    ).toEqual(["fast", "slow"]);
    expect(
      rankEntries(
        [
          candidate({ athleteId: "light", value: 80 }),
          candidate({ athleteId: "heavy", value: 130 }),
        ],
        unitDirection("kg"),
      ).map((r) => r.athleteId),
    ).toEqual(["heavy", "light"]);
  });

  it("gives tied values the same rank and skips the next one", () => {
    const ranked = buildRanking({
      scores: [
        candidate({ athleteId: "a", value: 100 }),
        candidate({
          athleteId: "b",
          value: 90,
          achievedAt: at("2026-08-01T10:00:00.000Z"),
        }),
        candidate({
          athleteId: "c",
          value: 90,
          achievedAt: at("2026-08-05T10:00:00.000Z"),
        }),
        candidate({ athleteId: "d", value: 80 }),
      ],
      direction: "desc",
    });
    expect(ranked.map((r) => [r.athleteId, r.rank])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 2],
      ["d", 4],
    ]);
  });
});

describe("union of scores and the PR ledger (Emma's 120 kg Back Squat)", () => {
  // Audit evidence: Emma's profile said "#1 de 36" for Back Squat (PR ledger,
  // per movement) while the 1RM Back Squat board topped at 111 kg (Score rows,
  // per wodId). The union has to put her back on the board she leads.
  const boardScores = [
    candidate({ athleteId: "leo", athleteName: "Leo", value: 111 }),
    candidate({ athleteId: "vale", athleteName: "Vale", value: 105 }),
  ];
  const ledgerPRs = [
    candidate({
      athleteId: "emma",
      athleteName: "Emma Soto",
      value: 120,
      source: "pr",
    }),
    candidate({
      athleteId: "leo",
      athleteName: "Leo",
      value: 111,
      source: "pr",
    }),
  ];

  it("leaves the board untouched when no PRs are supplied", () => {
    const ranked = buildRanking({ scores: boardScores, direction: "desc" });
    expect(ranked.map((r) => r.athleteId)).toEqual(["leo", "vale"]);
    expect(ranked.some((r) => r.athleteId === "emma")).toBe(false);
  });

  it("puts the PR-only athlete on top once the ledger is unioned in", () => {
    const ranked = buildRanking({
      scores: boardScores,
      prs: ledgerPRs,
      direction: "desc",
    });
    expect(ranked[0]).toMatchObject({
      athleteId: "emma",
      value: 120,
      rank: 1,
      source: "pr",
    });
    // Leo appears once, not twice, and keeps his in-WOD score provenance.
    expect(ranked.filter((r) => r.athleteId === "leo")).toHaveLength(1);
    expect(ranked.find((r) => r.athleteId === "leo")!.source).toBe("score");
    expect(ranked).toHaveLength(3);
  });

  it("merges without dropping either side", () => {
    expect(
      mergeRankingSources({ scores: boardScores, prs: ledgerPRs }),
    ).toHaveLength(4);
    expect(mergeRankingSources({ scores: boardScores })).toHaveLength(2);
  });
});

describe("pinned 'Tu posición' row", () => {
  const ranked = buildRanking({
    scores: Array.from({ length: 10 }, (_, i) =>
      candidate({ athleteId: `a${i}`, value: 200 - i * 5 }),
    ).concat(candidate({ athleteId: "emma", value: 60 })),
    direction: "desc",
  });

  it("pins the athlete's row when it falls outside the visible head", () => {
    const board = pinSelf(ranked, "emma", 4);
    expect(board.top).toHaveLength(4);
    expect(board.top.some((r) => r.athleteId === "emma")).toBe(false);
    expect(board.pinnedSelf).not.toBeNull();
    expect(board.pinnedSelf!.athleteId).toBe("emma");
    expect(board.pinnedSelf!.rank).toBe(11);
    expect(board.total).toBe(11);
  });

  it("does not duplicate the row when the athlete is already visible", () => {
    const board = pinSelf(ranked, "a0", 4);
    expect(board.top[0].athleteId).toBe("a0");
    expect(board.pinnedSelf).toBeNull();
    expect(board.self!.rank).toBe(1);
  });

  it("returns no pinned row for an athlete with no entry, or no identity", () => {
    expect(pinSelf(ranked, "ghost", 4).pinnedSelf).toBeNull();
    expect(pinSelf(ranked, null, 4).pinnedSelf).toBeNull();
    expect(pinSelf(ranked, undefined, 4).self).toBeNull();
  });

  it("handles an empty board", () => {
    const board = pinSelf([], "emma", 4);
    expect(board).toEqual({
      top: [],
      pinnedSelf: null,
      self: null,
      total: 0,
    });
  });
});
