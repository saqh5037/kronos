import { describe, it, expect } from "vitest";
import {
  decideBooking,
  nextWaitlistPromotion,
  type ClassSnapshot,
  type BookingSnapshot,
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
