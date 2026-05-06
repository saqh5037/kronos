"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  decideBooking,
  decideCancel,
  nextWaitlistPromotion,
  type BookingSnapshot,
  type BookingWindow,
} from "@/lib/booking";
import { logAudit } from "../audit";
import { trackEvent } from "@/lib/analytics";

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
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
): Promise<AvailableClass[]> {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);
  const me = await getMyAthlete(session.user.id, session.user.tenantId);

  const from = new Date();
  const to = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);

  const classes = await db.class.findMany({
    where: {
      startsAt: { gte: from, lte: to },
      isActive: true,
    },
    orderBy: { startsAt: "asc" },
    include: {
      coach: { select: { name: true } },
      wod: { select: { name: true, type: true } },
      bookings: {
        select: { id: true, athleteId: true, status: true },
      },
    },
  });

  return classes.map((c) => {
    const booked = c.bookings.filter(
      (b) => b.status === "BOOKED" || b.status === "ATTENDED",
    ).length;
    const waitlist = c.bookings.filter((b) => b.status === "WAITLIST").length;
    const mine = me
      ? c.bookings.find(
          (b) => b.athleteId === me.id && b.status !== "CANCELLED",
        )
      : null;
    return {
      id: c.id,
      startsAt: c.startsAt,
      durationMin: c.durationMin,
      capacity: c.capacity,
      kind: c.kind,
      bookedCount: booked,
      waitlistCount: waitlist,
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
  const window = await getBoxBookingWindow(tenantId);

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
      });
      if (!booking) throw new Error("Reserva no encontrada");

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
