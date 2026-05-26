"use server";

import { revalidatePath } from "next/cache";
import { requireCachedSession } from "@/server/session";
import { withTenant, db as rawDb } from "../db";
import { scoreSchema } from "@/lib/validations/score";
import { detectPR, formatScore } from "@/lib/scores";
import type { ScoreType } from "@/lib/validations/wod";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";
import { maybeAchievePRGoals } from "./goals";
import {
  runAchievementEvaluation,
  awardXP,
  type UnlockedBadge,
} from "@/server/achievements/evaluate";
import { type ListOpts, type ListResult, normalizePagination } from "./types";
import type { Scaling } from "@prisma/client";

async function requireSession() {
  return requireCachedSession();
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

export type MyScoreSort = "createdAt" | "value";

export async function listMyScoresPaged(
  opts?: ListOpts<MyScoreSort> & {
    wodId?: string;
    scaling?: "RX" | "SCALED" | "RXPLUS";
  },
): Promise<ListResult<MyScoreRow>> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return { rows: [], total: 0, page: 1, pageSize: 0 };

  const db = withTenant(tenantId);
  const { page, pageSize, skip, take } = normalizePagination(opts);

  const where = {
    athleteId: me.id,
    ...(opts?.wodId ? { wodId: opts.wodId } : {}),
    ...(opts?.scaling ? { scaling: opts.scaling } : {}),
    ...(opts?.dateFrom || opts?.dateTo
      ? {
          createdAt: {
            ...(opts.dateFrom ? { gte: opts.dateFrom } : {}),
            ...(opts.dateTo ? { lte: opts.dateTo } : {}),
          },
        }
      : {}),
  };

  const sortBy = opts?.sortBy ?? "createdAt";
  const sortDir = opts?.sortDir ?? "desc";

  const [total, scores] = await Promise.all([
    db.score.count({ where }),
    db.score.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      skip,
      take,
      include: { wod: { select: { id: true, name: true, scoreType: true } } },
    }),
  ]);

  const rows: MyScoreRow[] = scores.map((s) => ({
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

  return { rows, total, page, pageSize };
}

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

export type MyWODPercentile = {
  myBestValue: number | null;
  totalAthletes: number;
  betterThan: number; // count of athletes whose best is worse than mine
  percentile: number; // 0..100, higher = better
  scoreType: string;
};

/**
 * Returns the athlete's percentile rank for a given WOD compared to all
 * other athletes in the box who have logged a score for it. TIME score type
 * is "lower is better"; everything else is "higher is better".
 */
export async function getMyWODPercentile(
  wodId: string,
): Promise<MyWODPercentile | null> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return null;

  const db = withTenant(tenantId);

  const wod = await db.wOD.findUnique({
    where: { id: wodId },
    select: { scoreType: true },
  });
  if (!wod) return null;

  const allScores = await db.score.findMany({
    where: { wodId },
    select: { athleteId: true, value: true },
  });
  if (allScores.length === 0) return null;

  // Best per athlete
  const bestByAthlete = new Map<string, number>();
  const lowerIsBetter = wod.scoreType === "TIME";
  for (const s of allScores) {
    const v = Number(s.value);
    const existing = bestByAthlete.get(s.athleteId);
    if (
      existing === undefined ||
      (lowerIsBetter ? v < existing : v > existing)
    ) {
      bestByAthlete.set(s.athleteId, v);
    }
  }

  const myBest = bestByAthlete.get(me.id) ?? null;
  if (myBest === null) return null;

  let betterThan = 0;
  for (const [athleteId, v] of bestByAthlete) {
    if (athleteId === me.id) continue;
    if (lowerIsBetter ? myBest < v : myBest > v) betterThan += 1;
  }

  const otherCount = bestByAthlete.size - 1;
  const percentile =
    otherCount === 0 ? 100 : Math.round((betterThan / otherCount) * 100);

  return {
    myBestValue: myBest,
    totalAthletes: bestByAthlete.size,
    betterThan,
    percentile,
    scoreType: wod.scoreType,
  };
}

export async function listScoresForWOD(wodId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  return db.score.findMany({
    where: { wodId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
      wod: { select: { name: true, scoreType: true } },
    },
  });
}

/**
 * Today's WOD plus its scoreboard, in a single action. The two queries still
 * run sequentially internally (scores need the wodId the first query resolves),
 * but folding them into one action lets the athlete home await it inside its
 * `Promise.all` batch instead of running the scores query serially AFTER the
 * whole batch resolves — removing that tail round-trip from the cold-start
 * render path the PWA hits on every launch.
 */
export async function getTodayWODWithScores(): Promise<{
  wod: TodayWOD;
  scores: Awaited<ReturnType<typeof listScoresForWOD>>;
}> {
  const wod = await getTodayWOD();
  if (!wod) return { wod: null, scores: [] };
  const scores = await listScoresForWOD(wod.wodId);
  return { wod, scores };
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
      const prevBest = existingPR ? Number(existingPR.value) : null;
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

      // Write-through to append-only PRAttempt log (foundation for
      // progression charts, improvers ranking, activity feed, goals).
      // Idempotent per scoreId via @unique on PRAttempt.scoreId.
      await rawDb.pRAttempt.updateMany({
        where: {
          tenantId,
          athleteId: me.id,
          movementId,
          isCurrentBest: true,
        },
        data: { isCurrentBest: false },
      });
      await rawDb.pRAttempt.create({
        data: {
          tenantId,
          athleteId: me.id,
          movementId,
          scoreId: score.id,
          value: newPRValue,
          unit: parsed.unit,
          prevBest,
          isCurrentBest: true,
        },
      });
      // Auto-mark active PR goals on this movement as ACHIEVED
      // when the new PR crosses the target.
      await maybeAchievePRGoals(me.id, tenantId, movementId, newPRValue);
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
    await trackEvent("pr_achieved", {
      tenantId,
      actorId: session.user.id,
      wodId: parsed.wodId,
      value: parsed.value,
      unit: parsed.unit,
    });
  }

  await trackEvent("score_submitted", {
    tenantId,
    actorId: session.user.id,
    wodId: parsed.wodId,
    scaling: parsed.scaling,
    prAchieved,
  });

  // Award XP for the raw score event (idempotent via XPLedger unique).
  await awardXP({
    tenantId,
    athleteId: me.id,
    amount: 5,
    reason: "SCORE_SUBMITTED",
    sourceType: "Score",
    sourceId: score.id,
  });
  if (prAchieved) {
    await awardXP({
      tenantId,
      athleteId: me.id,
      amount: 50,
      reason: "PR_ACHIEVED",
      sourceType: "Score",
      sourceId: score.id,
    });
  }

  // Evaluate achievements that may have unlocked from this event.
  let unlockedBadges: UnlockedBadge[] = [];
  try {
    const result = await runAchievementEvaluation({
      tenantId,
      athleteId: me.id,
      trigger: "PR",
    });
    unlockedBadges = result.unlockedBadges;
  } catch (err) {
    console.error("[submitScore] achievement eval failed:", err);
  }

  revalidatePath("/atleta/wod");
  revalidatePath("/atleta");
  revalidatePath("/admin/prs");
  revalidatePath("/admin/leaderboards");
  return { ok: true, scoreId: score.id, prAchieved, unlockedBadges };
}

// ─── Whiteboard OCR actions ───────────────────────────────────────────────────

async function requireCoachSession() {
  const session = await requireCachedSession();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Forbidden — COACH/OWNER/STAFF only");
  }
  return session;
}

/**
 * Process a WhiteboardUpload: calls Gemini Vision, stores aiResult,
 * marks status=PROCESSED. Returns the aiResult to hydrate the review UI.
 */
export async function processWhiteboardUpload(uploadId: string) {
  await requireCoachSession();

  const upload = await rawDb.whiteboardUpload.findUnique({
    where: { id: uploadId },
    include: { class: { include: { wod: true } } },
  });
  if (!upload) throw new Error("Upload no encontrado");
  if (upload.status !== "PENDING") {
    // Already processed — return cached result
    return { aiResult: upload.aiResult, status: upload.status };
  }

  const defaultScoreType: ScoreType =
    (upload.class.wod?.scoreType as ScoreType) ?? "TIME";

  // Load roster and alias dict for richer context
  const { getAliasDict } = await import("./aliases");
  const aliasDict = await getAliasDict(upload.tenantId);

  // Build roster JSON directly from DB to avoid session requirement
  const roster = await rawDb.booking.findMany({
    where: { classId: upload.classId },
    include: {
      athlete: { select: { id: true, firstName: true, lastName: true } },
    },
  });
  const rosterJson = JSON.stringify(
    roster.map((b) => ({
      athleteId: b.athlete.id,
      firstName: b.athlete.firstName,
      lastName: b.athlete.lastName,
    })),
  );
  const aliasJson = JSON.stringify(aliasDict);

  const { analyzeWhiteboardWithRoster } = await import("../ocr/whiteboard");
  const { getStorage } = await import("../storage");
  const storage = getStorage();

  const imageInput = upload.blobPathname
    ? {
        buffer: await storage.read(upload.blobPathname),
        mimeType: "image/jpeg",
      }
    : { url: upload.url };

  const aiResult = await analyzeWhiteboardWithRoster(
    uploadId,
    imageInput,
    rosterJson,
    aliasJson,
    defaultScoreType,
  );

  await rawDb.whiteboardUpload.update({
    where: { id: uploadId },
    data: {
      aiResult: aiResult as object,
      status: "PROCESSED",
      processedAt: new Date(),
    },
  });

  return { aiResult, status: "PROCESSED" };
}

export type ConfirmRow = {
  athleteId: string;
  value: number;
  type: ScoreType;
  scaling: Scaling;
  notes?: string;
  includeAlias?: { rawName: string };
};

/**
 * Bulk insert scores from a confirmed whiteboard review.
 * - Creates Score records
 * - Detects PRs per athlete
 * - Sends in-app notifications
 * - Logs BULK_SCORES_FROM_WHITEBOARD audit event
 * - Saves new aliases if requested
 * All in a single atomic transaction.
 */
export async function confirmWhiteboardScores(
  uploadId: string,
  rows: ConfirmRow[],
): Promise<{ ok: boolean; count: number }> {
  const session = await requireCoachSession();
  const tenantId = session.user.tenantId;

  const upload = await rawDb.whiteboardUpload.findUnique({
    where: { id: uploadId, tenantId },
    include: { class: { include: { wod: true } } },
  });
  if (!upload) throw new Error("Upload no encontrado");
  if (!upload.class.wod) throw new Error("La clase no tiene WOD asignado");

  const wod = upload.class.wod;
  const scoreType = wod.scoreType as ScoreType;

  // Determine unit from score type
  const unitMap: Record<ScoreType, string> = {
    TIME: "s",
    REPS: "reps",
    WEIGHT: "kg",
    ROUNDS_REPS: "rounds",
  };
  const unit = unitMap[scoreType];

  // Build score create data
  const scoreRows = rows.map((r) => ({
    tenantId,
    wodId: wod.id,
    athleteId: r.athleteId,
    classId: upload.classId,
    value: r.value,
    unit,
    scaling: r.scaling,
    notes: r.notes ?? null,
  }));

  // Run everything in a transaction
  await rawDb.$transaction(async (tx) => {
    // Bulk insert scores
    await tx.score.createMany({ data: scoreRows });

    // PR detection per athlete
    for (const row of rows) {
      // Get athlete's current best for this WOD (via scores table)
      const existingScores = await tx.score.findMany({
        where: { tenantId, wodId: wod.id, athleteId: row.athleteId },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      // Exclude the just-created score to find previous best
      const prevScores = existingScores.filter(
        (s) => Number(s.value) !== row.value,
      );
      const prevBestVal =
        prevScores.length > 0 ? Number(prevScores[0].value) : null;

      const isPR = detectPR(prevBestVal, row.value, scoreType);

      if (isPR !== null && wod.type === "STRENGTH") {
        // PR against movement (STRENGTH only)
        const wm = await tx.wODMovement.findFirst({
          where: { wodId: wod.id },
        });
        if (wm) {
          await tx.pR.upsert({
            where: {
              athleteId_movementId: {
                athleteId: row.athleteId,
                movementId: wm.movementId,
              },
            },
            update: { value: row.value, unit, achievedAt: new Date() },
            create: {
              tenantId,
              athleteId: row.athleteId,
              movementId: wm.movementId,
              value: row.value,
              unit,
            },
          });
        }
      }

      // Best-effort in-app notification — call outside transaction to avoid
      // blocking. We'll do it after the transaction.
    }

    // Aliases
    for (const row of rows) {
      if (row.includeAlias?.rawName) {
        const normalized = row.includeAlias.rawName.trim();
        if (normalized) {
          await tx.athleteAlias.upsert({
            where: { tenantId_alias: { tenantId, alias: normalized } },
            update: { athleteId: row.athleteId, createdById: session.user.id },
            create: {
              tenantId,
              athleteId: row.athleteId,
              alias: normalized,
              createdById: session.user.id,
            },
          });
        }
      }
    }

    // Mark upload confirmed
    await tx.whiteboardUpload.update({
      where: { id: uploadId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        confirmedCount: rows.length,
      },
    });
  });

  // Post-transaction: send in-app notifications (best-effort)
  const { notify } = await import("./notifications");
  for (const row of rows) {
    // Resolve userId from athleteId
    const athlete = await rawDb.athlete.findUnique({
      where: { id: row.athleteId },
      select: { userId: true, firstName: true },
    });
    if (!athlete?.userId) continue;

    const formattedScore = formatScore(row.value, scoreType);
    await notify(athlete.userId, "SCORE_REGISTERED", {
      title: "Tu score fue registrado",
      body: `${formattedScore} en ${wod.name}`,
      link: `/atleta/wod`,
    });

    // Check if it's a new PR (recalculate)
    const prevScores = await rawDb.score.findMany({
      where: {
        tenantId,
        wodId: wod.id,
        athleteId: row.athleteId,
        createdAt: { lt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const prevBestForNotif =
      prevScores.length > 1 ? Number(prevScores[1].value) : null;
    const isPRForNotif = detectPR(prevBestForNotif, row.value, scoreType);

    if (isPRForNotif !== null) {
      await notify(athlete.userId, "PR_NEW", {
        title: "Nuevo PR!",
        body: `Hiciste un nuevo PR en ${wod.name}: ${formattedScore}`,
        link: `/atleta/wod`,
      });
    }
  }

  // Bulk: evaluate achievements once per athlete after all scores landed.
  const uniqueAthleteIds = Array.from(new Set(rows.map((r) => r.athleteId)));
  for (const athleteId of uniqueAthleteIds) {
    try {
      await runAchievementEvaluation({
        tenantId,
        athleteId,
        trigger: "BULK",
      });
    } catch (err) {
      console.error("[whiteboard.confirm] achievement eval failed:", err);
    }
  }

  // Audit log — triggers evaluateAndDispatch automatically
  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "BULK_SCORES_FROM_WHITEBOARD",
    targetType: "WhiteboardUpload",
    targetId: uploadId,
    metadata: {
      uploadId,
      count: rows.length,
      classId: upload.classId,
      wodId: wod.id,
    },
  });

  revalidatePath(`/admin/clases`);
  revalidatePath(`/admin/asistencia`);
  revalidatePath(`/admin/leaderboards`);
  revalidatePath("/atleta/wod");

  return { ok: true, count: rows.length };
}
