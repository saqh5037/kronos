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
  | { error: "BOOKING_NOT_OPEN_YET"; opensAt: Date }
  | { error: "DUPLICATE" };

export type CancelDecision =
  | { ok: true }
  | { error: "ALREADY_CANCELLED" }
  | { error: "CLASS_IN_PAST" }
  | { error: "CANCEL_TOO_LATE"; deadline: Date };

export type ClassSnapshot = {
  isActive: boolean;
  startsAt: Date;
  capacity: number;
};

export type BookingSnapshot = {
  athleteId: string;
  status: "BOOKED" | "WAITLIST" | "ATTENDED" | "NOSHOW" | "CANCELLED";
};

export type BookingWindow = {
  /** Hours before class.startsAt at which booking opens. */
  openHoursAhead: number;
  /** Minutes before class.startsAt at which cancellation closes. */
  cancelCloseMinBefore: number;
};

export const DEFAULT_BOOKING_WINDOW: BookingWindow = {
  openHoursAhead: 24,
  cancelCloseMinBefore: 30,
};

/**
 * Decide what should happen when an athlete tries to book a class.
 * Inputs are snapshots — caller is responsible for fetching them.
 *
 * @param window — booking-window config from the Box (24h open / 30min close).
 *                 If omitted, the class is bookable any time before start.
 */
export function decideBooking(
  klass: ClassSnapshot,
  existingBookings: BookingSnapshot[],
  athleteId: string,
  now: Date = new Date(),
  window?: BookingWindow,
): BookingDecision {
  if (!klass.isActive) return { error: "CLASS_CANCELLED" };
  if (klass.startsAt.getTime() <= now.getTime())
    return { error: "CLASS_IN_PAST" };

  if (window && window.openHoursAhead > 0) {
    const opensAt = new Date(
      klass.startsAt.getTime() - window.openHoursAhead * 60 * 60 * 1000,
    );
    if (now.getTime() < opensAt.getTime()) {
      return { error: "BOOKING_NOT_OPEN_YET", opensAt };
    }
  }

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
 * Decide whether an athlete can cancel a booking right now.
 * Cancellations close `cancelCloseMinBefore` minutes before class start.
 */
export function decideCancel(
  klass: { startsAt: Date },
  booking: { status: BookingSnapshot["status"] },
  now: Date = new Date(),
  window: BookingWindow = DEFAULT_BOOKING_WINDOW,
): CancelDecision {
  if (booking.status === "CANCELLED") return { error: "ALREADY_CANCELLED" };
  if (klass.startsAt.getTime() <= now.getTime())
    return { error: "CLASS_IN_PAST" };

  const deadline = new Date(
    klass.startsAt.getTime() - window.cancelCloseMinBefore * 60 * 1000,
  );
  if (now.getTime() > deadline.getTime()) {
    return { error: "CANCEL_TOO_LATE", deadline };
  }
  return { ok: true };
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

/**
 * Compute the moment at which a class becomes bookable, given a window.
 */
export function bookingOpensAt(
  klass: { startsAt: Date },
  window: BookingWindow = DEFAULT_BOOKING_WINDOW,
): Date {
  return new Date(
    klass.startsAt.getTime() - window.openHoursAhead * 60 * 60 * 1000,
  );
}

/**
 * Compute the deadline by which a booking can still be cancelled.
 */
export function cancelDeadline(
  klass: { startsAt: Date },
  window: BookingWindow = DEFAULT_BOOKING_WINDOW,
): Date {
  return new Date(
    klass.startsAt.getTime() - window.cancelCloseMinBefore * 60 * 1000,
  );
}

/**
 * Decide whether a caller is authorized to cancel a specific booking.
 *
 * Role rules:
 *   - OWNER / COACH / STAFF → can cancel any booking in their tenant.
 *   - ATHLETE → may only cancel their own; callerAthleteId must match bookingAthleteId.
 *     If callerAthleteId is null (no athlete profile), authorization is denied.
 */
export function canCancelBooking({
  role,
  callerAthleteId,
  bookingAthleteId,
}: {
  role: string;
  callerAthleteId: string | null;
  bookingAthleteId: string;
}): boolean {
  if (role === "OWNER" || role === "COACH" || role === "STAFF") return true;
  if (role === "ATHLETE") {
    return callerAthleteId !== null && callerAthleteId === bookingAthleteId;
  }
  return false;
}
