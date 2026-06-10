import { describe, it, expect } from "vitest";
import { canCancelBooking } from "../../src/lib/booking";

describe("canCancelBooking — ownership guard", () => {
  // ATHLETE can cancel their own booking
  it("allows ATHLETE to cancel their own booking", () => {
    expect(
      canCancelBooking({
        role: "ATHLETE",
        callerAthleteId: "athlete-1",
        bookingAthleteId: "athlete-1",
      }),
    ).toBe(true);
  });

  // ATHLETE cannot cancel another athlete's booking
  it("denies ATHLETE cancelling another athlete booking", () => {
    expect(
      canCancelBooking({
        role: "ATHLETE",
        callerAthleteId: "athlete-1",
        bookingAthleteId: "athlete-2",
      }),
    ).toBe(false);
  });

  // ATHLETE with null callerAthleteId is denied
  it("denies ATHLETE with null callerAthleteId", () => {
    expect(
      canCancelBooking({
        role: "ATHLETE",
        callerAthleteId: null,
        bookingAthleteId: "athlete-2",
      }),
    ).toBe(false);
  });

  // OWNER can cancel any booking in their tenant
  it("allows OWNER to cancel any booking", () => {
    expect(
      canCancelBooking({
        role: "OWNER",
        callerAthleteId: null,
        bookingAthleteId: "athlete-1",
      }),
    ).toBe(true);
  });

  // COACH can cancel any booking in their tenant
  it("allows COACH to cancel any booking", () => {
    expect(
      canCancelBooking({
        role: "COACH",
        callerAthleteId: null,
        bookingAthleteId: "athlete-1",
      }),
    ).toBe(true);
  });

  // STAFF can cancel any booking in their tenant
  it("allows STAFF to cancel any booking", () => {
    expect(
      canCancelBooking({
        role: "STAFF",
        callerAthleteId: null,
        bookingAthleteId: "athlete-1",
      }),
    ).toBe(true);
  });

  // OWNER can also cancel their own booking (they may have an athlete profile)
  it("allows OWNER to cancel their own booking", () => {
    expect(
      canCancelBooking({
        role: "OWNER",
        callerAthleteId: "athlete-owner",
        bookingAthleteId: "athlete-owner",
      }),
    ).toBe(true);
  });
});
