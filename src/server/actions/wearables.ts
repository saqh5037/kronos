"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { WearableProvider, WearableStatus } from "@prisma/client";
import { requireCachedSession } from "@/server/session";
import { withTenant } from "@/server/db";
import { logAudit } from "@/server/audit";
import { trackEvent } from "@/lib/analytics";
import { decryptToken } from "@/lib/crypto/token-vault";
import { revokeAccessToken } from "@/lib/wearables/whoop-client";
import {
  runIncrementalSync,
  WhoopReconnectRequiredError,
} from "@/lib/wearables/whoop-sync";

const providerSchema = z.enum(["WHOOP", "GARMIN", "APPLE_HEALTH", "OURA"]);

export type WearableSummary = {
  id: string;
  provider: WearableProvider;
  status: WearableStatus;
  scopes: string[];
  externalUserId: string;
  expiresAt: Date;
  lastSyncedAt: Date | null;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  createdAt: Date;
};

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export async function getMyWearableConnections(): Promise<WearableSummary[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const rows = await db.wearableConnection.findMany({
    where: { athleteId: me.id },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    status: r.status,
    scopes: r.scopes,
    externalUserId: r.externalUserId,
    expiresAt: r.expiresAt,
    lastSyncedAt: r.lastSyncedAt,
    lastErrorAt: r.lastErrorAt,
    lastErrorMessage: r.lastErrorMessage,
    createdAt: r.createdAt,
  }));
}

export async function disconnectWearable(
  providerInput: WearableProvider,
): Promise<{ ok: true }> {
  const provider = providerSchema.parse(providerInput);
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  const conn = await db.wearableConnection.findFirst({
    where: { athleteId: me.id, provider },
  });
  if (!conn) return { ok: true };

  if (provider === "WHOOP") {
    try {
      const accessToken = decryptToken(conn.accessToken);
      await revokeAccessToken(accessToken);
    } catch (err) {
      console.warn(
        "[wearables] revoke failed (continuing with local delete)",
        err,
      );
    }
  }

  await db.wearableConnection.delete({ where: { id: conn.id } });

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "WEARABLE_DISCONNECTED",
    targetType: "WearableConnection",
    targetId: conn.id,
    metadata: { provider },
  });
  await trackEvent("wearable_disconnected", {
    tenantId,
    actorId: session.user.id,
    provider,
  });

  revalidatePath("/atleta/dispositivos");
  revalidatePath("/atleta");
  return { ok: true };
}

export async function toggleShareWithCoach(value: boolean): Promise<void> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  await db.athlete.update({
    where: { id: me.id },
    data: { shareWearableWithCoach: value },
  });
  revalidatePath("/atleta/dispositivos");
  revalidatePath("/atleta/ajustes");
}

export type RecoverySnapshot = {
  recoveredAt: Date;
  score: number | null;
  hrvRmssd: number | null;
  restingHr: number | null;
  spo2: number | null;
  band: "GREEN" | "YELLOW" | "RED" | "UNSCORED";
};

function recoveryBand(score: number | null): RecoverySnapshot["band"] {
  if (score == null) return "UNSCORED";
  if (score >= 67) return "GREEN";
  if (score >= 34) return "YELLOW";
  return "RED";
}

export async function getMyLatestRecovery(): Promise<RecoverySnapshot | null> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return null;

  const db = withTenant(tenantId);
  const r = await db.whoopRecovery.findFirst({
    where: { athleteId: me.id },
    orderBy: { recoveredAt: "desc" },
  });
  if (!r) return null;
  return {
    recoveredAt: r.recoveredAt,
    score: r.score,
    hrvRmssd: r.hrvRmssd,
    restingHr: r.restingHr,
    spo2: r.spo2,
    band: recoveryBand(r.score),
  };
}

export type WhoopOverviewPoint = {
  date: Date;
  recovery: number | null;
  strain: number | null;
  sleepPerformance: number | null;
};

export type WhoopOverview = {
  athleteId: string;
  shared: true;
  range: { from: Date; to: Date };
  points: WhoopOverviewPoint[];
  latestRecovery: RecoverySnapshot | null;
};

export type WhoopOverviewBlocked = { athleteId: string; shared: false };

/**
 * For admin/coach view in /admin/atletas/[id]. Gated by the athlete's
 * shareWearableWithCoach flag. Returns null when the caller is not OWNER /
 * COACH / STAFF of the athlete's tenant.
 */
export async function getAthleteWhoopOverview(
  athleteId: string,
  range: { from: Date; to: Date },
): Promise<WhoopOverview | WhoopOverviewBlocked | null> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") return null;

  const db = withTenant(tenantId);
  const athlete = await db.athlete.findUnique({
    where: { id: athleteId },
    select: { id: true, shareWearableWithCoach: true },
  });
  if (!athlete) return null;
  if (!athlete.shareWearableWithCoach) {
    return { athleteId, shared: false };
  }

  const [recoveries, cycles, sleeps] = await Promise.all([
    db.whoopRecovery.findMany({
      where: {
        athleteId,
        recoveredAt: { gte: range.from, lte: range.to },
      },
      orderBy: { recoveredAt: "asc" },
    }),
    db.whoopCycle.findMany({
      where: { athleteId, start: { gte: range.from, lte: range.to } },
      orderBy: { start: "asc" },
    }),
    db.whoopSleep.findMany({
      where: { athleteId, start: { gte: range.from, lte: range.to } },
      orderBy: { start: "asc" },
    }),
  ]);

  const byDay = new Map<string, WhoopOverviewPoint>();
  for (const r of recoveries) {
    const day = r.recoveredAt.toISOString().slice(0, 10);
    const point: WhoopOverviewPoint = byDay.get(day) ?? {
      date: new Date(`${day}T00:00:00.000Z`),
      recovery: null,
      strain: null,
      sleepPerformance: null,
    };
    point.recovery = r.score ?? null;
    byDay.set(day, point);
  }
  for (const c of cycles) {
    const day = c.start.toISOString().slice(0, 10);
    const point: WhoopOverviewPoint = byDay.get(day) ?? {
      date: new Date(`${day}T00:00:00.000Z`),
      recovery: null,
      strain: null,
      sleepPerformance: null,
    };
    point.strain = c.strain ?? null;
    byDay.set(day, point);
  }
  for (const s of sleeps) {
    if (s.nap) continue;
    const day = s.start.toISOString().slice(0, 10);
    const point: WhoopOverviewPoint = byDay.get(day) ?? {
      date: new Date(`${day}T00:00:00.000Z`),
      recovery: null,
      strain: null,
      sleepPerformance: null,
    };
    point.sleepPerformance = s.performance ?? null;
    byDay.set(day, point);
  }

  const points = Array.from(byDay.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  const latest = recoveries.at(-1);
  return {
    athleteId,
    shared: true,
    range,
    points,
    latestRecovery: latest
      ? {
          recoveredAt: latest.recoveredAt,
          score: latest.score,
          hrvRmssd: latest.hrvRmssd,
          restingHr: latest.restingHr,
          spo2: latest.spo2,
          band: recoveryBand(latest.score),
        }
      : null,
  };
}

export type SyncTrigger = {
  ok: boolean;
  message: string;
  counts?: {
    cycles: number;
    recoveries: number;
    sleeps: number;
    workouts: number;
    linkedScores: number;
  };
};

export async function triggerManualSync(
  providerInput: WearableProvider,
): Promise<SyncTrigger> {
  const provider = providerSchema.parse(providerInput);
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("Athlete profile not found for user");

  const db = withTenant(tenantId);
  const conn = await db.wearableConnection.findFirst({
    where: { athleteId: me.id, provider, status: "CONNECTED" },
  });
  if (!conn) {
    return { ok: false, message: "No hay conexión activa para sincronizar" };
  }

  if (provider !== "WHOOP") {
    return { ok: false, message: `Provider ${provider} aún no soportado` };
  }

  try {
    const outcome = await runIncrementalSync(conn.id);
    revalidatePath("/atleta/dispositivos");
    revalidatePath("/atleta");
    return {
      ok: true,
      message: "Sincronización completada",
      counts: {
        cycles: outcome.cycles,
        recoveries: outcome.recoveries,
        sleeps: outcome.sleeps,
        workouts: outcome.workouts,
        linkedScores: outcome.linkedScores,
      },
    };
  } catch (err) {
    if (err instanceof WhoopReconnectRequiredError) {
      return {
        ok: false,
        message: "Reconectá tu Whoop para seguir sincronizando",
      };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}
