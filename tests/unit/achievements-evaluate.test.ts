import { describe, it, expect, beforeEach, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findManyBadge: vi.fn(),
  findManyAchievement: vi.fn(),
  createAchievement: vi.fn(),
  createXP: vi.fn(),
  aggregateXP: vi.fn(),
  countBooking: vi.fn(),
  findUniqueStreak: vi.fn(),
  countPR: vi.fn(),
  countScore: vi.fn(),
  findFirstBodyMetric: vi.fn(),
  findManyPR: vi.fn(),
}));

const {
  findManyBadge,
  findManyAchievement,
  createAchievement,
  createXP,
  countBooking,
  findUniqueStreak,
  countPR,
  countScore,
  findFirstBodyMetric,
  findManyPR,
} = mocks;

vi.mock("@/server/db", () => ({
  db: {
    xPLedger: { create: mocks.createXP, aggregate: mocks.aggregateXP },
  },
  withTenant: () => ({
    badge: { findMany: mocks.findManyBadge },
    achievement: {
      findMany: mocks.findManyAchievement,
      create: mocks.createAchievement,
    },
    booking: { count: mocks.countBooking },
    streak: {
      findUnique: (args: { where: { athleteId_type: unknown } }) =>
        mocks.findUniqueStreak(args),
    },
    pR: { count: mocks.countPR, findMany: mocks.findManyPR },
    score: { count: mocks.countScore },
    bodyMetric: { findFirst: mocks.findFirstBodyMetric },
  }),
}));

import {
  runAchievementEvaluation,
  awardXP,
} from "@/server/achievements/evaluate";

const TENANT = "tenant_1";
const ATHLETE = "athlete_1";

const firstClass = {
  id: "b_first_class",
  code: "first-class",
  name: "Primera clase",
  description: "Completaste tu primera clase",
  iconUrl: null,
  criteria: { type: "attendance", count: 1 },
};
const streak7 = {
  id: "b_streak_7",
  code: "streak-7",
  name: "7 días seguidos",
  description: "7 días consecutivos",
  iconUrl: null,
  criteria: { type: "attendance_streak", count: 7 },
};
const firstPr = {
  id: "b_first_pr",
  code: "first-pr",
  name: "PR desbloqueado",
  description: "Tu primer PR",
  iconUrl: null,
  criteria: { type: "pr", count: 1 },
};

beforeEach(() => {
  vi.clearAllMocks();
  // Default DB resolutions.
  findManyAchievement.mockResolvedValue([]);
  findUniqueStreak.mockReturnValue({
    then: (fn: (s: unknown) => unknown) => fn(null),
  });
  countBooking.mockResolvedValue(0);
  countPR.mockResolvedValue(0);
  countScore.mockResolvedValue(0);
  findFirstBodyMetric.mockResolvedValue(null);
  findManyPR.mockResolvedValue([]);
  createAchievement.mockResolvedValue({});
  createXP.mockResolvedValue({});
});

describe("runAchievementEvaluation · trigger filtering", () => {
  it("ATTENDANCE only evaluates attendance kinds", async () => {
    findManyBadge.mockResolvedValue([firstClass, streak7, firstPr]);
    countBooking.mockResolvedValue(1);
    findUniqueStreak.mockReturnValue({
      then: (fn: (s: unknown) => unknown) => fn({ count: 0 }),
    });

    const res = await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "ATTENDANCE",
    });
    // PR badge should be skipped completely (no count for PRs in attendance trigger).
    expect(countPR).not.toHaveBeenCalled();
    // first-class unlocked, streak-7 not (count 0).
    expect(res.unlockedBadges.map((b) => b.code)).toEqual(["first-class"]);
  });

  it("PR trigger skips attendance kinds", async () => {
    findManyBadge.mockResolvedValue([firstClass, firstPr]);
    countPR.mockResolvedValue(1);

    const res = await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "PR",
    });
    expect(countBooking).not.toHaveBeenCalled();
    expect(res.unlockedBadges.map((b) => b.code)).toEqual(["first-pr"]);
  });
});

describe("runAchievementEvaluation · idempotency", () => {
  it("does not re-grant already owned achievements", async () => {
    findManyBadge.mockResolvedValue([firstClass]);
    findManyAchievement.mockResolvedValue([{ badgeId: firstClass.id }]);

    const res = await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "ATTENDANCE",
    });
    expect(res.unlockedBadges).toHaveLength(0);
    expect(createAchievement).not.toHaveBeenCalled();
    expect(createXP).not.toHaveBeenCalled();
  });

  it("survives unique-violation on Achievement.create (race-safe)", async () => {
    findManyBadge.mockResolvedValue([firstClass]);
    countBooking.mockResolvedValue(1);
    createAchievement.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      }),
    );

    const res = await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "ATTENDANCE",
    });
    expect(res.unlockedBadges).toHaveLength(0);
    // XP should NOT be granted when achievement create fails
    expect(createXP).not.toHaveBeenCalled();
  });
});

describe("runAchievementEvaluation · uses precomputed state when given", () => {
  it("skips DB reads on state-provided path", async () => {
    findManyBadge.mockResolvedValue([firstClass]);
    const res = await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "ATTENDANCE",
      state: {
        attendanceCount: 1,
        attendanceStreak: 0,
        prCount: 0,
        rxScoreCount: 0,
        prByMovement: {},
        skillLevelsAchieved: new Set<string>(),
      },
    });
    expect(countBooking).not.toHaveBeenCalled();
    expect(res.unlockedBadges).toHaveLength(1);
    expect(res.xpAwarded).toBeGreaterThan(0);
  });
});

describe("runAchievementEvaluation · XP granted with badge", () => {
  it("writes XPLedger row for each unlocked badge", async () => {
    findManyBadge.mockResolvedValue([firstClass]);
    countBooking.mockResolvedValue(1);

    await runAchievementEvaluation({
      tenantId: TENANT,
      athleteId: ATHLETE,
      trigger: "ATTENDANCE",
    });

    expect(createAchievement).toHaveBeenCalledTimes(1);
    expect(createXP).toHaveBeenCalledTimes(1);
    expect(createXP.mock.calls[0][0].data).toMatchObject({
      tenantId: TENANT,
      athleteId: ATHLETE,
      reason: "BADGE_first-class",
      sourceType: "Achievement",
      sourceId: firstClass.id,
    });
  });
});

describe("awardXP idempotency", () => {
  it("returns awarded:true on success", async () => {
    const r = await awardXP({
      tenantId: TENANT,
      athleteId: ATHLETE,
      amount: 10,
      reason: "ATTENDANCE",
      sourceType: "Booking",
      sourceId: "bk_1",
    });
    expect(r.awarded).toBe(true);
    expect(createXP).toHaveBeenCalledOnce();
  });
  it("returns awarded:false on unique violation", async () => {
    createXP.mockRejectedValueOnce(
      Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    );
    const r = await awardXP({
      tenantId: TENANT,
      athleteId: ATHLETE,
      amount: 10,
      reason: "ATTENDANCE",
      sourceType: "Booking",
      sourceId: "bk_1",
    });
    expect(r.awarded).toBe(false);
  });
  it("rejects zero / negative amounts", async () => {
    const r = await awardXP({
      tenantId: TENANT,
      athleteId: ATHLETE,
      amount: 0,
      reason: "X",
      sourceType: "X",
      sourceId: "x",
    });
    expect(r.awarded).toBe(false);
    expect(createXP).not.toHaveBeenCalled();
  });
});
