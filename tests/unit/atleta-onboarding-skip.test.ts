/**
 * TDD — skipAtletaOnboarding server action
 *
 * Tests cover:
 *  - Returns UNAUTH when session is missing
 *  - Returns NOT_FOUND when athlete not found
 *  - Sets onboardingSkippedAt on the athlete record
 *  - Logs ATHLETE_ONBOARDING_SKIPPED audit event
 *  - Returns { ok: true } on success
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../../src/server/db", () => ({
  db: {
    athlete: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
  withTenant: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("../../src/server/auth", () => ({
  authOptions: {},
}));

vi.mock("next-auth/providers/email", () => ({
  default: () => ({ id: "email", type: "email" }),
}));
vi.mock("next-auth/providers/google", () => ({
  default: () => ({ id: "google", type: "oauth" }),
}));
vi.mock("@next-auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({}),
}));

vi.mock("../../src/server/audit", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports after mocks ──────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { db } from "../../src/server/db";
import { logAudit } from "../../src/server/audit";
import { skipAtletaOnboarding } from "../../src/server/actions/atleta-onboarding-v2";

const mockSession = getServerSession as unknown as ReturnType<typeof vi.fn>;
const mockFindFirst = db.athlete.findFirst as unknown as ReturnType<
  typeof vi.fn
>;
const mockUpdate = db.athlete.update as unknown as ReturnType<typeof vi.fn>;
const mockLogAudit = logAudit as unknown as ReturnType<typeof vi.fn>;

const VALID_SESSION = {
  user: {
    id: "user-123",
    tenantId: "tenant-abc",
    role: "ATHLETE",
    email: "atleta@test.com",
  },
};

const MOCK_ATHLETE = { id: "athlete-456" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue(VALID_SESSION);
  mockFindFirst.mockResolvedValue(MOCK_ATHLETE);
  mockUpdate.mockResolvedValue({
    ...MOCK_ATHLETE,
    onboardingSkippedAt: new Date(),
  });
  mockLogAudit.mockResolvedValue(undefined);
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("skipAtletaOnboarding", () => {
  it("returns UNAUTH when session is missing", async () => {
    mockSession.mockResolvedValueOnce(null);
    const result = await skipAtletaOnboarding();
    expect(result).toEqual({
      ok: false,
      error: "UNAUTH",
      message: expect.any(String),
    });
  });

  it("returns UNAUTH when session has no tenantId", async () => {
    mockSession.mockResolvedValueOnce({
      user: { id: "user-123", tenantId: null },
    });
    const result = await skipAtletaOnboarding();
    expect(result).toEqual({
      ok: false,
      error: "UNAUTH",
      message: expect.any(String),
    });
  });

  it("returns NOT_FOUND when athlete does not exist", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    const result = await skipAtletaOnboarding();
    expect(result).toEqual({
      ok: false,
      error: "NOT_FOUND",
      message: expect.any(String),
    });
  });

  it("updates onboardingSkippedAt on the athlete record", async () => {
    await skipAtletaOnboarding();

    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.where.id).toBe(MOCK_ATHLETE.id);
    expect(updateCall.data.onboardingSkippedAt).toBeInstanceOf(Date);
  });

  it("looks up athlete by userId and tenantId", async () => {
    await skipAtletaOnboarding();

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: {
        userId: VALID_SESSION.user.id,
        tenantId: VALID_SESSION.user.tenantId,
      },
      select: { id: true },
    });
  });

  it("logs ATHLETE_ONBOARDING_SKIPPED audit event", async () => {
    await skipAtletaOnboarding();

    expect(mockLogAudit).toHaveBeenCalledOnce();
    const auditCall = mockLogAudit.mock.calls[0][0];
    expect(auditCall.action).toBe("ATHLETE_ONBOARDING_SKIPPED");
    expect(auditCall.tenantId).toBe(VALID_SESSION.user.tenantId);
    expect(auditCall.actorId).toBe(VALID_SESSION.user.id);
    expect(auditCall.targetId).toBe(MOCK_ATHLETE.id);
    expect(auditCall.targetType).toBe("Athlete");
  });

  it("returns { ok: true } on success", async () => {
    const result = await skipAtletaOnboarding();
    expect(result).toEqual({ ok: true });
  });

  it("returns INTERNAL error when update throws", async () => {
    mockUpdate.mockRejectedValueOnce(new Error("DB failure"));
    const result = await skipAtletaOnboarding();
    expect(result).toEqual({
      ok: false,
      error: "INTERNAL",
      message: expect.any(String),
    });
  });
});

// ── Tour persistence tests ───────────────────────────────────────────────────

import { markTourSeen } from "../../src/components/tour/persistence";

describe("markTourSeen", () => {
  it("calls setItem with the given key and an ISO date string", () => {
    const mockStorage = { setItem: vi.fn() };
    const now = new Date("2026-05-27T10:00:00Z");
    markTourSeen("kronos-tour-home", mockStorage, now);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      "kronos-tour-home",
      now.toISOString(),
    );
  });

  it("does nothing when storage is undefined", () => {
    // Should not throw
    expect(() => markTourSeen("kronos-tour-home", undefined)).not.toThrow();
  });

  it("swallows setItem exceptions (storage quota / private mode)", () => {
    const mockStorage = {
      setItem: vi.fn().mockImplementation(() => {
        throw new Error("QuotaExceededError");
      }),
    };
    expect(() =>
      markTourSeen("kronos-tour-home", mockStorage, new Date()),
    ).not.toThrow();
  });
});
