"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "../auth";
import { db as prismaBase } from "../db";
import { boxSettingsSchema } from "@/lib/validations/box";
import { revalidatePath } from "next/cache";
import { UnauthorizedError, BoxNotFoundError, DBError } from "@/lib/errors";

export type BoxSettings = {
  id: string;
  slug: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  defaultClassCapacity: number;
  brandColor: string | null;
  logoUrl: string | null;
  supportCode: string | null;
};

export async function getBox(): Promise<BoxSettings> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UnauthorizedError();

  const tenantId = session.user.tenantId;

  let box: BoxSettings | null;
  try {
    box = await prismaBase.box.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        slug: true,
        name: true,
        locale: true,
        currency: true,
        timezone: true,
        defaultClassCapacity: true,
        brandColor: true,
        logoUrl: true,
        supportCode: true,
      },
    });
  } catch (e) {
    throw new DBError(e, "getBox: prisma.box.findUnique failed");
  }

  if (!box) throw new BoxNotFoundError(tenantId);
  return box;
}

export async function updateBox(data: unknown) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede modificar ajustes");
  }

  const parsed = boxSettingsSchema.parse(data);

  // Box.update intentionally bypasses the tenant extension because Box itself
  // is the tenant — withTenant would inject a tenantId filter on a model that
  // does not have that column. We scope by id (which equals the tenantId).
  const updated = await prismaBase.box.update({
    where: { id: session.user.tenantId },
    data: {
      name: parsed.name,
      locale: parsed.locale,
      currency: parsed.currency,
      timezone: parsed.timezone,
      defaultClassCapacity: parsed.defaultClassCapacity,
      brandColor: parsed.brandColor ?? null,
      logoUrl: parsed.logoUrl ?? null,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      locale: true,
      currency: true,
      timezone: true,
      defaultClassCapacity: true,
      brandColor: true,
      logoUrl: true,
    },
  });

  revalidatePath("/admin/ajustes");
  revalidatePath(`/tv/${updated.slug}`);
  return updated;
}

export type DaySchedule = { kind: "WOD" | "OPEN_BOX"; hours: number[] } | null;
export type WeeklySchedule = {
  mon: DaySchedule;
  tue: DaySchedule;
  wed: DaySchedule;
  thu: DaySchedule;
  fri: DaySchedule;
  sat: DaySchedule;
  sun: DaySchedule;
};

export type BoxScheduleSettings = {
  defaultClassCapacity: number;
  bookingOpenHoursAhead: number;
  cancelCloseMinBefore: number;
  weeklySchedule: WeeklySchedule;
};

const EMPTY_SCHEDULE: WeeklySchedule = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
};

export async function getBoxSchedule(): Promise<BoxScheduleSettings> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new UnauthorizedError();

  const tenantId = session.user.tenantId;
  let box;
  try {
    box = await prismaBase.box.findUnique({
      where: { id: tenantId },
      select: {
        defaultClassCapacity: true,
        bookingOpenHoursAhead: true,
        cancelCloseMinBefore: true,
        weeklySchedule: true,
      },
    });
  } catch (e) {
    throw new DBError(e, "getBoxSchedule: prisma.box.findUnique failed");
  }
  if (!box) throw new BoxNotFoundError(tenantId);

  return {
    defaultClassCapacity: box.defaultClassCapacity,
    bookingOpenHoursAhead: box.bookingOpenHoursAhead,
    cancelCloseMinBefore: box.cancelCloseMinBefore,
    weeklySchedule:
      (box.weeklySchedule as WeeklySchedule | null) ?? EMPTY_SCHEDULE,
  };
}

export async function updateBoxSchedule(input: BoxScheduleSettings) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") {
    throw new Error("Forbidden: solo OWNER puede modificar horarios");
  }

  const cap = Math.max(
    1,
    Math.min(200, Math.round(input.defaultClassCapacity)),
  );
  const open = Math.max(
    0,
    Math.min(168, Math.round(input.bookingOpenHoursAhead)),
  );
  const close = Math.max(
    0,
    Math.min(720, Math.round(input.cancelCloseMinBefore)),
  );

  // sanitize hours (0-23, dedupe, sort)
  function clean(d: DaySchedule): DaySchedule {
    if (!d) return null;
    const hrs = Array.from(
      new Set(d.hours.filter((h) => Number.isInteger(h) && h >= 0 && h < 24)),
    ).sort((a, b) => a - b);
    if (hrs.length === 0) return null;
    return { kind: d.kind === "OPEN_BOX" ? "OPEN_BOX" : "WOD", hours: hrs };
  }

  const ws: WeeklySchedule = {
    mon: clean(input.weeklySchedule.mon),
    tue: clean(input.weeklySchedule.tue),
    wed: clean(input.weeklySchedule.wed),
    thu: clean(input.weeklySchedule.thu),
    fri: clean(input.weeklySchedule.fri),
    sat: clean(input.weeklySchedule.sat),
    sun: clean(input.weeklySchedule.sun),
  };

  await prismaBase.box.update({
    where: { id: session.user.tenantId },
    data: {
      defaultClassCapacity: cap,
      bookingOpenHoursAhead: open,
      cancelCloseMinBefore: close,
      weeklySchedule: ws,
    },
  });

  revalidatePath("/admin/ajustes/horarios");
  return { ok: true };
}
