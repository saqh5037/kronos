import { describe, it, expect } from "vitest";
import {
  pickSuggestedClass,
  type SuggestionClass,
} from "@/lib/booking-suggestion";

// Use local-time Date constructor so getHours() is deterministic across TZs.
const localDate = (h: number, m = 0) => new Date(2026, 4, 8, h, m);
const NOW = localDate(5);

const klass = (over: Partial<SuggestionClass>): SuggestionClass => ({
  id: "c1",
  startsAt: localDate(7),
  durationMin: 60,
  capacity: 10,
  kind: "WOD",
  bookedCount: 0,
  waitlistCount: 0,
  coach: { name: "Coach" },
  wod: { name: "Cindy", type: "AMRAP" },
  myBookingId: null,
  ...over,
});

describe("pickSuggestedClass · habitual match", () => {
  it("prefers class within ±1h of habitual slot", () => {
    const c7 = klass({
      id: "c7",
      startsAt: localDate(7),
      bookedCount: 10,
    });
    const c8 = klass({
      id: "c8",
      startsAt: localDate(8),
      bookedCount: 4,
    });
    const result = pickSuggestedClass({
      classes: [c7, c8],
      usualSlots: [{ hour: 7, count: 12 }],
      now: NOW,
    });
    expect(result?.klass.id).toBe("c8");
    expect(result?.reason).toBe("habitual");
  });

  it("skips habitual when no class within ±1h has capacity", () => {
    const c7 = klass({
      id: "c7",
      startsAt: localDate(7),
      bookedCount: 10,
    });
    const c12 = klass({
      id: "c12",
      startsAt: localDate(12),
      bookedCount: 1,
    });
    const result = pickSuggestedClass({
      classes: [c7, c12],
      usualSlots: [{ hour: 7, count: 5 }],
      now: NOW,
    });
    expect(result?.reason).toBe("fallback");
    expect(result?.klass.id).toBe("c12");
  });
});

describe("pickSuggestedClass · fallback", () => {
  it("returns next class with capacity in fallback window", () => {
    const c10 = klass({
      id: "c10",
      startsAt: localDate(10),
      bookedCount: 5,
    });
    const result = pickSuggestedClass({
      classes: [c10],
      usualSlots: [],
      now: NOW,
    });
    expect(result?.klass.id).toBe("c10");
    expect(result?.reason).toBe("fallback");
    expect(result?.willGoToWaitlist).toBe(false);
  });

  it("offers waitlist when no class has capacity in window", () => {
    const c10full = klass({
      id: "c10",
      startsAt: localDate(10),
      bookedCount: 10,
    });
    const result = pickSuggestedClass({
      classes: [c10full],
      usualSlots: [],
      now: NOW,
    });
    expect(result?.klass.id).toBe("c10");
    expect(result?.willGoToWaitlist).toBe(true);
  });

  it("returns null when there are no future candidates", () => {
    const past = klass({
      id: "past",
      startsAt: localDate(3),
      bookedCount: 0,
    });
    const result = pickSuggestedClass({
      classes: [past],
      usualSlots: [],
      now: NOW,
    });
    expect(result).toBeNull();
  });
});

describe("pickSuggestedClass · already-booked filtering", () => {
  it("skips classes the athlete already has a booking in", () => {
    const mine = klass({
      id: "mine",
      startsAt: localDate(7),
      myBookingId: "b1",
      bookedCount: 5,
    });
    const next = klass({
      id: "next",
      startsAt: localDate(10),
      bookedCount: 3,
    });
    const result = pickSuggestedClass({
      classes: [mine, next],
      usualSlots: [],
      now: NOW,
    });
    expect(result?.klass.id).toBe("next");
  });
});

describe("pickSuggestedClass · OPEN_BOX is excluded", () => {
  it("only considers WOD classes", () => {
    const open = klass({
      id: "open",
      kind: "OPEN_BOX",
      startsAt: localDate(7),
    });
    const wod = klass({
      id: "wod",
      startsAt: localDate(8),
      bookedCount: 2,
    });
    const result = pickSuggestedClass({
      classes: [open, wod],
      usualSlots: [],
      now: NOW,
    });
    expect(result?.klass.id).toBe("wod");
  });
});
