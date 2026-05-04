"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  classSchema,
  expandRecurrence,
  recurrenceToRRule,
} from "@/lib/validations/class";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}

export type ClassRow = {
  id: string;
  startsAt: Date;
  durationMin: number;
  capacity: number;
  isActive: boolean;
  recurrenceRule: string | null;
  coach: { id: string; name: string | null } | null;
  wod: { id: string; name: string } | null;
  bookingCount: number;
};

export async function listClassesInRange(
  from: Date,
  to: Date,
): Promise<ClassRow[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const classes = await db.class.findMany({
    where: {
      startsAt: { gte: from, lte: to },
      isActive: true,
    },
    orderBy: { startsAt: "asc" },
    include: {
      coach: { select: { id: true, name: true } },
      wod: { select: { id: true, name: true } },
      _count: { select: { bookings: true } },
    },
  });

  return classes.map((c) => ({
    id: c.id,
    startsAt: c.startsAt,
    durationMin: c.durationMin,
    capacity: c.capacity,
    isActive: c.isActive,
    recurrenceRule: c.recurrenceRule,
    coach: c.coach,
    wod: c.wod,
    bookingCount: c._count.bookings,
  }));
}

export async function listCoaches() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.user.findMany({
    where: { role: { in: ["COACH", "OWNER"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
}

export async function listWODs() {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  return db.wOD.findMany({
    where: { isActive: true },
    select: { id: true, name: true, type: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createClass(data: unknown) {
  const session = await requireSession();
  const parsed = classSchema.parse(data);

  const tenantId = session.user.tenantId;
  const rrule = recurrenceToRRule(parsed.recurrence);
  const dates = expandRecurrence(parsed.startsAt, rrule);

  // Use raw client for createMany — withTenant() doesn't extend createMany.
  // We pass tenantId explicitly on every row.
  const rows = dates.map((d) => ({
    tenantId,
    startsAt: d,
    durationMin: parsed.durationMin,
    capacity: parsed.capacity,
    coachId: parsed.coachId ?? null,
    wodId: parsed.wodId ?? null,
    recurrenceRule: rrule,
  }));

  const result = await rawDb.class.createMany({ data: rows });
  revalidatePath("/admin/programacion");
  return { created: result.count };
}

export async function cancelClass(id: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  await db.class.update({
    where: { id },
    data: { isActive: false },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "CLASS_CANCELLED",
    targetType: "Class",
    targetId: id,
  });

  await trackEvent("class_cancelled", {
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    classId: id,
  });

  revalidatePath("/admin/programacion");
  return { ok: true };
}

export async function updateClass(id: string, data: unknown) {
  const session = await requireSession();
  const parsed = classSchema.parse(data);
  const db = withTenant(session.user.tenantId);

  await db.class.update({
    where: { id },
    data: {
      startsAt: parsed.startsAt,
      durationMin: parsed.durationMin,
      capacity: parsed.capacity,
      coachId: parsed.coachId ?? null,
      wodId: parsed.wodId ?? null,
    },
  });
  revalidatePath("/admin/programacion");
  return { ok: true };
}
