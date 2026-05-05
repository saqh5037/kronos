"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  bodyMetricSchema,
  type BodyMetricType,
} from "@/lib/validations/body-metric";

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

  revalidatePath("/atleta/perfil");
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
  return { ok: true };
}
