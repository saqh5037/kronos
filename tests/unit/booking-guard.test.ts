import { describe, it, expect } from "vitest";
import {
  decideBooking,
  decideCancel,
  nextWaitlistPromotion,
  bookingOpensAt,
  cancelDeadline,
  type ClassSnapshot,
  type BookingSnapshot,
  type BookingWindow,
} from "../../src/lib/booking";

const future = new Date(Date.now() + 1000 * 60 * 60 * 24); // tomorrow
const past = new Date(Date.now() - 1000 * 60 * 60); // 1h ago

const classOpen: ClassSnapshot = {
  isActive: true,
  startsAt: future,
  capacity: 3,
};

describe("decideBooking", () => {
  it("books when capacity available", () => {
    const result = decideBooking(classOpen, [], "athlete-1");
    expect(result).toEqual({ status: "BOOKED" });
  });

  it("waitlists when at capacity", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "a", status: "BOOKED" },
      { athleteId: "b", status: "BOOKED" },
      { athleteId: "c", status: "BOOKED" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "WAITLIST", position: 1 });
  });

  it("returns waitlist position 2 when one already on waitlist", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "a", status: "BOOKED" },
      { athleteId: "b", status: "BOOKED" },
      { athleteId: "c", status: "BOOKED" },
      { athleteId: "d", status: "WAITLIST" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "WAITLIST", position: 2 });
  });

  it("blocks when class is cancelled (isActive false)", () => {
    const result = decideBooking(
      { ...classOpen, isActive: false },
      [],
      "athlete-1",
    );
    expect(result).toEqual({ error: "CLASS_CANCELLED" });
  });

  it("blocks when class is in the past", () => {
    const result = decideBooking(
      { ...classOpen, startsAt: past },
      [],
      "athlete-1",
    );
    expect(result).toEqual({ error: "CLASS_IN_PAST" });
  });

  it("blocks when athlete already booked (active)", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "athlete-1", status: "BOOKED" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ error: "ALREADY_BOOKED" });
  });

  it("ignores cancelled bookings of same athlete (re-book ok)", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "athlete-1", status: "CANCELLED" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "BOOKED" });
  });

  it("counts ATTENDED toward capacity", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "a", status: "ATTENDED" },
      { athleteId: "b", status: "ATTENDED" },
      { athleteId: "c", status: "ATTENDED" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "WAITLIST", position: 1 });
  });

  it("does NOT count CANCELLED toward capacity", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "a", status: "CANCELLED" },
      { athleteId: "b", status: "CANCELLED" },
      { athleteId: "c", status: "CANCELLED" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "BOOKED" });
  });

  it("does NOT count NOSHOW toward future capacity", () => {
    const bookings: BookingSnapshot[] = [
      { athleteId: "a", status: "NOSHOW" },
      { athleteId: "b", status: "NOSHOW" },
      { athleteId: "c", status: "NOSHOW" },
    ];
    const result = decideBooking(classOpen, bookings, "athlete-1");
    expect(result).toEqual({ status: "BOOKED" });
  });
});

describe("decideBooking — 24h opening window", () => {
  const window: BookingWindow = {
    openHoursAhead: 24,
    cancelCloseMinBefore: 30,
  };

  it("blocks booking when class is more than 24h away", () => {
    const now = new Date("2026-05-06T10:00:00Z");
    const startsAt = new Date("2026-05-08T10:00:00Z"); // 48h ahead
    const result = decideBooking(
      { isActive: true, startsAt, capacity: 10 },
      [],
      "athlete-1",
      now,
      window,
    );
    expect(result).toMatchObject({ error: "BOOKING_NOT_OPEN_YET" });
    if ("opensAt" in result) {
      expect(result.opensAt.toISOString()).toBe("2026-05-07T10:00:00.000Z");
    }
  });

  it("allows booking exactly at the 24h opening boundary", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-06T10:00:00Z"); // exactly 24h ahead
    const result = decideBooking(
      { isActive: true, startsAt, capacity: 10 },
      [],
      "athlete-1",
      now,
      window,
    );
    expect(result).toEqual({ status: "BOOKED" });
  });

  it("allows booking 1 hour before class start", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T09:00:00Z"); // 1h before
    const result = decideBooking(
      { isActive: true, startsAt, capacity: 10 },
      [],
      "athlete-1",
      now,
      window,
    );
    expect(result).toEqual({ status: "BOOKED" });
  });

  it("ignores window if openHoursAhead=0 (back-compat)", () => {
    const startsAt = new Date("2026-05-08T10:00:00Z");
    const now = new Date("2026-05-06T10:00:00Z");
    const result = decideBooking(
      { isActive: true, startsAt, capacity: 10 },
      [],
      "athlete-1",
      now,
      { openHoursAhead: 0, cancelCloseMinBefore: 30 },
    );
    expect(result).toEqual({ status: "BOOKED" });
  });
});

describe("decideCancel — 30min closing window", () => {
  const window: BookingWindow = {
    openHoursAhead: 24,
    cancelCloseMinBefore: 30,
  };

  it("allows cancel when more than 30min before class", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T09:00:00Z"); // 60min before
    expect(
      decideCancel({ startsAt }, { status: "BOOKED" }, now, window),
    ).toEqual({ ok: true });
  });

  it("blocks cancel within last 30min", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T09:45:00Z"); // 15min before
    const result = decideCancel(
      { startsAt },
      { status: "BOOKED" },
      now,
      window,
    );
    expect(result).toMatchObject({ error: "CANCEL_TOO_LATE" });
    if ("deadline" in result) {
      expect(result.deadline.toISOString()).toBe("2026-05-07T09:30:00.000Z");
    }
  });

  it("allows cancel exactly at the 30min boundary", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T09:30:00Z"); // exactly 30min before
    expect(
      decideCancel({ startsAt }, { status: "BOOKED" }, now, window),
    ).toEqual({ ok: true });
  });

  it("blocks cancel when class is in past", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T11:00:00Z");
    expect(
      decideCancel({ startsAt }, { status: "BOOKED" }, now, window),
    ).toEqual({ error: "CLASS_IN_PAST" });
  });

  it("returns ALREADY_CANCELLED for cancelled booking", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    const now = new Date("2026-05-07T09:00:00Z");
    expect(
      decideCancel({ startsAt }, { status: "CANCELLED" }, now, window),
    ).toEqual({ error: "ALREADY_CANCELLED" });
  });
});

describe("bookingOpensAt / cancelDeadline", () => {
  it("computes opening moment 24h before class", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    expect(bookingOpensAt({ startsAt }).toISOString()).toBe(
      "2026-05-06T10:00:00.000Z",
    );
  });

  it("computes cancel deadline 30min before class", () => {
    const startsAt = new Date("2026-05-07T10:00:00Z");
    expect(cancelDeadline({ startsAt }).toISOString()).toBe(
      "2026-05-07T09:30:00.000Z",
    );
  });
});

describe("nextWaitlistPromotion", () => {
  it("returns null when no waitlist", () => {
    expect(
      nextWaitlistPromotion([
        { id: "1", status: "BOOKED" },
        { id: "2", status: "ATTENDED" },
      ]),
    ).toBeNull();
  });

  it("returns first waitlist booking id", () => {
    expect(
      nextWaitlistPromotion([
        { id: "1", status: "BOOKED" },
        { id: "2", status: "WAITLIST" },
        { id: "3", status: "WAITLIST" },
      ]),
    ).toBe("2");
  });

  it("skips cancelled before reaching waitlist", () => {
    expect(
      nextWaitlistPromotion([
        { id: "1", status: "CANCELLED" },
        { id: "2", status: "WAITLIST" },
      ]),
    ).toBe("2");
  });
});
