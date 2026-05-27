/**
 * Unit tests for createMyQuickWod — the personal/quick WOD save server action.
 *
 * P0 regression: a FREE athlete with a Personal Box (slug `me-*`) and NO box
 * programming must be able to save a personal WOD without the action throwing
 * a 500. We mock the full Prisma surface the action touches so the test runs
 * without a live database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSessionMock = vi.hoisted(() => vi.fn());
const boxFindUnique = vi.hoisted(() => vi.fn());
const athleteFindFirst = vi.hoisted(() => vi.fn());
const scoreFindMany = vi.hoisted(() => vi.fn());
const transactionMock = vi.hoisted(() => vi.fn());
const auditEventCreate = vi.hoisted(() => vi.fn());

// Raw prisma client (prismaBase). Used for: box.findUnique, $transaction,
// auditEvent.create (via logAudit).
const rawDb = vi.hoisted(() => ({
  box: { findUnique: boxFindUnique },
  $transaction: transactionMock,
  auditEvent: { create: auditEventCreate },
  alertRule: { findMany: vi.fn().mockResolvedValue([]) },
  user: { findMany: vi.fn().mockResolvedValue([]) },
}));

// withTenant() returns a tenant-scoped client. The action uses
// athlete.findFirst + score.findMany on it.
const tenantDb = vi.hoisted(() => ({
  athlete: { findFirst: athleteFindFirst },
  score: { findMany: scoreFindMany },
}));

vi.mock("../../src/server/db", () => ({
  db: rawDb,
  withTenant: vi.fn(() => tenantDb),
}));

vi.mock("next-auth", () => ({ getServerSession: getServerSessionMock }));
vi.mock("../../src/server/auth", () => ({ authOptions: {} }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { createMyQuickWod } from "../../src/server/actions/atleta-quick-wod";

const PERSONAL_SESSION = {
  user: { id: "user-1", tenantId: "box-personal-1" },
};

// Mirrors signup: personal box has slug `me-*` and disciplineId null.
const PERSONAL_BOX = { slug: "me-deadbeef" };

const FRAN_INPUT = {
  name: "Fran",
  type: "FORTIME" as const,
  scoreType: "TIME" as const,
  timeCapSeconds: null,
  scoreValue: 270, // 4:30
  scoreReps: null,
  scaling: "RX" as const,
  notes: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  getServerSessionMock.mockResolvedValue(PERSONAL_SESSION);
  boxFindUnique.mockResolvedValue(PERSONAL_BOX);
  athleteFindFirst.mockResolvedValue({ id: "athlete-1" });
  scoreFindMany.mockResolvedValue([]); // boxless athlete: no prior scores
  auditEventCreate.mockResolvedValue({ id: "audit-1" });
  // Default: transaction succeeds, returning created wod + score ids.
  transactionMock.mockImplementation(async (cb: (tx: unknown) => unknown) => {
    const tx = {
      wOD: { create: vi.fn().mockResolvedValue({ id: "wod-1" }) },
      score: { create: vi.fn().mockResolvedValue({ id: "score-1" }) },
    };
    return cb(tx);
  });
});

describe("createMyQuickWod — boxless athlete (Personal Box)", () => {
  it("saves a personal WOD + score for a boxless athlete without throwing", async () => {
    const result = await createMyQuickWod(FRAN_INPUT);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.wodId).toBe("wod-1");
      expect(result.scoreId).toBe("score-1");
      expect(result.pr.isFirst).toBe(true);
      expect(result.pr.wodName).toBe("Fran");
    }
  });

  it("returns a structured PR result on the first score (no crash on null previousBest)", async () => {
    const result = await createMyQuickWod(FRAN_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pr.previousBest).toBeNull();
      expect(result.pr.newValue).toBe(270);
    }
  });

  it("does not bubble a 500 when the audit log write fails", async () => {
    // logAudit must be best-effort: an audit failure must NOT crash the save.
    auditEventCreate.mockRejectedValueOnce(new Error("audit table locked"));
    const result = await createMyQuickWod(FRAN_INPUT);
    expect(result.ok).toBe(true);
  });

  it("returns a structured error (not a 500) when the DB write throws", async () => {
    // P0: in production the save threw a raw error → 500 + React #310 via the
    // error boundary. A boxless athlete must get a graceful error, never a crash.
    transactionMock.mockRejectedValueOnce(new Error("db write failed"));
    const result = await createMyQuickWod(FRAN_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("SAVE_FAILED");
      expect(typeof result.message).toBe("string");
    }
  });

  it("returns a structured error when the PR-detection query throws", async () => {
    scoreFindMany.mockRejectedValueOnce(new Error("relation query failed"));
    const result = await createMyQuickWod(FRAN_INPUT);
    expect(result.ok).toBe(false);
  });

  it("ROUNDS_REPS: 5 rounds + 12 reps encodes to 5.12, not 5.012", async () => {
    const input = {
      name: "Cindy",
      type: "AMRAP" as const,
      scoreType: "ROUNDS_REPS" as const,
      timeCapSeconds: 1200,
      scoreValue: 5,
      scoreReps: 12,
      scaling: "RX" as const,
      notes: null,
    };

    let savedValue: number | undefined;
    transactionMock.mockImplementationOnce(
      async (cb: (tx: unknown) => unknown) => {
        const tx = {
          wOD: { create: vi.fn().mockResolvedValue({ id: "wod-2" }) },
          score: {
            create: vi
              .fn()
              .mockImplementation(
                async ({ data }: { data: { value: number } }) => {
                  savedValue = data.value;
                  return { id: "score-2" };
                },
              ),
          },
        };
        return cb(tx);
      },
    );

    const result = await createMyQuickWod(input);
    expect(result.ok).toBe(true);
    // Codec: rounds + reps/100 — 5 + 12/100 = 5.12
    expect(savedValue).toBeCloseTo(5.12, 5);
    if (result.ok) {
      // formatScore must round-trip: 5.12 → "5+12"
      const { formatScore } = await import("../../src/lib/scores");
      expect(formatScore(result.pr.newValue, "ROUNDS_REPS")).toBe("5+12");
    }
  });

  it("ROUNDS_REPS: isPR=true when new score beats previous best", async () => {
    // Previous best: 4 rounds + 20 reps = 4.20
    scoreFindMany.mockResolvedValueOnce([{ value: 4.2 }]);

    const input = {
      name: "Cindy",
      type: "AMRAP" as const,
      scoreType: "ROUNDS_REPS" as const,
      timeCapSeconds: 1200,
      scoreValue: 5,
      scoreReps: 12,
      scaling: "RX" as const,
      notes: null,
    };

    const result = await createMyQuickWod(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pr.isPR).toBe(true);
      expect(result.pr.isFirst).toBe(false);
      expect(result.pr.previousBest).toBeCloseTo(4.2, 5);
      expect(result.pr.newValue).toBeCloseTo(5.12, 5);
    }
  });
});
