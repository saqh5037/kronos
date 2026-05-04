/**
 * Pure booking-domain helpers — no DB, no session.
 * Used by both server actions and tests.
 */

export type BookingDecision =
  | { status: "BOOKED" }
  | { status: "WAITLIST"; position: number }
  | { error: "CLASS_CANCELLED" }
  | { error: "CLASS_IN_PAST" }
  | { error: "ALREADY_BOOKED" }
  | { error: "DUPLICATE" };

export type ClassSnapshot = {
  isActive: boolean;
  startsAt: Date;
  capacity: number;
};

export type BookingSnapshot = {
  athleteId: string;
  status: "BOOKED" | "WAITLIST" | "ATTENDED" | "NOSHOW" | "CANCELLED";
};

/**
 * Decide what should happen when an athlete tries to book a class.
 * Inputs are snapshots — caller is responsible for fetching them.
 */
export function decideBooking(
  klass: ClassSnapshot,
  existingBookings: BookingSnapshot[],
  athleteId: string,
  now: Date = new Date(),
): BookingDecision {
  if (!klass.isActive) return { error: "CLASS_CANCELLED" };
  if (klass.startsAt.getTime() <= now.getTime())
    return { error: "CLASS_IN_PAST" };

  const mine = existingBookings.find(
    (b) => b.athleteId === athleteId && b.status !== "CANCELLED",
  );
  if (mine) return { error: "ALREADY_BOOKED" };

  const activeBooked = existingBookings.filter(
    (b) => b.status === "BOOKED" || b.status === "ATTENDED",
  ).length;

  if (activeBooked < klass.capacity) {
    return { status: "BOOKED" };
  }

  const waitlistAhead = existingBookings.filter(
    (b) => b.status === "WAITLIST",
  ).length;

  return { status: "WAITLIST", position: waitlistAhead + 1 };
}

/**
 * Compute waitlist promotion: when a BOOKED slot frees up, the earliest
 * WAITLIST booking should be promoted. Caller passes bookings sorted by bookedAt asc.
 */
export function nextWaitlistPromotion(
  bookings: { id: string; status: BookingSnapshot["status"] }[],
): string | null {
  const next = bookings.find((b) => b.status === "WAITLIST");
  return next?.id ?? null;
}
