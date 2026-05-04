"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { withTenant, db as rawDb } from "../db";
import {
  decideBooking,
  nextWaitlistPromotion,
  type BookingSnapshot,
} from "@/lib/booking";

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

export type AvailableClass = {
  id: string;
  startsAt: Date;
  durationMin: number;
  capacity: number;
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

  const db = withTenant(tenantId);
  const klass = await db.class.findUnique({
    where: { id: classId },
    include: {
      bookings: { select: { athleteId: true, status: true } },
    },
  });
  if (!klass) throw new Error("Clase no encontrada");

  const decision = decideBooking(
    {
      isActive: klass.isActive,
      startsAt: klass.startsAt,
      capacity: klass.capacity,
    },
    klass.bookings as BookingSnapshot[],
    me.id,
  );

  if ("error" in decision) {
    throw new Error(translateBookingError(decision.error));
  }

  // Re-book over a previously CANCELLED booking if it exists, else create.
  await rawDb.booking.upsert({
    where: { classId_athleteId: { classId, athleteId: me.id } },
    update: { status: decision.status, bookedAt: new Date() },
    create: {
      tenantId,
      classId,
      athleteId: me.id,
      status: decision.status,
    },
  });

  revalidatePath("/atleta/reservar");
  revalidatePath("/admin/reservas");
  return decision;
}

export async function cancelBooking(bookingId: string) {
  const session = await requireSession();
  const tenantId = session.user.tenantId;
  const db = withTenant(tenantId);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      class: {
        select: {
          id: true,
          bookings: {
            orderBy: { bookedAt: "asc" },
            select: { id: true, status: true },
          },
        },
      },
    },
  });
  if (!booking) throw new Error("Reserva no encontrada");

  await rawDb.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  // Promote next waitlist if a real BOOKED slot was cancelled
  if (booking.status === "BOOKED") {
    const remaining = booking.class.bookings.filter((b) => b.id !== bookingId);
    const promoteId = nextWaitlistPromotion(remaining);
    if (promoteId) {
      await rawDb.booking.update({
        where: { id: promoteId },
        data: { status: "BOOKED" },
      });
    }
  }

  revalidatePath("/atleta/reservar");
  revalidatePath("/admin/reservas");
  return { ok: true };
}

export async function checkInAthlete(bookingId: string) {
  const session = await requireSession();
  const db = withTenant(session.user.tenantId);

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "ATTENDED", checkedInAt: new Date() },
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

  revalidatePath("/admin/reservas");
  return { ok: true };
}

function translateBookingError(code: string): string {
  switch (code) {
    case "CLASS_CANCELLED":
      return "Esta clase fue cancelada";
    case "CLASS_IN_PAST":
      return "Esta clase ya empezó";
    case "ALREADY_BOOKED":
      return "Ya tienes reserva en esta clase";
    default:
      return "No se pudo reservar";
  }
}
