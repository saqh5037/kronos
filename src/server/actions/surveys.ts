"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import type { SurveyKind } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SurveyOption = {
  value: string;
  label: string;
  emoji?: string;
};

export type SurveyQuestion = {
  id: string;
  text: string;
  options: SurveyOption[];
};

export type SurveyRow = {
  id: string;
  kind: SurveyKind;
  name: string;
  questions: SurveyQuestion[];
};

async function requireAthleteSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id)
    throw new Error("Unauthorized");
  return session;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getActiveSurvey(
  kind: SurveyKind,
): Promise<SurveyRow | null> {
  const session = await requireAthleteSession();
  const db = withTenant(session.user.tenantId);

  const survey = await db.survey.findFirst({
    where: { kind, isActive: true },
    select: { id: true, kind: true, name: true, questions: true },
  });
  if (!survey) return null;

  return {
    id: survey.id,
    kind: survey.kind,
    name: survey.name,
    questions: survey.questions as SurveyQuestion[],
  };
}

/**
 * Check if the current user's athlete already responded to a survey kind today.
 * Optionally scoped to a specific classId for RPE.
 */
export async function hasRespondedToday(
  surveyKind: SurveyKind,
  classId?: string,
): Promise<boolean> {
  const session = await requireAthleteSession();

  // Resolve athlete id from user
  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!athlete) return false;

  const survey = await rawDb.survey.findFirst({
    where: {
      tenantId: session.user.tenantId,
      kind: surveyKind,
      isActive: true,
    },
    select: { id: true },
  });
  if (!survey) return false;

  // Today in UTC (start of day)
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const existing = await rawDb.surveyResponse.findFirst({
    where: {
      tenantId: session.user.tenantId,
      surveyId: survey.id,
      athleteId: athlete.id,
      completedAt: { gte: todayStart },
      ...(classId ? { classId } : {}),
    },
  });

  return existing !== null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function submitSurveyResponse(
  surveyId: string,
  answers: Record<string, string>,
  classId?: string,
): Promise<{ ok: boolean }> {
  const session = await requireAthleteSession();

  const athlete = await rawDb.athlete.findFirst({
    where: { userId: session.user.id, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!athlete) throw new Error("Perfil de atleta no encontrado");

  // Verify survey belongs to tenant
  const survey = await rawDb.survey.findFirst({
    where: { id: surveyId, tenantId: session.user.tenantId },
    select: { id: true },
  });
  if (!survey) throw new Error("Encuesta no encontrada");

  await rawDb.surveyResponse.create({
    data: {
      tenantId: session.user.tenantId,
      surveyId,
      athleteId: athlete.id,
      classId: classId ?? null,
      answers,
    },
  });

  return { ok: true };
}

// ─── Admin / Reporting ────────────────────────────────────────────────────────

export type ReadinessAverage = {
  score: number; // 0.0-1.0 normalized (0=low/bad/much, 0.5=mid/ok/some, 1=high/great/none)
  count: number; // responses in period
  total: number; // total active athletes
};

/**
 * Average readiness score for the box.
 * Only callable by OWNER/COACH.
 */
export async function getReadinessAverage(opts?: {
  sinceDays?: number;
}): Promise<ReadinessAverage> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role === "ATHLETE") throw new Error("Forbidden");

  const sinceDays = opts?.sinceDays ?? 7;
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  // Find active READINESS survey
  const survey = await rawDb.survey.findFirst({
    where: {
      tenantId: session.user.tenantId,
      kind: "READINESS",
      isActive: true,
    },
    select: { id: true },
  });
  if (!survey) return { score: 0, count: 0, total: 0 };

  const responses = await rawDb.surveyResponse.findMany({
    where: {
      tenantId: session.user.tenantId,
      surveyId: survey.id,
      completedAt: { gte: since },
    },
    select: { answers: true },
  });

  // Total active athletes
  const totalAthletes = await rawDb.athlete.count({
    where: { tenantId: session.user.tenantId, status: "ACTIVE" },
  });

  if (responses.length === 0) {
    return { score: 0, count: 0, total: totalAthletes };
  }

  // Normalize answers to 0/0.5/1.0
  const valueMap: Record<string, number> = {
    // energy
    low: 0,
    mid: 0.5,
    high: 1,
    // sleep
    bad: 0,
    ok: 0.5,
    great: 1,
    // soreness (inverted — none=good)
    none: 1,
    some: 0.5,
    much: 0,
  };

  let totalScore = 0;
  let scoredCount = 0;
  for (const r of responses) {
    const ans = r.answers as Record<string, string>;
    const vals = Object.values(ans)
      .map((v) => valueMap[v])
      .filter((v) => v !== undefined);
    if (vals.length > 0) {
      totalScore += vals.reduce((a, b) => a + b, 0) / vals.length;
      scoredCount++;
    }
  }

  return {
    score: scoredCount > 0 ? totalScore / scoredCount : 0,
    count: responses.length,
    total: totalAthletes,
  };
}
