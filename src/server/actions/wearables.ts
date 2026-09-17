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
import {
  DEFAULT_BOX_TIMEZONE,
  addCivilDays,
  civilDateInTz,
  dayKeyInTz,
  endOfCivilDay,
  startOfCivilDay,
} from "@/lib/tz";

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
        message: "Reconecta tu Whoop para seguir sincronizando",
      };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Error desconocido",
    };
  }
}

/**
 * `days` trailing window, in the box timezone — never the host's. Mirrors
 * `rangeFromPreset` in `src/lib/dates.ts`: the window edges are civil days in
 * `timeZone`, so "últimos 30 días" means the same 30 calendar days it prints.
 */
function trailingWindow(
  days: number,
  timeZone: string = DEFAULT_BOX_TIMEZONE,
): { from: Date; to: Date } {
  const today = civilDateInTz(new Date(), timeZone);
  return {
    from: startOfCivilDay(addCivilDays(today, -(days - 1)), timeZone),
    to: endOfCivilDay(today, timeZone),
  };
}

export type RecoveryTrendPoint = {
  dayKey: string;
  score: number | null;
  hrvRmssd: number | null;
  restingHr: number | null;
};

/** 30-day (default) recovery trend, oldest first, bucketed by box civil day. */
export async function getMyRecoveryTrend(
  days = 30,
): Promise<RecoveryTrendPoint[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const { from, to } = trailingWindow(days);
  try {
    const rows = await db.whoopRecovery.findMany({
      where: { athleteId: me.id, recoveredAt: { gte: from, lte: to } },
      orderBy: { recoveredAt: "asc" },
    });
    // One recovery per cycle, and two cycles can share a civil day, so a plain
    // row-per-point map would emit the same `dayKey` twice. Keep the last
    // reading of the day — the one the athlete actually woke up to.
    const byDay = new Map<string, RecoveryTrendPoint>();
    for (const r of rows) {
      const dayKey = dayKeyInTz(r.recoveredAt, DEFAULT_BOX_TIMEZONE);
      byDay.set(dayKey, {
        dayKey,
        score: r.score,
        hrvRmssd: r.hrvRmssd,
        restingHr: r.restingHr,
      });
    }
    return Array.from(byDay.values()).sort((a, b) =>
      a.dayKey.localeCompare(b.dayKey),
    );
  } catch (err) {
    console.error("[wearables] getMyRecoveryTrend failed:", err);
    return [];
  }
}

export type SleepTrendStages = {
  lightMin: number | null;
  deepMin: number | null;
  remMin: number | null;
  awakeMin: number | null;
};

export type SleepTrendPoint = {
  dayKey: string;
  asleepMs: number | null;
  inBedMs: number | null;
  needMin: number | null;
  efficiency: number | null;
  performance: number | null;
  stages: SleepTrendStages;
};

type SleepRawShape = {
  needMin?: unknown;
  stages?: {
    lightMin?: unknown;
    deepMin?: unknown;
    remMin?: unknown;
    awakeMin?: unknown;
  };
};

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function parseSleepRaw(raw: unknown): {
  needMin: number | null;
  stages: SleepTrendStages;
} {
  const shape = raw && typeof raw === "object" ? (raw as SleepRawShape) : {};
  const stages =
    shape.stages && typeof shape.stages === "object" ? shape.stages : {};
  return {
    needMin: numberOrNull(shape.needMin),
    stages: {
      lightMin: numberOrNull(stages.lightMin),
      deepMin: numberOrNull(stages.deepMin),
      remMin: numberOrNull(stages.remMin),
      awakeMin: numberOrNull(stages.awakeMin),
    },
  };
}

/** 30-day (default) sleep trend, nights only, oldest first. */
export async function getMySleepTrend(days = 30): Promise<SleepTrendPoint[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const { from, to } = trailingWindow(days);
  try {
    const rows = await db.whoopSleep.findMany({
      where: {
        athleteId: me.id,
        nap: false,
        start: { gte: from, lte: to },
      },
      orderBy: { start: "asc" },
    });
    // Whoop sometimes splits one night into two non-nap records, which then
    // bucket into the same civil day: two bars for one night, and a duplicate
    // React key. Collapse per day — the durations add up because they are the
    // same night's sleep, while the ratio fields (efficiency, performance,
    // stages, need) come from the longest record, i.e. the main sleep rather
    // than the fragment.
    const byDay = new Map<
      string,
      { point: SleepTrendPoint; longestMs: number }
    >();
    for (const row of rows) {
      const { needMin, stages } = parseSleepRaw(row.raw);
      const dayKey = dayKeyInTz(row.start, DEFAULT_BOX_TIMEZONE);
      const asleep = row.totalAsleepMs ?? 0;
      const prev = byDay.get(dayKey);

      if (!prev) {
        byDay.set(dayKey, {
          longestMs: asleep,
          point: {
            dayKey,
            asleepMs: row.totalAsleepMs,
            inBedMs: row.totalInBedMs,
            needMin,
            efficiency: row.efficiency,
            performance: row.performance,
            stages,
          },
        });
        continue;
      }

      prev.point.asleepMs = (prev.point.asleepMs ?? 0) + asleep;
      prev.point.inBedMs = (prev.point.inBedMs ?? 0) + (row.totalInBedMs ?? 0);
      if (asleep > prev.longestMs) {
        prev.longestMs = asleep;
        prev.point.needMin = needMin;
        prev.point.efficiency = row.efficiency;
        prev.point.performance = row.performance;
        prev.point.stages = stages;
      }
    }
    return Array.from(byDay.values())
      .map((v) => v.point)
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  } catch (err) {
    console.error("[wearables] getMySleepTrend failed:", err);
    return [];
  }
}

export type StrainTrendPoint = {
  dayKey: string;
  strain: number | null;
  kilojoule: number | null;
};

/** 30-day (default) daily strain trend, oldest first. */
export async function getMyStrainTrend(days = 30): Promise<StrainTrendPoint[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const { from, to } = trailingWindow(days);
  try {
    const rows = await db.whoopCycle.findMany({
      where: { athleteId: me.id, start: { gte: from, lte: to } },
      orderBy: { start: "asc" },
    });
    // Two cycles can land on the same civil day. Strain is a bounded 0-21
    // score, not a quantity, so the day takes the dominant cycle's strain
    // rather than a meaningless sum; energy IS a quantity, so it adds up.
    const byDay = new Map<string, StrainTrendPoint>();
    for (const c of rows) {
      const dayKey = dayKeyInTz(c.start, DEFAULT_BOX_TIMEZONE);
      const prev = byDay.get(dayKey);
      if (!prev) {
        byDay.set(dayKey, {
          dayKey,
          strain: c.strain,
          kilojoule: c.kilojoule,
        });
        continue;
      }
      if (c.strain != null && (prev.strain == null || c.strain > prev.strain)) {
        prev.strain = c.strain;
      }
      if (c.kilojoule != null) {
        prev.kilojoule = (prev.kilojoule ?? 0) + c.kilojoule;
      }
    }
    return Array.from(byDay.values()).sort((a, b) =>
      a.dayKey.localeCompare(b.dayKey),
    );
  } catch (err) {
    console.error("[wearables] getMyStrainTrend failed:", err);
    return [];
  }
}

export type SportBreakdownRow = {
  slug: string;
  label: string;
  sessions: number;
  totalMs: number;
  avgStrain: number | null;
};

type RawSport = { slug: string; label: string };

/**
 * `WhoopWorkout.sportId` is null on purpose — the canonical sport lives at
 * `raw.sport = { slug, label, whoopActivity }`. Read defensively: an odd or
 * missing shape falls back to "otro" rather than throwing.
 */
function extractSport(raw: unknown): RawSport | null {
  if (!raw || typeof raw !== "object") return null;
  const sport = (raw as Record<string, unknown>).sport;
  if (!sport || typeof sport !== "object") return null;
  const slug = (sport as Record<string, unknown>).slug;
  const label = (sport as Record<string, unknown>).label;
  if (typeof slug !== "string" || typeof label !== "string") return null;
  return { slug, label };
}

/** Sessions per sport over the trailing `days` (default 90), by session count. */
export async function getMySportBreakdown(
  days = 90,
): Promise<SportBreakdownRow[]> {
  const session = await requireCachedSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const { from, to } = trailingWindow(days);
  try {
    const rows = await db.whoopWorkout.findMany({
      where: { athleteId: me.id, start: { gte: from, lte: to } },
      select: { start: true, end: true, strain: true, raw: true },
      orderBy: { start: "asc" },
    });

    const buckets = new Map<
      string,
      {
        slug: string;
        label: string;
        sessions: number;
        totalMs: number;
        strainSum: number;
        strainCount: number;
      }
    >();

    for (const w of rows) {
      const sport = extractSport(w.raw) ?? { slug: "otro", label: "Otro" };
      const durationMs = Math.max(0, w.end.getTime() - w.start.getTime());
      const bucket = buckets.get(sport.slug) ?? {
        slug: sport.slug,
        label: sport.label,
        sessions: 0,
        totalMs: 0,
        strainSum: 0,
        strainCount: 0,
      };
      bucket.sessions += 1;
      bucket.totalMs += durationMs;
      if (w.strain != null) {
        bucket.strainSum += w.strain;
        bucket.strainCount += 1;
      }
      buckets.set(sport.slug, bucket);
    }

    return Array.from(buckets.values())
      .map((b) => ({
        slug: b.slug,
        label: b.label,
        sessions: b.sessions,
        totalMs: b.totalMs,
        avgStrain: b.strainCount > 0 ? b.strainSum / b.strainCount : null,
      }))
      .sort((a, b) => b.sessions - a.sessions);
  } catch (err) {
    console.error("[wearables] getMySportBreakdown failed:", err);
    return [];
  }
}
