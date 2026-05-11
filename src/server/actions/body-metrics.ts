"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  bodyMetricSchema,
  type BodyMetricType,
} from "@/lib/validations/body-metric";
import { maybeAchieveWellnessGoals } from "./goals";
import { can } from "../permissions";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

export type BodyMetricEntry = {
  id: string;
  type: BodyMetricType;
  label: string | null;
  value: number;
  unit: string;
  measuredAt: Date;
  notes: string | null;
};

export async function listMyBodyMetrics(opts?: {
  type?: BodyMetricType;
  limit?: number;
}): Promise<BodyMetricEntry[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const rows = await db.bodyMetric.findMany({
    where: {
      athleteId: me.id,
      ...(opts?.type ? { type: opts.type } : {}),
    },
    orderBy: { measuredAt: "desc" },
    take: Math.min(opts?.limit ?? 100, 500),
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type as BodyMetricType,
    label: r.label,
    value: Number(r.value),
    unit: r.unit,
    measuredAt: r.measuredAt,
    notes: r.notes,
  }));
}

export async function listAthleteBodyMetrics(
  athleteId: string,
  opts?: { type?: BodyMetricType; limit?: number },
): Promise<BodyMetricEntry[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const rows = await db.bodyMetric.findMany({
    where: {
      athleteId,
      ...(opts?.type ? { type: opts.type } : {}),
    },
    orderBy: { measuredAt: "desc" },
    take: Math.min(opts?.limit ?? 100, 500),
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type as BodyMetricType,
    label: r.label,
    value: Number(r.value),
    unit: r.unit,
    measuredAt: r.measuredAt,
    notes: r.notes,
  }));
}

export async function createBodyMetric(
  data: unknown,
): Promise<BodyMetricEntry> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const parsed = bodyMetricSchema.parse(data);
  const created = await rawDb.bodyMetric.create({
    data: {
      tenantId,
      athleteId: me.id,
      type: parsed.type,
      label: parsed.label ?? null,
      value: parsed.value,
      unit: parsed.unit,
      measuredAt: parsed.measuredAt ?? new Date(),
      notes: parsed.notes ?? null,
    },
  });

  // Auto-achieve wellness goals if the new measurement crosses the target.
  if (parsed.type === "WEIGHT" || parsed.type === "BODY_FAT") {
    await maybeAchieveWellnessGoals(me.id, tenantId).catch(() => 0);
  }

  revalidatePath("/atleta/perfil");
  revalidatePath("/atleta/salud");
  return {
    id: created.id,
    type: created.type as BodyMetricType,
    label: created.label,
    value: Number(created.value),
    unit: created.unit,
    measuredAt: created.measuredAt,
    notes: created.notes,
  };
}

/**
 * Coach/admin flow: register a body metric on behalf of another athlete.
 * Requires the MANAGE_ATHLETE_METRICS permission for non-OWNER roles, plus
 * tenant isolation (the target athlete must belong to the caller's box).
 */
export async function createBodyMetricForAthlete(
  athleteId: string,
  data: unknown,
): Promise<BodyMetricEntry> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;

  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    throw new Error("Solo OWNER/COACH/STAFF puede registrar mediciones");
  }
  const auth = await can("MANAGE_ATHLETE_METRICS", session);
  if (!auth.allowed) {
    throw new Error("No tienes permiso para registrar mediciones");
  }

  const db = withTenant(tenantId);
  const target = await db.athlete.findFirst({ where: { id: athleteId } });
  if (!target) throw new Error("Atleta no encontrado");

  const parsed = bodyMetricSchema.parse(data);
  const created = await rawDb.bodyMetric.create({
    data: {
      tenantId,
      athleteId: target.id,
      type: parsed.type,
      label: parsed.label ?? null,
      value: parsed.value,
      unit: parsed.unit,
      measuredAt: parsed.measuredAt ?? new Date(),
      notes: parsed.notes ?? null,
    },
  });

  if (parsed.type === "WEIGHT" || parsed.type === "BODY_FAT") {
    await maybeAchieveWellnessGoals(target.id, tenantId).catch(() => 0);
  }

  revalidatePath(`/admin/atletas/${target.id}`);
  revalidatePath("/atleta/salud");
  return {
    id: created.id,
    type: created.type as BodyMetricType,
    label: created.label,
    value: Number(created.value),
    unit: created.unit,
    measuredAt: created.measuredAt,
    notes: created.notes,
  };
}

export async function deleteBodyMetric(id: string): Promise<{ ok: true }> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const db = withTenant(tenantId);
  const row = await db.bodyMetric.findUnique({ where: { id } });
  if (!row || row.athleteId !== me.id) throw new Error("Métrica no encontrada");

  await rawDb.bodyMetric.delete({ where: { id } });
  revalidatePath("/atleta/perfil");
  revalidatePath("/atleta/salud");
  return { ok: true };
}

export type BodyMetricHistoryPoint = {
  date: string;
  value: number;
};

/**
 * Time-bound history of a single metric type for the current athlete.
 * Ordered ascending by `measuredAt`. Caps at 500 rows.
 */
export async function getBodyMetricsHistory(
  type: BodyMetricType,
  daysBack: number = 90,
): Promise<BodyMetricHistoryPoint[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const since = new Date(Date.now() - daysBack * 86_400_000);
  const db = withTenant(tenantId);
  const rows = await db.bodyMetric.findMany({
    where: {
      athleteId: me.id,
      type,
      measuredAt: { gte: since },
    },
    orderBy: { measuredAt: "asc" },
    take: 500,
  });

  return rows.map((r) => ({
    date: r.measuredAt.toISOString().slice(0, 10),
    value: Number(r.value),
  }));
}

export type LatestByType = {
  type: BodyMetricType;
  label: string | null;
  latest: { value: number; unit: string; measuredAt: Date };
  previous: { value: number; measuredAt: Date } | null;
  trend: "up" | "down" | "flat";
};

/**
 * Latest measurement of every type the athlete has, with the previous value
 * and trend pre-computed for fast UI rendering.
 */
export async function getLatestByType(): Promise<LatestByType[]> {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) return [];

  const db = withTenant(tenantId);
  const rows = await db.bodyMetric.findMany({
    where: { athleteId: me.id },
    orderBy: { measuredAt: "desc" },
    take: 500,
  });

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.type}:${r.label ?? ""}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  const out: LatestByType[] = [];
  for (const [, list] of grouped) {
    const latest = list[0];
    const previous = list[1] ?? null;
    let trend: "up" | "down" | "flat" = "flat";
    if (previous) {
      const a = Number(latest.value);
      const b = Number(previous.value);
      const tol = Math.abs(b) * 0.01 || 0.05;
      if (Math.abs(a - b) <= tol) trend = "flat";
      else trend = a > b ? "up" : "down";
    }
    out.push({
      type: latest.type as BodyMetricType,
      label: latest.label,
      latest: {
        value: Number(latest.value),
        unit: latest.unit,
        measuredAt: latest.measuredAt,
      },
      previous: previous
        ? {
            value: Number(previous.value),
            measuredAt: previous.measuredAt,
          }
        : null,
      trend,
    });
  }
  return out;
}
