/**
 * Pure suggestion helper: picks the best class to recommend a 1-tap booking.
 *
 * Strategy:
 *   1) Filter to future classes with available capacity (or waitlist) the
 *      athlete is NOT already booked in.
 *   2) If the athlete has habitual slots (top hours from history), prefer
 *      a class whose start hour is within ±1h of the most habitual slot.
 *   3) Otherwise fallback to the next class with capacity within `fallbackHours`.
 *
 * Returns `null` when there's nothing to suggest.
 */

export type SuggestionClass = {
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
};

export type UsualSlot = { hour: number; count: number };

export type SuggestionReason = "habitual" | "fallback";

export type Suggestion = {
  klass: SuggestionClass;
  reason: SuggestionReason;
  willGoToWaitlist: boolean;
} | null;

export function pickSuggestedClass(input: {
  classes: SuggestionClass[];
  usualSlots: UsualSlot[];
  now: Date;
  fallbackHours?: number;
}): Suggestion {
  const fallbackHours = input.fallbackHours ?? 12;

  const futureCandidates = input.classes
    .filter((c) => c.startsAt.getTime() > input.now.getTime())
    .filter((c) => c.myBookingId == null)
    .filter((c) => c.kind === "WOD")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  if (futureCandidates.length === 0) return null;

  if (input.usualSlots.length > 0) {
    const ranked = [...input.usualSlots].sort((a, b) => b.count - a.count);
    for (const slot of ranked) {
      const match = futureCandidates.find((c) => {
        const dh = Math.abs(c.startsAt.getHours() - slot.hour);
        if (dh > 1) return false;
        return c.bookedCount < c.capacity;
      });
      if (match) {
        return {
          klass: match,
          reason: "habitual",
          willGoToWaitlist: false,
        };
      }
    }
  }

  const fallbackCutoff = new Date(
    input.now.getTime() + fallbackHours * 60 * 60 * 1000,
  );
  const withCapacity = futureCandidates.find(
    (c) => c.startsAt <= fallbackCutoff && c.bookedCount < c.capacity,
  );
  if (withCapacity) {
    return {
      klass: withCapacity,
      reason: "fallback",
      willGoToWaitlist: false,
    };
  }

  // No capacity in window — offer first future as waitlist if soon enough.
  const waitlistCandidate = futureCandidates.find(
    (c) => c.startsAt <= fallbackCutoff,
  );
  if (waitlistCandidate) {
    return {
      klass: waitlistCandidate,
      reason: "fallback",
      willGoToWaitlist: true,
    };
  }

  return null;
}
