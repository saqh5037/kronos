"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import { scoreSchema } from "@/lib/validations/score";
import { detectPR } from "@/lib/scores";
import type { ScoreType } from "@/lib/validations/wod";
import { logAudit } from "../audit";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export type MyScoreRow = {
  id: string;
  wodId: string;
  wodName: string;
  scoreType: ScoreType;
  value: number;
  unit: string;
  scaling: string;
  notes: string | null;
  createdAt: Date;
};

export async function listMyScores(limit = 50): Promise<MyScoreRow[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const scores = await db.score.findMany({
    where: { athleteId: me.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { wod: { select: { id: true, name: true, scoreType: true } } },
  });

  return scores.map((s) => ({
    id: s.id,
    wodId: s.wodId,
    wodName: s.wod.name,
    scoreType: s.wod.scoreType as ScoreType,
    value: Number(s.value),
    unit: s.unit,
    scaling: s.scaling,
    notes: s.notes,
    createdAt: s.createdAt,
  }));
}

export type TodayWOD = {
  classId: string;
  startsAt: Date;
  wodId: string;
  wodName: string;
  wodType: string;
  scoreType: ScoreType;
  description: string | null;
  timeCap: number | null;
  movements: {
    movementId: string;
    name: string;
    reps: number | null;
    weight: number | null;
    notes: string | null;
    order: number;
  }[];
} | null;

export async function getTodayWOD(): Promise<TodayWOD> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const klass = await db.class.findFirst({
    where: {
      startsAt: { gte: start, lt: end },
      isActive: true,
      wodId: { not: null },
    },
    orderBy: { startsAt: "asc" },
    include: {
      wod: {
        include: {
          movements: {
            orderBy: { order: "asc" },
            include: { movement: { select: { name: true } } },
          },
        },
      },
    },
  });

  if (!klass || !klass.wod) return null;

  return {
    classId: klass.id,
    startsAt: klass.startsAt,
    wodId: klass.wod.id,
    wodName: klass.wod.name,
    wodType: klass.wod.type,
    scoreType: klass.wod.scoreType as ScoreType,
    description: klass.wod.description,
    timeCap: klass.wod.timeCap,
    movements: klass.wod.movements.map((m) => ({
      movementId: m.movementId,
      name: m.movement.name,
      reps: m.reps,
      weight: m.weight ? Number(m.weight) : null,
      notes: m.notes,
      order: m.order,
    })),
  };
}

export async function listScoresForWOD(wodId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.score.findMany({
    where: { wodId },
    orderBy: { createdAt: "desc" },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
      wod: { select: { name: true, scoreType: true } },
    },
  });
}

/**
 * Submit a score. If the WOD is STRENGTH (single movement), auto-detect a
 * PR for that movement. PR detection for non-strength WODs is per-WOD only
 * (the "Fran PR" pattern) and lives outside the Movement-PR table.
 */
export async function submitScore(data: unknown) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const parsed = scoreSchema.parse(data);
  const db = withTenant(tenantId);

  const wod = await db.wOD.findUnique({
    where: { id: parsed.wodId },
    include: { movements: true },
  });
  if (!wod) throw new Error("WOD no encontrado");

  // Persist score
  const score = await rawDb.score.create({
    data: {
      tenantId,
      wodId: parsed.wodId,
      athleteId: me.id,
      classId: parsed.classId ?? null,
      value: parsed.value,
      unit: parsed.unit,
      scaling: parsed.scaling,
      notes: parsed.notes,
    },
  });

  // PR detection: only for STRENGTH WODs with a single movement (1RM-style).
  let prAchieved = false;
  if (
    wod.type === "STRENGTH" &&
    wod.scoreType === "WEIGHT" &&
    wod.movements.length === 1 &&
    parsed.scaling !== "SCALED"
  ) {
    const movementId = wod.movements[0].movementId;
    const existingPR = await db.pR.findUnique({
      where: { athleteId_movementId: { athleteId: me.id, movementId } },
    });

    const newPRValue = detectPR(
      existingPR ? Number(existingPR.value) : null,
      parsed.value,
      "WEIGHT",
    );

    if (newPRValue !== null) {
      await rawDb.pR.upsert({
        where: { athleteId_movementId: { athleteId: me.id, movementId } },
        update: {
          value: newPRValue,
          unit: parsed.unit,
          achievedAt: new Date(),
        },
        create: {
          tenantId,
          athleteId: me.id,
          movementId,
          value: newPRValue,
          unit: parsed.unit,
        },
      });
      prAchieved = true;
    }
  }

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "SCORE_SUBMITTED",
    targetType: "Score",
    targetId: score.id,
    metadata: {
      wodId: parsed.wodId,
      athleteId: me.id,
      value: parsed.value,
      unit: parsed.unit,
      scaling: parsed.scaling,
    },
  });

  if (prAchieved) {
    await logAudit({
      tenantId,
      actorId: session.user.id,
      action: "PR_ACHIEVED",
      targetType: "Athlete",
      targetId: me.id,
      metadata: { wodId: parsed.wodId, value: parsed.value, unit: parsed.unit },
    });
  }

  revalidatePath("/atleta/wod");
  revalidatePath("/atleta");
  revalidatePath("/admin/prs");
  revalidatePath("/admin/leaderboards");
  return { ok: true, scoreId: score.id, prAchieved };
}
