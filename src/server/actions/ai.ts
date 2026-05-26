"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { startOfDay, subDays } from "date-fns";
import { isStreakCurrent } from "@/lib/streak";
import {
  buildFallbackText,
  buildGeminiPrompt,
  computeGreeting,
  type GreetingContext,
  type GreetingTone,
} from "@/lib/ai/personalized-greeting";
import {
  generateText,
  getGeminiModel,
  runWithCache,
} from "@/lib/ai/gemini-client";
import {
  buildFormAnalysisPrompt,
  fallbackFeedback,
  parseFormFeedback,
  type FormFeedback,
} from "@/lib/ai/form-analysis";
import {
  predictNextPR,
  buildPRNarrativePrompt,
  type PRDataPoint,
  type PRPrediction,
} from "@/lib/ai/pr-prediction";
import {
  buildFallbackPlan,
  buildTrainingPlanPrompt,
  parseGeminiPlan,
  weeksAvailableUntil,
  type TrainingPlan,
  type TrainingPlanInputs,
} from "@/lib/ai/training-plan";

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
        select: { count: true, lastEventAt: true },
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
    attendanceStreakDays: isStreakCurrent(streak?.lastEventAt ?? null, now)
      ? (streak?.count ?? 0)
      : 0,
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

// ─── Training Plan ────────────────────────────────────────────────────────────

export type GoalPlanResult = {
  plan: TrainingPlan;
  goal: {
    id: string;
    metric: "PR" | "TONNAGE" | "ATTENDANCE";
    movementName: string | null;
    targetValue: number;
    unit: string;
    deadline: Date;
  };
};

export async function generateGoalPlan(
  goalId: string,
): Promise<GoalPlanResult | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return null;

  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const me = await db.athlete.findFirst({
    where: { userId: session.user.id },
    select: { id: true, firstName: true },
  });
  if (!me) return null;

  const goal = await db.goal.findFirst({
    where: { id: goalId, athleteId: me.id },
    include: { movement: { select: { name: true } } },
  });
  if (!goal) return null;

  const cacheKey = `goalplan:${goal.id}:${goal.deadline.toISOString().slice(0, 10)}:${goal.targetValue.toString()}`;

  const result = await runWithCache(cacheKey, 7 * 24 * 60 * 60, async () => {
    const today = new Date();
    const weeks = weeksAvailableUntil(goal.deadline, today);

    // Last 4 weeks: count weekly training sessions to estimate frequency
    const fourWeeksAgo = subDays(today, 28);
    const recentBookings = await db.booking.count({
      where: {
        athleteId: me.id,
        status: "ATTENDED",
        class: { startsAt: { gte: fourWeeksAgo } },
      },
    });
    const weeklyFrequency = Math.max(
      2,
      Math.min(6, Math.round(recentBookings / 4)),
    );

    const recentPRs = await db.pR.findMany({
      where: { athleteId: me.id },
      orderBy: { achievedAt: "desc" },
      take: 5,
      include: { movement: { select: { name: true } } },
    });

    const inputs: TrainingPlanInputs = {
      athleteFirstName: me.firstName,
      goalMetric: goal.metric as "PR" | "TONNAGE" | "ATTENDANCE",
      goalMovementName: goal.movement?.name ?? null,
      goalTargetValue: Number(goal.targetValue),
      goalStartValue: goal.startValue === null ? null : Number(goal.startValue),
      goalUnit: goal.unit,
      goalDeadline: goal.deadline,
      weeksAvailable: weeks,
      weeklyTrainingFrequency: weeklyFrequency,
      recentPRs: recentPRs.map((p) => ({
        movementName: p.movement.name,
        value: Number(p.value),
        daysAgo: Math.floor(
          (today.getTime() - p.achievedAt.getTime()) / 86400000,
        ),
      })),
      todayDate: today,
    };

    const fallback = buildFallbackPlan(inputs);
    if (!process.env.GEMINI_API_KEY) return fallback;

    try {
      const prompt = buildTrainingPlanPrompt(inputs);
      const raw = await generateText(prompt);
      const parsed = parseGeminiPlan(raw);
      return parsed ?? fallback;
    } catch (err) {
      console.error("[ai.goal-plan] Gemini failed:", err);
      return fallback;
    }
  });

  return {
    plan: result,
    goal: {
      id: goal.id,
      metric: goal.metric as "PR" | "TONNAGE" | "ATTENDANCE",
      movementName: goal.movement?.name ?? null,
      targetValue: Number(goal.targetValue),
      unit: goal.unit,
      deadline: goal.deadline,
    },
  };
}

// ─── Form Analysis (Gemini Vision) ────────────────────────────────────────────

export type FormAnalysisResult = {
  feedback: FormFeedback;
  movementName: string;
  athleteName: string | null;
};

const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB

export async function analyzeMovementForm(
  formData: FormData,
): Promise<FormAnalysisResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) {
    throw new Error("Unauthorized");
  }
  if (session.user.role === "ATHLETE") {
    throw new Error("Forbidden — coach tool only");
  }

  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const movementId = formData.get("movementId");
  const athleteId = formData.get("athleteId");
  const file = formData.get("photo");

  if (typeof movementId !== "string" || !movementId) {
    throw new Error("Falta el movimiento");
  }
  if (!(file instanceof File)) {
    throw new Error("Falta la foto");
  }
  if (file.size === 0) {
    throw new Error("La foto está vacía");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La foto pesa más de 6MB");
  }
  if (
    !ALLOWED_IMAGE_MIME.includes(
      file.type as (typeof ALLOWED_IMAGE_MIME)[number],
    )
  ) {
    throw new Error("Formato no soportado (usa JPG, PNG o WEBP)");
  }

  const movement = await db.movement.findUnique({
    where: { id: movementId },
    select: { name: true, category: true },
  });
  if (!movement) throw new Error("Movimiento no encontrado");

  let athleteName: string | null = null;
  let athleteFirstName: string | null = null;
  if (typeof athleteId === "string" && athleteId) {
    const athlete = await db.athlete.findUnique({
      where: { id: athleteId },
      select: { firstName: true, lastName: true },
    });
    if (athlete) {
      athleteFirstName = athlete.firstName;
      athleteName = `${athlete.firstName} ${athlete.lastName}`;
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return {
      feedback: fallbackFeedback(
        "GEMINI_API_KEY no configurado. Pídele al admin que lo agregue para activar Vision.",
      ),
      movementName: movement.name,
      athleteName,
    };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const prompt = buildFormAnalysisPrompt({
      movementName: movement.name,
      movementCategory: movement.category,
      athleteFirstName,
    });
    const model = getGeminiModel();
    const response = await model.generateContent([
      prompt,
      { inlineData: { data: base64, mimeType: file.type } },
    ]);
    const raw = response.response.text();
    const parsed = parseFormFeedback(raw);
    return {
      feedback:
        parsed ??
        fallbackFeedback(
          "Gemini devolvió un formato inesperado. Intenta de nuevo.",
        ),
      movementName: movement.name,
      athleteName,
    };
  } catch (err) {
    console.error("[ai.form-analysis] failed:", err);
    return {
      feedback: fallbackFeedback(
        "Error analizando la foto. Verificá que sea legible y reintentá.",
      ),
      movementName: movement.name,
      athleteName,
    };
  }
}

export async function listAthletesForFormPicker(): Promise<
  Array<{ id: string; name: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId || !session.user.id) return [];
  if (session.user.role === "ATHLETE") return [];
  const db = withTenant(session.user.tenantId);
  const athletes = await db.athlete.findMany({
    where: { status: "ACTIVE" },
    orderBy: { firstName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });
  return athletes.map((a) => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
  }));
}

export async function listMovementsForFormPicker(): Promise<
  Array<{ id: string; name: string; category: string }>
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) return [];
  if (session.user.role === "ATHLETE") return [];
  const db = withTenant(session.user.tenantId);
  const movements = await db.movement.findMany({
    where: { isStandard: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true },
  });
  return movements;
}

// (helpers internos: sanitizeGeminiText, readinessLabelFromScore, etc.
//  no se exportan porque "use server" solo permite async functions.
//  Tests apuntan directo a los pure helpers en src/lib/ai/*.ts)
void buildFallbackText; // import kept for parallel future expansion
