/**
 * Unit tests for surveys (S3.3).
 * Tests: getActiveSurvey, submitSurveyResponse, hasRespondedToday, readinessAverage.
 * Mocks DB + session — no real connections.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Hoisted mocks ────────────────────────────────────────────────────────────

const surveyFindFirst = vi.hoisted(() => vi.fn());
const surveyResponseFindFirst = vi.hoisted(() => vi.fn());
const surveyResponseCreate = vi.hoisted(() => vi.fn());
const surveyResponseFindMany = vi.hoisted(() => vi.fn());
const athleteFindFirst = vi.hoisted(() => vi.fn());
const athleteCount = vi.hoisted(() => vi.fn());
const getServerSessionMock = vi.hoisted(() => vi.fn());

vi.mock("../../src/server/db", () => ({
  db: {
    survey: { findFirst: surveyFindFirst },
    surveyResponse: {
      findFirst: surveyResponseFindFirst,
      create: surveyResponseCreate,
      findMany: surveyResponseFindMany,
    },
    athlete: {
      findFirst: athleteFindFirst,
      count: athleteCount,
    },
  },
  withTenant: vi.fn(() => ({
    survey: { findFirst: surveyFindFirst },
  })),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("../../src/server/auth", () => ({ authOptions: {} }));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SESSION = {
  user: { id: "user-1", tenantId: "tenant-1", role: "OWNER" },
};

const ATHLETE_SESSION = {
  user: { id: "user-ath", tenantId: "tenant-1", role: "ATHLETE" },
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── getActiveSurvey ──────────────────────────────────────────────────────────

describe("getActiveSurvey", () => {
  it("returns null when no active survey exists", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    surveyFindFirst.mockResolvedValue(null);

    const { getActiveSurvey } =
      await import("../../src/server/actions/surveys");
    const result = await getActiveSurvey("READINESS");
    expect(result).toBeNull();
  });

  it("returns survey with parsed questions when found", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    surveyFindFirst.mockResolvedValue({
      id: "survey-1",
      kind: "READINESS",
      name: "Daily Readiness",
      questions: [
        {
          id: "energy",
          text: "¿Cómo te sientes?",
          options: [
            { value: "low", label: "Bajo", emoji: "😴" },
            { value: "high", label: "Listo", emoji: "💪" },
          ],
        },
      ],
    });

    const { getActiveSurvey } =
      await import("../../src/server/actions/surveys");
    const result = await getActiveSurvey("READINESS");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("survey-1");
    expect(result!.questions).toHaveLength(1);
    expect(result!.questions[0].id).toBe("energy");
  });
});

// ─── hasRespondedToday ────────────────────────────────────────────────────────

describe("hasRespondedToday", () => {
  it("returns false when athlete has not responded today", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue({ id: "ath-1" });
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    surveyResponseFindFirst.mockResolvedValue(null);

    const { hasRespondedToday } =
      await import("../../src/server/actions/surveys");
    const result = await hasRespondedToday("READINESS");
    expect(result).toBe(false);
  });

  it("returns true when athlete already responded today", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue({ id: "ath-1" });
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    surveyResponseFindFirst.mockResolvedValue({ id: "resp-1" });

    const { hasRespondedToday } =
      await import("../../src/server/actions/surveys");
    const result = await hasRespondedToday("READINESS");
    expect(result).toBe(true);
  });

  it("returns false when no athlete profile exists", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue(null);

    const { hasRespondedToday } =
      await import("../../src/server/actions/surveys");
    const result = await hasRespondedToday("READINESS");
    expect(result).toBe(false);
  });

  it("returns false when no survey exists", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue({ id: "ath-1" });
    surveyFindFirst.mockResolvedValue(null);

    const { hasRespondedToday } =
      await import("../../src/server/actions/surveys");
    const result = await hasRespondedToday("READINESS");
    expect(result).toBe(false);
  });
});

// ─── submitSurveyResponse ─────────────────────────────────────────────────────

describe("submitSurveyResponse", () => {
  it("creates a response and returns ok", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue({ id: "ath-1" });
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    surveyResponseCreate.mockResolvedValue({ id: "resp-new" });

    const { submitSurveyResponse } =
      await import("../../src/server/actions/surveys");
    const result = await submitSurveyResponse("survey-1", {
      energy: "high",
      sleep: "great",
      soreness: "none",
    });
    expect(result).toEqual({ ok: true });
    expect(surveyResponseCreate).toHaveBeenCalledOnce();
  });

  it("throws when athlete not found", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);
    athleteFindFirst.mockResolvedValue(null);

    const { submitSurveyResponse } =
      await import("../../src/server/actions/surveys");
    await expect(
      submitSurveyResponse("survey-1", { energy: "high" }),
    ).rejects.toThrow("Perfil de atleta no encontrado");
  });
});

// ─── getReadinessAverage ──────────────────────────────────────────────────────

describe("getReadinessAverage", () => {
  it("returns zero score when no responses", async () => {
    getServerSessionMock.mockResolvedValue(SESSION);
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    surveyResponseFindMany.mockResolvedValue([]);
    athleteCount.mockResolvedValue(30);

    const { getReadinessAverage } =
      await import("../../src/server/actions/surveys");
    const result = await getReadinessAverage({ sinceDays: 7 });
    expect(result.score).toBe(0);
    expect(result.count).toBe(0);
    expect(result.total).toBe(30);
  });

  it("calculates correct average for perfect readiness", async () => {
    getServerSessionMock.mockResolvedValue(SESSION);
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    // All "high", "great", "none" = 1.0 each → avg = 1.0
    surveyResponseFindMany.mockResolvedValue([
      { answers: { energy: "high", sleep: "great", soreness: "none" } },
      { answers: { energy: "high", sleep: "great", soreness: "none" } },
    ]);
    athleteCount.mockResolvedValue(20);

    const { getReadinessAverage } =
      await import("../../src/server/actions/surveys");
    const result = await getReadinessAverage({ sinceDays: 7 });
    expect(result.score).toBeCloseTo(1.0, 2);
    expect(result.count).toBe(2);
    expect(result.total).toBe(20);
  });

  it("calculates correct average for poor readiness", async () => {
    getServerSessionMock.mockResolvedValue(SESSION);
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    // All "low", "bad", "much" = 0.0 each → avg = 0.0
    surveyResponseFindMany.mockResolvedValue([
      { answers: { energy: "low", sleep: "bad", soreness: "much" } },
    ]);
    athleteCount.mockResolvedValue(10);

    const { getReadinessAverage } =
      await import("../../src/server/actions/surveys");
    const result = await getReadinessAverage({ sinceDays: 7 });
    expect(result.score).toBeCloseTo(0.0, 2);
  });

  it("calculates mid score correctly", async () => {
    getServerSessionMock.mockResolvedValue(SESSION);
    surveyFindFirst.mockResolvedValue({ id: "survey-1" });
    // All "mid", "ok", "some" = 0.5 each → avg = 0.5
    surveyResponseFindMany.mockResolvedValue([
      { answers: { energy: "mid", sleep: "ok", soreness: "some" } },
    ]);
    athleteCount.mockResolvedValue(15);

    const { getReadinessAverage } =
      await import("../../src/server/actions/surveys");
    const result = await getReadinessAverage({ sinceDays: 7 });
    expect(result.score).toBeCloseTo(0.5, 2);
  });

  it("throws when called by ATHLETE role", async () => {
    getServerSessionMock.mockResolvedValue(ATHLETE_SESSION);

    const { getReadinessAverage } =
      await import("../../src/server/actions/surveys");
    await expect(getReadinessAverage()).rejects.toThrow("Forbidden");
  });
});
