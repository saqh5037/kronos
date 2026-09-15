import { describe, it, expect } from "vitest";
import {
  buildFallbackText,
  buildGeminiPrompt,
  buildPromptInputs,
  computeGreeting,
  computeGreetingTone,
  isSafeGreeting,
  sanitizeGreeting,
  type GreetingContext,
} from "@/lib/ai/personalized-greeting";

function ctx(partial: Partial<GreetingContext> = {}): GreetingContext {
  return {
    firstName: "Emma",
    attendanceStreakDays: 7,
    weekAttendance: 2,
    weekGoal: 5,
    lastPRDaysAgo: null,
    todayReadiness: null,
    nextClass: null,
    ...partial,
  };
}

describe("greeting tone", () => {
  it("keeps the documented precedence", () => {
    expect(computeGreetingTone(ctx({ todayReadiness: "low" }))).toBe("recover");
    expect(
      computeGreetingTone(ctx({ attendanceStreakDays: 0, weekAttendance: 0 })),
    ).toBe("comeback");
    expect(computeGreetingTone(ctx({ lastPRDaysAgo: 1 }))).toBe("celebrate");
    expect(
      computeGreetingTone(
        ctx({ todayReadiness: "high", attendanceStreakDays: 3 }),
      ),
    ).toBe("push");
    expect(computeGreetingTone(ctx())).toBe("maintain");
  });
});

describe("WOD names are never treated as people", () => {
  // Audit 2026-09-15: the home card read "Emma, con tu alta energía, es hora de
  // que Helen sienta tu nuevo PR." Helen is a WOD (a benchmark workout named
  // after a person), so the model personified it and the sentence lost meaning.
  const withWod = ctx({
    todayReadiness: "high",
    attendanceStreakDays: 3,
    nextClass: {
      startsAt: new Date(Date.now() + 2 * 3600_000),
      wodName: "Helen",
      coachName: "Lobo Ramírez",
    },
  });

  it("labels the WOD as a WOD in the prompt inputs", () => {
    const inputs = buildPromptInputs(withWod);
    expect(inputs.nextClassWod).toBe("Helen");
    expect(inputs.nextClassWodIsBenchmarkName).toBe(true);
  });

  it("tells the model in writing that the WOD name is not a person", () => {
    const prompt = buildGeminiPrompt(withWod);
    expect(prompt).toMatch(/nombre de un WOD/i);
    expect(prompt).toMatch(/no es una persona/i);
  });

  it("rejects a greeting that turns the WOD into a subject", () => {
    expect(
      isSafeGreeting(
        "Emma, con tu alta energía, es hora de que Helen sienta tu nuevo PR.",
        withWod,
      ),
    ).toBe(false);
    expect(
      isSafeGreeting("Emma, Helen te va a pedir todo hoy.", withWod),
    ).toBe(false);
    expect(
      isSafeGreeting("Emma, Murph quiere conocerte.", {
        ...withWod,
        nextClass: { ...withWod.nextClass!, wodName: "Murph" },
      }),
    ).toBe(false);
  });

  it("accepts a greeting that uses the WOD as a workout", () => {
    expect(
      isSafeGreeting("Emma, 3 días seguidos: entra a Helen con todo.", withWod),
    ).toBe(true);
    expect(
      isSafeGreeting("Emma, vas 2/5 esta semana. Helen a las 06:00.", withWod),
    ).toBe(true);
  });

  it("falls back to the deterministic text when the model personifies the WOD", () => {
    const bad = "Emma, es hora de que Helen sienta tu nuevo PR.";
    expect(sanitizeGreeting(bad, withWod)).toBe(buildFallbackText(withWod));
    const good = "Emma, 3 días seguidos: entra a Helen con todo.";
    expect(sanitizeGreeting(good, withWod)).toBe(good);
  });

  it("is a no-op when there is no WOD name to confuse", () => {
    const plain = ctx();
    const text = "Emma, vas 2/5 esta semana. Mantén el ritmo.";
    expect(isSafeGreeting(text, plain)).toBe(true);
    expect(sanitizeGreeting(text, plain)).toBe(text);
  });

  it("rejects empty or truncated model output", () => {
    expect(isSafeGreeting("", ctx())).toBe(false);
    expect(isSafeGreeting("   ", ctx())).toBe(false);
    expect(sanitizeGreeting("", ctx())).toBe(buildFallbackText(ctx()));
  });
});

describe("fallback text", () => {
  it("is Spanish, tú, and free of voseo", () => {
    const samples = [
      buildFallbackText(ctx()),
      buildFallbackText(ctx({ todayReadiness: "low" })),
      buildFallbackText(ctx({ attendanceStreakDays: 0, weekAttendance: 0 })),
      buildFallbackText(ctx({ lastPRDaysAgo: 0 })),
      buildFallbackText(
        ctx({ todayReadiness: "high", attendanceStreakDays: 4 }),
      ),
      buildFallbackText(ctx({ lastPRDaysAgo: 40 })),
    ];
    for (const s of samples) {
      expect(s.length).toBeGreaterThan(8);
      expect(s).not.toMatch(
        /\b(dale|acordate|tenés|querés|podés|sabés|mirá|fijate|vos)\b/i,
      );
    }
  });

  it("never names the WOD as the actor", () => {
    const text = buildFallbackText(
      ctx({
        nextClass: {
          startsAt: new Date(),
          wodName: "Helen",
          coachName: null,
        },
      }),
    );
    expect(isSafeGreeting(text, ctx())).toBe(true);
  });
});

describe("computeGreeting", () => {
  it("bundles tone, fallback and prompt inputs", () => {
    const result = computeGreeting(ctx({ lastPRDaysAgo: 2 }));
    expect(result.tone).toBe("celebrate");
    expect(result.fallbackText).toContain("Emma");
    expect(result.promptInputs.firstName).toBe("Emma");
  });
});
