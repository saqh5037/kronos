"use server";

import { revalidatePath } from "next/cache";
import { requireCachedSession } from "@/server/session";
import { withTenant, db as rawDb } from "../db";
import {
  decideBooking,
  decideCancel,
  nextWaitlistPromotion,
  canCancelBooking,
  type BookingSnapshot,
  type BookingWindow,
} from "@/lib/booking";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";

async function requireSession() {
  return requireCachedSession();
}

/**
 * Resolve the Athlete record bound to the current user.
 * Returns null if user has no athlete profile (coach/owner viewing).
 */
async function getMyAthlete(userId: string, tenantId: string) {
  const db = withTenant(tenantId);
  return db.athlete.findFirst({ where: { userId } });
}

async function getBoxBookingWindow(tenantId: string): Promise<BookingWindow> {
  const box = await rawDb.box.findUnique({
    where: { id: tenantId },
    select: { bookingOpenHoursAhead: true, cancelCloseMinBefore: true },
  });
  return {
    openHoursAhead: box?.bookingOpenHoursAhead ?? 24,
    cancelCloseMinBefore: box?.cancelCloseMinBefore ?? 30,
  };
}

export type AvailableClass = {
  id: string;
  startsAt: Date;
  durationMin: number;
  capacity: number;
  kind: "WOD" | "OPEN_BOX";
  bookedCount: number;
  waitlistCount: number;
  coach: { name: string | null } | null;
  wod: { name: string; type: string } | null;
  myBookingId: string | null;
  myBookingStatus: BookingSnapshot["status"] | null;
};

export async function listAvailableClasses(
  daysAhead = 7,
  fromOverride?: Date,
): Promise<AvailableClass[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await getMyAthlete(session.user.id, session.user.tenantId);

  const from = fromOverride ?? new Date();
  const to = new Date(from.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const classes = await db.class.findMany({
    where: {
      startsAt: { gte: from, lte: to },
      isActive: true,
    },
    orderBy: { startsAt: "asc" },
    include: {
      coach: { select: { name: true } },
      wod: { select: { name: true, type: true } },
    },
  });

  const classIds = classes.map((c) => c.id);

  const [bookingCounts, myBookings] = await Promise.all([
    rawDb.booking.groupBy({
      by: ["classId", "status"],
      where: {
        tenantId: session.user.tenantId,
        classId: { in: classIds },
      },
      _count: { id: true },
    }),
    me
      ? rawDb.booking.findMany({
          where: {
            tenantId: session.user.tenantId,
            classId: { in: classIds },
            athleteId: me.id,
            status: { not: "CANCELLED" },
          },
          select: { id: true, classId: true, status: true },
        })
      : Promise.resolve<{ id: string; classId: string; status: string }[]>([]),
  ]);

  const countMap = new Map<string, { booked: number; waitlist: number }>();
  for (const bc of bookingCounts) {
    const existing = countMap.get(bc.classId) ?? { booked: 0, waitlist: 0 };
    if (bc.status === "BOOKED" || bc.status === "ATTENDED") {
      existing.booked += bc._count.id;
    } else if (bc.status === "WAITLIST") {
      existing.waitlist += bc._count.id;
    }
    countMap.set(bc.classId, existing);
  }

  const myBookingMap = new Map<
    string,
    { id: string; status: BookingSnapshot["status"] }
  >();
  for (const b of myBookings) {
    myBookingMap.set(b.classId, {
      id: b.id,
      status: b.status as BookingSnapshot["status"],
    });
  }

  return classes.map((c) => {
    const counts = countMap.get(c.id) ?? { booked: 0, waitlist: 0 };
    const mine = myBookingMap.get(c.id) ?? null;
    return {
      id: c.id,
      startsAt: c.startsAt,
      durationMin: c.durationMin,
      capacity: c.capacity,
      kind: c.kind,
      bookedCount: counts.booked,
      waitlistCount: counts.waitlist,
      coach: c.coach,
      wod: c.wod,
      myBookingId: mine?.id ?? null,
      myBookingStatus: mine?.status ?? null,
    };
  });
}

export type RosterEntry = {
  bookingId: string;
  athleteId: string;
  firstName: string;
  lastName: string;
  status: BookingSnapshot["status"];
  bookedAt: Date;
  checkedInAt: Date | null;
};

export type ClassRoster = {
  classId: string;
  startsAt: Date;
  capacity: number;
  bookings: RosterEntry[];
  wodName: string | null;
  coachName: string | null;
};

export async function getClassRoster(classId: string): Promise<ClassRoster> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const klass = await db.class.findUnique({
    where: { id: classId },
    include: {
      coach: { select: { name: true } },
      wod: { select: { name: true } },
      bookings: {
        orderBy: { bookedAt: "asc" },
        include: {
          athlete: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!klass) throw new Error("Class not found");

  return {
    classId: klass.id,
    startsAt: klass.startsAt,
    capacity: klass.capacity,
    wodName: klass.wod?.name ?? null,
    coachName: klass.coach?.name ?? null,
    bookings: klass.bookings.map((b) => ({
      bookingId: b.id,
      athleteId: b.athlete.id,
      firstName: b.athlete.firstName,
      lastName: b.athlete.lastName,
      status: b.status,
      bookedAt: b.bookedAt,
      checkedInAt: b.checkedInAt,
    })),
  };
}

export async function bookClass(classId: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const me = await getMyAthlete(session.user.id, tenantId);
  if (!me) throw new Error("No tienes perfil de atleta en este box");

  const window = await getBoxBookingWindow(tenantId);

  // Re-fetch class + bookings INSIDE the transaction so two concurrent
  // requests can't both see the same "1 slot left" state. Serializable
  // isolation makes the second tx retry or fail.
  const decision = await rawDb.$transaction(
    async (tx) => {
      const klass = await tx.class.findFirst({
        where: { id: classId, tenantId },
        include: {
          bookings: { select: { athleteId: true, status: true } },
        },
      });
      if (!klass) throw new Error("Clase no encontrada");

      const d = decideBooking(
        {
          isActive: klass.isActive,
          startsAt: klass.startsAt,
          capacity: klass.capacity,
        },
        klass.bookings as BookingSnapshot[],
        me.id,
        new Date(),
        window,
      );

      if ("error" in d) {
        throw new Error(translateBookingError(d));
      }

      await tx.booking.upsert({
        where: { classId_athleteId: { classId, athleteId: me.id } },
        update: { status: d.status, bookedAt: new Date() },
        create: {
          tenantId,
          classId,
          athleteId: me.id,
          status: d.status,
        },
      });

      return d;
    },
    { isolationLevel: "Serializable" },
  );

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "BOOKING_CREATED",
    targetType: "Class",
    targetId: classId,
    metadata: {
      athleteId: me.id,
      status: decision.status,
      ...("position" in decision ? { position: decision.position } : {}),
    },
  });

  await trackEvent("booking_created", {
    tenantId,
    actorId: session.user.id,
    classId,
    status: decision.status,
    waitlist: decision.status === "WAITLIST",
  });

  revalidatePath("/atleta/reservar");
  revalidatePath("/admin/reservas");
  return decision;
}

export async function cancelBooking(bookingId: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const role = session.user.role as string;
  const window = await getBoxBookingWindow(tenantId);

  // For ATHLETE callers, resolve their athlete profile to check ownership.
  let callerAthleteId: string | null = null;
  if (role === "ATHLETE") {
    const myAthlete = await getMyAthlete(session.user.id, tenantId);
    callerAthleteId = myAthlete?.id ?? null;
  }

  await rawDb.$transaction(
    async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, tenantId },
        include: {
          class: {
            select: {
              id: true,
              startsAt: true,
              bookings: {
                orderBy: { bookedAt: "asc" },
                select: { id: true, status: true },
              },
            },
          },
        },
        // Include athleteId for ownership check
      });
      if (!booking) throw new Error("Reserva no encontrada");

      // Ownership check — ATHLETE can only cancel their own bookings
      if (
        !canCancelBooking({
          role,
          callerAthleteId,
          bookingAthleteId: booking.athleteId,
        })
      ) {
        throw new Error("No autorizado");
      }

      const cancelDecision = decideCancel(
        { startsAt: booking.class.startsAt },
        { status: booking.status },
        new Date(),
        window,
      );
      if ("error" in cancelDecision) {
        if (cancelDecision.error === "ALREADY_CANCELLED") return;
        throw new Error(translateCancelError(cancelDecision));
      }

      // Idempotent: cancelling an already-cancelled booking is a no-op.
      if (booking.status === "CANCELLED") return;

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      });

      // Promote next waitlist atomically — only when freeing a real BOOKED slot
      let promotedId: string | null = null;
      if (booking.status === "BOOKED") {
        const remaining = booking.class.bookings.filter(
          (b) => b.id !== bookingId,
        );
        const promoteId = nextWaitlistPromotion(remaining);
        if (promoteId) {
          await tx.booking.update({
            where: { id: promoteId },
            data: { status: "BOOKED" },
          });
          promotedId = promoteId;
        }
      }

      return { previousStatus: booking.status, promotedId };
    },
    { isolationLevel: "Serializable" },
  );

  await logAudit({
    tenantId,
    actorId: session.user.id,
    action: "BOOKING_CANCELLED",
    targetType: "Booking",
    targetId: bookingId,
  });

  await trackEvent("booking_cancelled", {
    tenantId,
    actorId: session.user.id,
    bookingId,
  });

  revalidatePath("/atleta/reservar");
  revalidatePath("/admin/reservas");
  return { ok: true };
}

export async function checkInAthlete(bookingId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  const updated = await db.booking.update({
    where: { id: bookingId },
    data: { status: "ATTENDED", checkedInAt: new Date() },
  });

  // Fire-and-forget streak recompute. If it fails the check-in still stands.
  try {
    const { recomputeAttendanceStreak } = await import("./attendance");
    await recomputeAttendanceStreak(updated.athleteId);
  } catch (err) {
    console.error("[checkIn] streak recompute failed:", err);
  }

  // Award attendance XP and evaluate achievement unlocks (idempotent).
  try {
    const { awardXP, runAchievementEvaluation } =
      await import("@/server/achievements/evaluate");
    await awardXP({
      tenantId: session.user.tenantId,
      athleteId: updated.athleteId,
      amount: 10,
      reason: "ATTENDANCE",
      sourceType: "Booking",
      sourceId: bookingId,
    });
    await runAchievementEvaluation({
      tenantId: session.user.tenantId,
      athleteId: updated.athleteId,
      trigger: "ATTENDANCE",
    });
  } catch (err) {
    console.error("[checkIn] achievement eval failed:", err);
  }

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "BOOKING_CHECKIN",
    targetType: "Booking",
    targetId: bookingId,
    metadata: { athleteId: updated.athleteId },
  });

  await trackEvent("booking_checkin", {
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    bookingId,
    athleteId: updated.athleteId,
  });

  revalidatePath("/admin/reservas");
  revalidatePath("/admin/asistencia");
  return { ok: true };
}

export async function markNoShow(bookingId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "NOSHOW" },
  });

  await logAudit({
    tenantId: session.user.tenantId,
    actorId: session.user.id,
    action: "BOOKING_NOSHOW",
    targetType: "Booking",
    targetId: bookingId,
  });

  revalidatePath("/admin/reservas");
  return { ok: true };
}

function translateBookingError(d: { error: string; opensAt?: Date }): string {
  switch (d.error) {
    case "CLASS_CANCELLED":
      return "Esta clase fue cancelada";
    case "CLASS_IN_PAST":
      return "Esta clase ya empezó";
    case "ALREADY_BOOKED":
      return "Ya tienes reserva en esta clase";
    case "BOOKING_NOT_OPEN_YET":
      return d.opensAt
        ? `Las reservas abren ${formatRelative(d.opensAt)}`
        : "Las reservas aún no están abiertas";
    default:
      return "No se pudo reservar";
  }
}

function translateCancelError(d: { error: string; deadline?: Date }): string {
  switch (d.error) {
    case "CLASS_IN_PAST":
      return "Esta clase ya empezó";
    case "CANCEL_TOO_LATE":
      return "Ya no se puede cancelar (cierre 30 min antes)";
    default:
      return "No se pudo cancelar";
  }
}

function formatRelative(target: Date): string {
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "ahora";
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours >= 24) return `en ${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 1) return `en ${hours}h`;
  const min = Math.max(1, Math.floor(ms / (1000 * 60)));
  return `en ${min} min`;
}

export type UsualSlot = { hour: number; count: number };

/**
 * Compute the athlete's most-reserved hours over the last `daysBack` days.
 * Returns up to top 3 slots ordered by frequency.
 * Useful for "tu horario habitual" suggestions in the atleta UI.
 */
export async function getAthleteUsualSlots(
  daysBack = 60,
): Promise<UsualSlot[]> {
  const session = await requireSession();
  const me = await getMyAthlete(session.user.id, session.user.tenantId);
  if (!me) return [];

  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
  const db = withTenant(session.user.tenantId);
  const recent = await db.booking.findMany({
    where: {
      athleteId: me.id,
      status: { in: ["BOOKED", "ATTENDED"] },
      class: { startsAt: { gte: since } },
    },
    select: { class: { select: { startsAt: true } } },
  });

  const counts = new Map<number, number>();
  for (const b of recent) {
    const h = b.class.startsAt.getHours();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}
