"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { startOfDay, subDays } from "date-fns";
import {
  buildFallbackText,
  buildGeminiPrompt,
  computeGreeting,
  type GreetingContext,
  type GreetingTone,
} from "@/lib/ai/personalized-greeting";
import { generateText, runWithCache } from "@/lib/ai/gemini-client";
import {
  predictNextPR,
  buildPRNarrativePrompt,
  type PRDataPoint,
  type PRPrediction,
} from "@/lib/ai/pr-prediction";

export type DailyGreeting = {
  text: string;
  tone: GreetingTone;
  source: "ai" | "fallback";
};

const READINESS_VALUE_MAP: Record<string, number> = {
  low: 0,
  mid: 0.5,
  high: 1,
  bad: 0,
  ok: 0.5,
  great: 1,
  none: 1,
  some: 0.5,
  much: 0,
};

function readinessLabelFromScore(
  score: number | null,
): "low" | "mid" | "high" | null {
  if (score === null) return null;
  if (score < 0.4) return "low";
  if (score > 0.7) return "high";
  return "mid";
}

async function getMyReadinessToday(
  tenantId: string,
  userId: string,
): Promise<"low" | "mid" | "high" | null> {
  const survey = await rawDb.survey.findFirst({
    where: { tenantId, kind: "READINESS", isActive: true },
    select: { id: true },
  });
  if (!survey) return null;

  const athlete = await rawDb.athlete.findFirst({
    where: { tenantId, userId },
    select: { id: true },
  });
  if (!athlete) return null;

  const todayStart = startOfDay(new Date());
  const response = await rawDb.surveyResponse.findFirst({
    where: {
      tenantId,
      surveyId: survey.id,
      athleteId: athlete.id,
      completedAt: { gte: todayStart },
    },
    select: { answers: true },
  });
  if (!response) return null;

  const answers = response.answers as Record<string, string>;
  const values = Object.values(answers)
    .map((v) => READINESS_VALUE_MAP[v])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;

  const score = values.reduce((a, b) => a + b, 0) / values.length;
  return readinessLabelFromScore(score);
}

export async function getDailyGreeting(): Promise<DailyGreeting | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return null;

  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, firstName: true },
  });
  if (!me) return null;

  const today = startOfDay(new Date());
  const cacheKey = `greeting:${me.id}:${today.toISOString().slice(0, 10)}`;

  return runWithCache(cacheKey, 12 * 60 * 60, async () => {
    const ctx = await buildGreetingContext(tenantId, me.id, me.firstName);
    const computed = computeGreeting(ctx);

    const fallback: DailyGreeting = {
      text: computed.fallbackText,
      tone: computed.tone,
      source: "fallback",
    };

    if (!process.env.GEMINI_API_KEY) {
      return fallback;
    }

    try {
      const prompt = buildGeminiPrompt(ctx);
      const raw = await generateText(prompt);
      const cleaned = sanitizeGeminiText(raw);
      if (!cleaned) return fallback;
      return { text: cleaned, tone: computed.tone, source: "ai" };
    } catch (err) {
      console.error("[ai.greeting] Gemini failed, using fallback:", err);
      return fallback;
    }
  });
}

async function buildGreetingContext(
  tenantId: string,
  athleteId: string,
  firstName: string,
): Promise<GreetingContext> {
  const db = withTenant(tenantId);
  const now = new Date();
  const weekStart = startOfWeekMon(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? "";

  const [streak, weekAttended, lastPR, nextBooking, readiness] =
    await Promise.all([
      db.streak.findFirst({
        where: { athleteId, type: "ATTENDANCE" },
        select: { count: true },
      }),
      db.booking.count({
        where: {
          athleteId,
          status: "ATTENDED",
          class: { startsAt: { gte: weekStart, lt: weekEnd } },
        },
      }),
      db.pR.findFirst({
        where: { athleteId },
        orderBy: { achievedAt: "desc" },
        select: { achievedAt: true },
      }),
      db.booking.findFirst({
        where: {
          athleteId,
          status: { in: ["BOOKED", "WAITLIST"] },
          class: { startsAt: { gte: now } },
        },
        orderBy: { class: { startsAt: "asc" } },
        include: {
          class: {
            include: {
              wod: { select: { name: true } },
              coach: { select: { name: true } },
            },
          },
        },
      }),
      getMyReadinessToday(tenantId, userId),
    ]);

  const lastPRDaysAgo = lastPR
    ? Math.floor(
        (now.getTime() - lastPR.achievedAt.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return {
    firstName,
    attendanceStreakDays: streak?.count ?? 0,
    weekAttendance: weekAttended,
    weekGoal: 5,
    lastPRDaysAgo,
    todayReadiness: readiness,
    nextClass: nextBooking
      ? {
          startsAt: nextBooking.class.startsAt,
          wodName: nextBooking.class.wod?.name ?? null,
          coachName: nextBooking.class.coach?.name ?? null,
        }
      : null,
  };
}

function startOfWeekMon(date: Date): Date {
  const d = new Date(date);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function sanitizeGeminiText(raw: string): string {
  let text = raw.trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).trim();
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    text = text.slice(1, -1).trim();
  }
  text = text.replace(/!{2,}/g, "!");
  if (text.length > 200) {
    const lastDot = text.lastIndexOf(".", 180);
    text = lastDot > 60 ? text.slice(0, lastDot + 1) : text.slice(0, 180);
  }
  return text;
}

// ─── PR Predictions ──────────────────────────────────────────────────────────

export type PRPredictionCard = PRPrediction & {
  movementId: string;
  movementName: string;
  unit: string;
  narrative: string;
  source: "ai" | "fallback";
};

const PR_LOOKBACK_DAYS = 180;

export async function getTop3PRPredictions(): Promise<PRPredictionCard[]> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return [];

  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, firstName: true },
  });
  if (!me) return [];

  const cacheKey = `prpredictions:${me.id}:${startOfDay(new Date()).toISOString().slice(0, 10)}`;

  return runWithCache(cacheKey, 24 * 60 * 60, async () => {
    const since = subDays(new Date(), PR_LOOKBACK_DAYS);
    const grouped = await db.pRAttempt.groupBy({
      by: ["movementId"],
      where: { athleteId: me.id, achievedAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });

    if (grouped.length === 0) return [];

    const cards = await Promise.all(
      grouped.map(async (g) =>
        buildPredictionCard(tenantId, me.id, me.firstName, g.movementId),
      ),
    );
    return cards.filter((c): c is PRPredictionCard => c !== null);
  });
}

async function buildPredictionCard(
  tenantId: string,
  athleteId: string,
  firstName: string,
  movementId: string,
): Promise<PRPredictionCard | null> {
  const db = withTenant(tenantId);
  const since = subDays(new Date(), PR_LOOKBACK_DAYS);

  const [attempts, movement] = await Promise.all([
    db.pRAttempt.findMany({
      where: { athleteId, movementId, achievedAt: { gte: since } },
      orderBy: { achievedAt: "asc" },
      select: { achievedAt: true, value: true, unit: true },
    }),
    db.movement.findUnique({
      where: { id: movementId },
      select: { name: true },
    }),
  ]);

  if (!movement || attempts.length === 0) return null;

  const data: PRDataPoint[] = attempts.map((a) => ({
    achievedAt: a.achievedAt,
    value: Number(a.value),
  }));
  const prediction = predictNextPR(data, movement.name);

  const unit = attempts[attempts.length - 1].unit ?? "kg";

  let narrative = prediction.fallbackNarrative;
  let source: "ai" | "fallback" = "fallback";

  if (process.env.GEMINI_API_KEY && prediction.status === "improving") {
    try {
      const prompt = buildPRNarrativePrompt(
        movement.name,
        prediction,
        firstName,
      );
      const raw = await generateText(prompt);
      const cleaned = sanitizeGeminiText(raw);
      if (cleaned) {
        narrative = cleaned;
        source = "ai";
      }
    } catch (err) {
      console.error("[ai.pr-narrative] Gemini failed:", err);
    }
  }

  return {
    ...prediction,
    movementId,
    movementName: movement.name,
    unit,
    narrative,
    source,
  };
}

// re-exported for tests / debugging
export const __test = {
  sanitizeGeminiText,
  readinessLabelFromScore,
  buildFallbackText,
  startOfWeekMon,
};
