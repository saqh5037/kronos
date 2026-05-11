"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { goalSchema, type GoalMetricCode } from "@/lib/validations/goal";
import { computeGoalProgress, type GoalProgress } from "@/lib/goals/progress";
import { calcWellnessProgress } from "@/lib/wellness/calculations";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export type GoalRow = {
  id: string;
  metric: GoalMetricCode;
  movementId: string | null;
  movementName: string | null;
  targetValue: number;
  startValue: number | null;
  unit: string;
  deadline: Date;
  status: "ACTIVE" | "ACHIEVED" | "EXPIRED" | "CANCELLED";
  achievedAt: Date | null;
  createdAt: Date;
  progress: GoalProgress;
  currentValue: number;
};

async function resolveCurrentValue(
  athleteId: string,
  tenantId: string,
  metric: GoalMetricCode,
  movementId: string | null,
  since: Date | null = null,
  unit: string | null = null,
): Promise<number> {
  const db = withTenant(tenantId);
  if (metric === "PR" && movementId) {
    const pr = await db.pR.findUnique({
      where: { athleteId_movementId: { athleteId, movementId } },
    });
    return pr ? Number(pr.value) : 0;
  }
  if (metric === "ATTENDANCE") {
    return db.booking.count({
      where: {
        athleteId,
        status: "ATTENDED",
        ...(since ? { class: { startsAt: { gte: since } } } : {}),
      },
    });
  }
  if (metric === "BODY_COMPOSITION") {
    const type = unit === "%" ? "BODY_FAT" : "WEIGHT";
    const latest = await db.bodyMetric.findFirst({
      where: { athleteId, type },
      orderBy: { measuredAt: "desc" },
    });
    return latest ? Number(latest.value) : 0;
  }
  return 0;
}

export async function createGoal(input: unknown): Promise<{ id: string }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const parsed = goalSchema.parse(input);

  const startValue =
    parsed.startValue ??
    (parsed.metric === "ATTENDANCE"
      ? 0
      : await resolveCurrentValue(
          me.id,
          tenantId,
          parsed.metric,
          parsed.movementId ?? null,
          null,
          parsed.unit,
        ));

  const goal = await rawDb.goal.create({
    data: {
      tenantId,
      athleteId: me.id,
      movementId: parsed.movementId ?? null,
      metric: parsed.metric,
      targetValue: parsed.targetValue,
      unit: parsed.unit,
      startValue,
      deadline: parsed.deadline,
    },
  });

  revalidatePath("/atleta");
  revalidatePath("/atleta/perfil");
  revalidatePath("/atleta/salud");
  return { id: goal.id };
}

/**
 * Variant of listMyGoals scoped to BODY_COMPOSITION only — used by the
 * `/atleta/salud` page so we don't pull PR/TONNAGE/ATTENDANCE goals.
 */
export async function listMyWellnessGoals(): Promise<GoalRow[]> {
  const all = await listMyGoals();
  return all.filter((g) => g.metric === "BODY_COMPOSITION");
}

export async function listMyGoals(): Promise<GoalRow[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const goals = await db.goal.findMany({
    where: { athleteId: me.id },
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
    include: { movement: { select: { name: true } } },
  });

  const now = new Date();
  return Promise.all(
    goals.map(async (g): Promise<GoalRow> => {
      const metric = g.metric as GoalMetricCode;
      const currentValue = await resolveCurrentValue(
        me.id,
        tenantId,
        metric,
        g.movementId,
        metric === "ATTENDANCE" ? g.createdAt : null,
        g.unit,
      );
      const progress = computeProgressFor(
        metric,
        Number(g.targetValue),
        g.startValue === null ? null : Number(g.startValue),
        g.deadline,
        g.createdAt,
        currentValue,
        now,
      );
      return {
        id: g.id,
        metric,
        movementId: g.movementId,
        movementName: g.movement?.name ?? null,
        targetValue: Number(g.targetValue),
        startValue: g.startValue === null ? null : Number(g.startValue),
        unit: g.unit,
        deadline: g.deadline,
        status: g.status as GoalRow["status"],
        achievedAt: g.achievedAt,
        createdAt: g.createdAt,
        progress,
        currentValue,
      };
    }),
  );
}

export async function getGoalProgress(goalId: string): Promise<GoalRow | null> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const g = await db.goal.findUnique({
    where: { id: goalId },
    include: { movement: { select: { name: true } } },
  });
  if (!g) return null;

  const metric = g.metric as GoalMetricCode;
  const currentValue = await resolveCurrentValue(
    g.athleteId,
    tenantId,
    metric,
    g.movementId,
    metric === "ATTENDANCE" ? g.createdAt : null,
    g.unit,
  );
  const progress = computeProgressFor(
    metric,
    Number(g.targetValue),
    g.startValue === null ? null : Number(g.startValue),
    g.deadline,
    g.createdAt,
    currentValue,
  );

  return {
    id: g.id,
    metric,
    movementId: g.movementId,
    movementName: g.movement?.name ?? null,
    targetValue: Number(g.targetValue),
    startValue: g.startValue === null ? null : Number(g.startValue),
    unit: g.unit,
    deadline: g.deadline,
    status: g.status as GoalRow["status"],
    achievedAt: g.achievedAt,
    createdAt: g.createdAt,
    progress,
    currentValue,
  };
}

/**
 * Direction-aware progress: wellness goals can be descending (lose weight)
 * or ascending (gain muscle), so we route them through the wellness helper.
 * PR/TONNAGE/ATTENDANCE keep the original ascending semantics.
 */
function computeProgressFor(
  metric: GoalMetricCode,
  targetValue: number,
  startValue: number | null,
  deadline: Date,
  createdAt: Date,
  currentValue: number,
  now: Date = new Date(),
): GoalProgress {
  if (metric === "BODY_COMPOSITION") {
    const start = startValue ?? currentValue;
    const w = calcWellnessProgress({
      startValue: start,
      currentValue,
      targetValue,
    });
    const totalMs = Math.max(0, deadline.getTime() - createdAt.getTime());
    const totalDays = Math.max(1, Math.round(totalMs / 86_400_000));
    const daysLeft = Math.max(
      0,
      Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000),
    );
    const elapsedPct =
      totalMs <= 0
        ? 100
        : ((now.getTime() - createdAt.getTime()) / totalMs) * 100;
    return {
      pct: w.pct,
      daysLeft,
      totalDays,
      onTrack: w.pct + 0.5 >= elapsedPct,
      eta: null,
      achieved: w.achieved,
    };
  }
  return computeGoalProgress(
    {
      metric: metric as "PR" | "TONNAGE" | "ATTENDANCE",
      targetValue,
      startValue,
      deadline,
      createdAt,
    },
    currentValue,
    now,
  );
}

export async function cancelGoal(goalId: string): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const db = withTenant(tenantId);
  const goal = await db.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.athleteId !== me.id) throw new Error("Meta no encontrada");

  await rawDb.goal.update({
    where: { id: goalId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/atleta/perfil");
  revalidatePath("/atleta/salud");
  return { ok: true };
}

/**
 * Internal hook used after a new body metric is saved. Auto-marks active
 * BODY_COMPOSITION goals as ACHIEVED when the target is crossed. Idempotent.
 * Returns the count of goals transitioned.
 */
export async function maybeAchieveWellnessGoals(
  athleteId: string,
  tenantId: string,
): Promise<number> {
  const goals = await rawDb.goal.findMany({
    where: {
      tenantId,
      athleteId,
      metric: "BODY_COMPOSITION",
      status: "ACTIVE",
    },
  });
  if (goals.length === 0) return 0;

  let count = 0;
  const now = new Date();
  for (const g of goals) {
    const type = g.unit === "%" ? "BODY_FAT" : "WEIGHT";
    const latest = await rawDb.bodyMetric.findFirst({
      where: { tenantId, athleteId, type },
      orderBy: { measuredAt: "desc" },
    });
    if (!latest) continue;
    const current = Number(latest.value);
    const target = Number(g.targetValue);
    const start = g.startValue === null ? current : Number(g.startValue);
    const w = calcWellnessProgress({
      startValue: start,
      currentValue: current,
      targetValue: target,
    });
    if (w.achieved) {
      await rawDb.goal.update({
        where: { id: g.id },
        data: { status: "ACHIEVED", achievedAt: now },
      });
      count += 1;
    }
  }
  return count;
}

/**
 * Internal hook used by `submitScore` write-through. Marks any active PR
 * goals on the affected movement as ACHIEVED when the new value crosses
 * the target. Idempotent.
 */
export async function maybeAchievePRGoals(
  athleteId: string,
  tenantId: string,
  movementId: string,
  newValue: number,
): Promise<number> {
  const goals = await rawDb.goal.findMany({
    where: {
      tenantId,
      athleteId,
      movementId,
      metric: "PR",
      status: "ACTIVE",
    },
  });
  let count = 0;
  const now = new Date();
  for (const g of goals) {
    if (newValue >= Number(g.targetValue)) {
      await rawDb.goal.update({
        where: { id: g.id },
        data: { status: "ACHIEVED", achievedAt: now },
      });
      count += 1;
    }
  }
  return count;
}
