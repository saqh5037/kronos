import { Prisma } from "@prisma/client";
import type {
  WearableConnection,
  WhoopCycle,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
} from "@prisma/client";
import { db as rawDb } from "@/server/db";
import { decryptToken, encryptToken } from "@/lib/crypto/token-vault";
import {
  fetchCyclesPage,
  fetchRecoveryPage,
  fetchSleepPage,
  fetchWorkoutPage,
  paginateAll,
  parseScopes,
  refreshAccessToken,
  WhoopApiError,
  type WhoopCyclePayload,
  type WhoopRecoveryPayload,
  type WhoopSleepPayload,
  type WhoopWorkoutPayload,
} from "@/lib/wearables/whoop-client";

const REFRESH_LEEWAY_MS = 5 * 60 * 1000;
const SCORE_LINK_WINDOW_MS = 90 * 60 * 1000;
const INITIAL_BACKFILL_DAYS = 30;

export class WhoopReconnectRequiredError extends Error {
  constructor(public readonly connectionId: string) {
    super("Whoop refresh token rejected — user must reconnect");
    this.name = "WhoopReconnectRequiredError";
  }
}

/**
 * Returns a usable access token for the connection. Refreshes upstream when
 * the cached token is within REFRESH_LEEWAY_MS of expiry. Persists the rotated
 * tokens and updated expiry. Throws WhoopReconnectRequiredError on 401 refresh.
 */
export async function ensureFreshToken(
  connection: WearableConnection,
): Promise<{ accessToken: string; refreshed: boolean }> {
  const msUntilExpiry = connection.expiresAt.getTime() - Date.now();
  if (msUntilExpiry > REFRESH_LEEWAY_MS) {
    return {
      accessToken: decryptToken(connection.accessToken),
      refreshed: false,
    };
  }

  try {
    const tokens = await refreshAccessToken(
      decryptToken(connection.refreshToken),
    );
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);
    await rawDb.wearableConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: encryptToken(tokens.access_token),
        refreshToken: encryptToken(tokens.refresh_token),
        expiresAt: newExpiry,
        scopes: parseScopes(tokens.scope),
        status: "CONNECTED",
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });
    return { accessToken: tokens.access_token, refreshed: true };
  } catch (err) {
    const status = err instanceof WhoopApiError ? err.status : 0;
    if (status === 400 || status === 401) {
      await rawDb.wearableConnection.update({
        where: { id: connection.id },
        data: {
          status: "RECONNECT_REQUIRED",
          lastErrorAt: new Date(),
          lastErrorMessage: `refresh_token_rejected_${status}`,
        },
      });
      throw new WhoopReconnectRequiredError(connection.id);
    }
    await rawDb.wearableConnection.update({
      where: { id: connection.id },
      data: {
        status: "ERROR",
        lastErrorAt: new Date(),
        lastErrorMessage:
          err instanceof Error ? err.message : "unknown_refresh_error",
      },
    });
    throw err;
  }
}

// ─── Upserters ────────────────────────────────────────────────────────────────

export function cycleData(
  c: WhoopCyclePayload,
  tenantId: string,
  athleteId: string,
): Prisma.WhoopCycleUncheckedCreateInput {
  return {
    tenantId,
    athleteId,
    externalId: String(c.id),
    start: new Date(c.start),
    end: c.end ? new Date(c.end) : null,
    strain: c.score?.strain ?? null,
    kilojoule: c.score?.kilojoule ?? null,
    averageHr: c.score?.average_heart_rate ?? null,
    maxHr: c.score?.max_heart_rate ?? null,
    scoreState: c.score_state,
    raw: c as unknown as Prisma.InputJsonValue,
  };
}

export function recoveryData(
  r: WhoopRecoveryPayload,
  tenantId: string,
  athleteId: string,
): Prisma.WhoopRecoveryUncheckedCreateInput {
  return {
    tenantId,
    athleteId,
    cycleExternalId: String(r.cycle_id),
    sleepExternalId: r.sleep_id != null ? String(r.sleep_id) : null,
    recoveredAt: new Date(r.updated_at),
    score: r.score?.recovery_score ?? null,
    hrvRmssd: r.score?.hrv_rmssd_milli ?? null,
    restingHr: r.score?.resting_heart_rate ?? null,
    spo2: r.score?.spo2_percentage ?? null,
    skinTempC: r.score?.skin_temp_celsius ?? null,
    raw: r as unknown as Prisma.InputJsonValue,
  };
}

export function sleepData(
  s: WhoopSleepPayload,
  tenantId: string,
  athleteId: string,
): Prisma.WhoopSleepUncheckedCreateInput {
  const stage = s.score?.stage_summary;
  return {
    tenantId,
    athleteId,
    externalId: String(s.id),
    start: new Date(s.start),
    end: new Date(s.end),
    nap: s.nap,
    performance: s.score?.sleep_performance_percentage ?? null,
    efficiency: s.score?.sleep_efficiency_percentage ?? null,
    totalInBedMs: stage?.total_in_bed_time_milli ?? null,
    totalAsleepMs:
      stage?.total_light_sleep_time_milli != null ||
      stage?.total_slow_wave_sleep_time_milli != null ||
      stage?.total_rem_sleep_time_milli != null
        ? (stage?.total_light_sleep_time_milli ?? 0) +
          (stage?.total_slow_wave_sleep_time_milli ?? 0) +
          (stage?.total_rem_sleep_time_milli ?? 0)
        : null,
    disturbances: stage?.disturbance_count ?? null,
    raw: s as unknown as Prisma.InputJsonValue,
  };
}

export function workoutData(
  w: WhoopWorkoutPayload,
  tenantId: string,
  athleteId: string,
): Prisma.WhoopWorkoutUncheckedCreateInput {
  return {
    tenantId,
    athleteId,
    externalId: String(w.id),
    sportId: w.sport_id,
    start: new Date(w.start),
    end: new Date(w.end),
    strain: w.score?.strain ?? null,
    averageHr: w.score?.average_heart_rate ?? null,
    maxHr: w.score?.max_heart_rate ?? null,
    kilojoule: w.score?.kilojoule ?? null,
    zoneDurationMs: w.score?.zone_duration
      ? (w.score.zone_duration as unknown as Prisma.InputJsonValue)
      : Prisma.JsonNull,
    raw: w as unknown as Prisma.InputJsonValue,
  };
}

export async function upsertCycles(
  payloads: WhoopCyclePayload[],
  tenantId: string,
  athleteId: string,
): Promise<WhoopCycle[]> {
  const out: WhoopCycle[] = [];
  for (const c of payloads) {
    const data = cycleData(c, tenantId, athleteId);
    const row = await rawDb.whoopCycle.upsert({
      where: { externalId: data.externalId },
      create: data,
      update: {
        end: data.end,
        strain: data.strain,
        kilojoule: data.kilojoule,
        averageHr: data.averageHr,
        maxHr: data.maxHr,
        scoreState: data.scoreState,
        raw: data.raw,
        syncedAt: new Date(),
      },
    });
    out.push(row);
  }
  return out;
}

export async function upsertRecoveries(
  payloads: WhoopRecoveryPayload[],
  tenantId: string,
  athleteId: string,
): Promise<WhoopRecovery[]> {
  const out: WhoopRecovery[] = [];
  for (const r of payloads) {
    const data = recoveryData(r, tenantId, athleteId);
    const row = await rawDb.whoopRecovery.upsert({
      where: { cycleExternalId: data.cycleExternalId },
      create: data,
      update: {
        sleepExternalId: data.sleepExternalId,
        recoveredAt: data.recoveredAt,
        score: data.score,
        hrvRmssd: data.hrvRmssd,
        restingHr: data.restingHr,
        spo2: data.spo2,
        skinTempC: data.skinTempC,
        raw: data.raw,
        syncedAt: new Date(),
      },
    });
    out.push(row);
  }
  return out;
}

export async function upsertSleeps(
  payloads: WhoopSleepPayload[],
  tenantId: string,
  athleteId: string,
): Promise<WhoopSleep[]> {
  const out: WhoopSleep[] = [];
  for (const s of payloads) {
    const data = sleepData(s, tenantId, athleteId);
    const row = await rawDb.whoopSleep.upsert({
      where: { externalId: data.externalId },
      create: data,
      update: {
        start: data.start,
        end: data.end,
        nap: data.nap,
        performance: data.performance,
        efficiency: data.efficiency,
        totalInBedMs: data.totalInBedMs,
        totalAsleepMs: data.totalAsleepMs,
        disturbances: data.disturbances,
        raw: data.raw,
        syncedAt: new Date(),
      },
    });
    out.push(row);
  }
  return out;
}

export async function upsertWorkouts(
  payloads: WhoopWorkoutPayload[],
  tenantId: string,
  athleteId: string,
): Promise<WhoopWorkout[]> {
  const out: WhoopWorkout[] = [];
  for (const w of payloads) {
    const data = workoutData(w, tenantId, athleteId);
    const row = await rawDb.whoopWorkout.upsert({
      where: { externalId: data.externalId },
      create: data,
      update: {
        sportId: data.sportId,
        start: data.start,
        end: data.end,
        strain: data.strain,
        averageHr: data.averageHr,
        maxHr: data.maxHr,
        kilojoule: data.kilojoule,
        zoneDurationMs: data.zoneDurationMs,
        raw: data.raw,
        syncedAt: new Date(),
      },
    });
    out.push(row);
  }
  return out;
}

// ─── Score ↔ WhoopWorkout linker ──────────────────────────────────────────────

/**
 * Heuristic: link each unlinked WhoopWorkout to the closest Score from the
 * same athlete whose createdAt falls within ±SCORE_LINK_WINDOW_MS of the
 * workout's start..end window. Idempotent — only writes when scoreId changes.
 */
export async function linkScoresForWorkouts(
  athleteId: string,
  workouts: WhoopWorkout[],
): Promise<{ linked: number }> {
  let linked = 0;
  for (const w of workouts) {
    if (w.scoreId) continue;
    const windowStart = new Date(w.start.getTime() - SCORE_LINK_WINDOW_MS);
    const windowEnd = new Date(w.end.getTime() + SCORE_LINK_WINDOW_MS);
    const candidate = await rawDb.score.findFirst({
      where: {
        athleteId,
        createdAt: { gte: windowStart, lte: windowEnd },
        whoopWorkout: null,
      },
      orderBy: { createdAt: "asc" },
    });
    if (!candidate) continue;
    await rawDb.whoopWorkout.update({
      where: { id: w.id },
      data: { scoreId: candidate.id },
    });
    linked++;
  }
  return { linked };
}

// ─── Top-level sync ───────────────────────────────────────────────────────────

export type SyncRange = { start: Date; end: Date };

export type SyncOutcome = {
  cycles: number;
  recoveries: number;
  sleeps: number;
  workouts: number;
  linkedScores: number;
  refreshedToken: boolean;
  range: SyncRange;
};

export async function syncConnection(
  connectionId: string,
  range: SyncRange,
): Promise<SyncOutcome> {
  const conn = await rawDb.wearableConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  if (conn.provider !== "WHOOP") {
    throw new Error(`syncConnection: provider ${conn.provider} not supported`);
  }
  if (conn.status === "REVOKED") {
    throw new Error(`syncConnection: connection ${conn.id} is REVOKED`);
  }

  const { accessToken, refreshed } = await ensureFreshToken(conn);

  const [cycles, recoveries, sleeps, workouts] = await Promise.all([
    paginateAll((q) => fetchCyclesPage(accessToken, q), range),
    paginateAll((q) => fetchRecoveryPage(accessToken, q), range),
    paginateAll((q) => fetchSleepPage(accessToken, q), range),
    paginateAll((q) => fetchWorkoutPage(accessToken, q), range),
  ]);

  const [cycleRows, recoveryRows, sleepRows, workoutRows] = await Promise.all([
    upsertCycles(cycles, conn.tenantId, conn.athleteId),
    upsertRecoveries(recoveries, conn.tenantId, conn.athleteId),
    upsertSleeps(sleeps, conn.tenantId, conn.athleteId),
    upsertWorkouts(workouts, conn.tenantId, conn.athleteId),
  ]);

  const { linked } = await linkScoresForWorkouts(conn.athleteId, workoutRows);

  await rawDb.wearableConnection.update({
    where: { id: conn.id },
    data: { lastSyncedAt: new Date(), status: "CONNECTED" },
  });

  return {
    cycles: cycleRows.length,
    recoveries: recoveryRows.length,
    sleeps: sleepRows.length,
    workouts: workoutRows.length,
    linkedScores: linked,
    refreshedToken: refreshed,
    range,
  };
}

export async function runInitialBackfill(
  connectionId: string,
): Promise<SyncOutcome> {
  const end = new Date();
  const start = new Date(
    end.getTime() - INITIAL_BACKFILL_DAYS * 24 * 60 * 60 * 1000,
  );
  return syncConnection(connectionId, { start, end });
}

export async function runIncrementalSync(
  connectionId: string,
): Promise<SyncOutcome> {
  const conn = await rawDb.wearableConnection.findUniqueOrThrow({
    where: { id: connectionId },
  });
  const end = new Date();
  const fallback = new Date(
    end.getTime() - INITIAL_BACKFILL_DAYS * 24 * 60 * 60 * 1000,
  );
  const start = conn.lastSyncedAt ?? fallback;
  return syncConnection(connectionId, { start, end });
}
