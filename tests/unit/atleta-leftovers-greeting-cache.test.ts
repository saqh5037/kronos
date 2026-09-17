/**
 * The contract `getDailyGreeting` relies on to decide `source`.
 *
 * `src/server/actions/ai.ts` caches the greeting for 12h, so the
 * WOD-personifying guard has to run BEFORE the value is stored — a check at
 * render time cannot undo a bad string that is already in the cache (audit
 * 2026-09-15: the home card read "es hora de que Helen sienta tu nuevo PR", and
 * Helen is a benchmark workout, not a person). The action now does:
 *
 *     const safe = sanitizeGreeting(cleaned, ctx);
 *     if (safe !== cleaned) return fallback;   // honest `source: "fallback"`
 *
 * That identity check is only correct while `sanitizeGreeting` returns safe
 * input UNCHANGED (its `.trim()` must be a no-op on text `sanitizeGeminiText`
 * already trimmed) and returns something DIFFERENT for unsafe input. If either
 * half stopped holding, the athlete would silently get the deterministic
 * fallback for every greeting, with no failing test anywhere.
 *
 * `tests/unit/atleta-core-greeting.test.ts` covers the guard itself; this pins
 * the identity the caching path depends on.
 */
import { describe, it, expect } from "vitest";
import {
  buildFallbackText,
  isSafeGreeting,
  sanitizeGreeting,
  type GreetingContext,
} from "@/lib/ai/personalized-greeting";

function ctx(partial: Partial<GreetingContext> = {}): GreetingContext {
  return {
    firstName: "Emma",
    attendanceStreakDays: 3,
    weekAttendance: 2,
    weekGoal: 5,
    lastPRDaysAgo: null,
    todayReadiness: "high",
    nextClass: {
      startsAt: new Date("2026-09-15T13:00:00Z"),
      wodName: "Helen",
      coachName: "Lobo Ramírez",
    },
    ...partial,
  };
}

describe("greeting cache guard", () => {
  it("returns already-trimmed safe text byte-for-byte", () => {
    const c = ctx();
    for (const text of [
      "Emma, 3 días seguidos: entra a Helen con todo.",
      "Emma, vas 2/5 esta semana. Helen a las 06:00.",
      "Emma, hoy toca Helen. Calienta bien los hombros.",
    ]) {
      expect(isSafeGreeting(text, c), text).toBe(true);
      // The identity `ai.ts` tests against.
      expect(sanitizeGreeting(text, c), text).toBe(text);
    }
  });

  it("returns something different for unsafe text, so the action can see it", () => {
    const c = ctx();
    for (const text of [
      "Emma, es hora de que Helen sienta tu nuevo PR.",
      "Emma, Helen te va a pedir todo hoy.",
      "",
    ]) {
      expect(isSafeGreeting(text, c), text).toBe(false);
      expect(sanitizeGreeting(text, c), text).not.toBe(text);
      expect(sanitizeGreeting(text, c), text).toBe(buildFallbackText(c));
    }
  });

  it("never hands back text that still personifies the WOD", () => {
    const c = ctx();
    const safe = sanitizeGreeting(
      "Emma, es hora de que Helen sienta tu nuevo PR.",
      c,
    );
    expect(isSafeGreeting(safe, c)).toBe(true);
  });

  it("holds when there is no next class to name a WOD", () => {
    const c = ctx({ nextClass: null });
    const text = "Emma, vas 2/5 esta semana. Mantén el ritmo.";
    expect(sanitizeGreeting(text, c)).toBe(text);
  });
});
