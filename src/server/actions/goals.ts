"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { goalSchema } from "@/lib/validations/goal";
import { computeGoalProgress, type GoalProgress } from "@/lib/goals/progress";

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
  metric: "PR" | "TONNAGE" | "ATTENDANCE";
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
  metric: "PR" | "TONNAGE" | "ATTENDANCE",
  movementId: string | null,
  since: Date | null = null,
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
  return { id: goal.id };
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
      const currentValue = await resolveCurrentValue(
        me.id,
        tenantId,
        g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
        g.movementId,
        g.metric === "ATTENDANCE" ? g.createdAt : null,
      );
      const progress = computeGoalProgress(
        {
          metric: g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
          targetValue: Number(g.targetValue),
          startValue: g.startValue === null ? null : Number(g.startValue),
          deadline: g.deadline,
          createdAt: g.createdAt,
        },
        currentValue,
        now,
      );
      return {
        id: g.id,
        metric: g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
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

  const currentValue = await resolveCurrentValue(
    g.athleteId,
    tenantId,
    g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
    g.movementId,
    g.metric === "ATTENDANCE" ? g.createdAt : null,
  );
  const progress = computeGoalProgress(
    {
      metric: g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
      targetValue: Number(g.targetValue),
      startValue: g.startValue === null ? null : Number(g.startValue),
      deadline: g.deadline,
      createdAt: g.createdAt,
    },
    currentValue,
  );

  return {
    id: g.id,
    metric: g.metric as "PR" | "TONNAGE" | "ATTENDANCE",
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
  return { ok: true };
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
