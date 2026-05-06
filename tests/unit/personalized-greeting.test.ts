import { describe, expect, it } from "vitest";
import {
  buildFallbackText,
  buildGeminiPrompt,
  buildPromptInputs,
  computeGreeting,
  computeGreetingTone,
  type GreetingContext,
} from "@/lib/ai/personalized-greeting";

function ctx(over: Partial<GreetingContext> = {}): GreetingContext {
  return {
    firstName: "Sam",
    attendanceStreakDays: 0,
    weekAttendance: 0,
    weekGoal: 5,
    lastPRDaysAgo: null,
    todayReadiness: null,
    nextClass: null,
    ...over,
  };
}

describe("computeGreetingTone", () => {
  it("returns 'recover' when readiness today is low", () => {
    expect(
      computeGreetingTone(
        ctx({ todayReadiness: "low", attendanceStreakDays: 5 }),
      ),
    ).toBe("recover");
  });

  it("returns 'comeback' when athlete has not attended this week and no streak", () => {
    expect(computeGreetingTone(ctx())).toBe("comeback");
  });

  it("returns 'celebrate' when last PR was within 3 days", () => {
    expect(
      computeGreetingTone(
        ctx({ lastPRDaysAgo: 1, attendanceStreakDays: 3, weekAttendance: 2 }),
      ),
    ).toBe("celebrate");
  });

  it("returns 'push' when readiness is high and there is streak", () => {
    expect(
      computeGreetingTone(
        ctx({
          todayReadiness: "high",
          attendanceStreakDays: 4,
          weekAttendance: 3,
        }),
      ),
    ).toBe("push");
  });

  it("falls back to 'maintain' for typical mid-week training week", () => {
    expect(
      computeGreetingTone(
        ctx({ weekAttendance: 2, attendanceStreakDays: 1, lastPRDaysAgo: 10 }),
      ),
    ).toBe("maintain");
  });

  it("celebrate outranks push when both could apply", () => {
    expect(
      computeGreetingTone(
        ctx({
          lastPRDaysAgo: 0,
          todayReadiness: "high",
          attendanceStreakDays: 3,
          weekAttendance: 2,
        }),
      ),
    ).toBe("celebrate");
  });
});

describe("buildFallbackText", () => {
  it("celebrates with 'hoy hiciste PR' when same day", () => {
    const text = buildFallbackText(
      ctx({ lastPRDaysAgo: 0, attendanceStreakDays: 2, weekAttendance: 2 }),
    );
    expect(text).toContain("hoy hiciste PR");
    expect(text).toContain("Sam");
  });

  it("uses 'PR hace 1 día' singular grammar", () => {
    const text = buildFallbackText(
      ctx({ lastPRDaysAgo: 1, attendanceStreakDays: 2, weekAttendance: 2 }),
    );
    expect(text).toContain("PR hace 1 día");
  });

  it("comeback message when no recent activity", () => {
    const text = buildFallbackText(ctx());
    expect(text.toLowerCase()).toContain("extrañamos");
  });

  it("push message references the streak count", () => {
    const text = buildFallbackText(
      ctx({
        todayReadiness: "high",
        attendanceStreakDays: 4,
        weekAttendance: 3,
      }),
    );
    expect(text).toContain("4 días");
  });

  it("maintain breaks plateau message references days without PR", () => {
    const text = buildFallbackText(
      ctx({ weekAttendance: 2, attendanceStreakDays: 1, lastPRDaysAgo: 30 }),
    );
    expect(text).toContain("30 días");
  });

  it("never returns empty string", () => {
    expect(buildFallbackText(ctx()).length).toBeGreaterThan(8);
  });
});

describe("buildPromptInputs", () => {
  it("includes plateau flag derived from lastPRDaysAgo", () => {
    expect(buildPromptInputs(ctx({ lastPRDaysAgo: 30 })).plateau).toBe(true);
    expect(buildPromptInputs(ctx({ lastPRDaysAgo: 5 })).plateau).toBe(false);
    expect(buildPromptInputs(ctx({ lastPRDaysAgo: null })).plateau).toBe(false);
  });

  it("formats next class relative time", () => {
    const inOneHour = new Date(Date.now() + 60 * 60 * 1000);
    const result = buildPromptInputs(
      ctx({
        nextClass: { startsAt: inOneHour, wodName: "Cindy", coachName: "Lara" },
      }),
    );
    expect(result.nextClassWhen).toMatch(/h$/);
    expect(result.nextClassWod).toBe("Cindy");
  });

  it("returns null fields when no next class", () => {
    const result = buildPromptInputs(ctx());
    expect(result.nextClassWod).toBeNull();
    expect(result.nextClassWhen).toBeNull();
  });
});

describe("buildGeminiPrompt", () => {
  it("includes the tone and the inputs JSON", () => {
    const prompt = buildGeminiPrompt(
      ctx({
        todayReadiness: "high",
        attendanceStreakDays: 3,
        weekAttendance: 2,
      }),
    );
    expect(prompt).toContain("Tono sugerido: push");
    expect(prompt).toContain("Sam");
    expect(prompt).toContain('"weekProgress": "2/5"');
  });

  it("instructs Gemini to skip emojis and double exclamations", () => {
    const prompt = buildGeminiPrompt(ctx());
    expect(prompt).toContain("No uses emojis");
  });
});

describe("computeGreeting", () => {
  it("returns tone, fallbackText and promptInputs together", () => {
    const out = computeGreeting(
      ctx({
        todayReadiness: "high",
        attendanceStreakDays: 3,
        weekAttendance: 2,
      }),
    );
    expect(out.tone).toBe("push");
    expect(out.fallbackText).toContain("Sam");
    expect(out.promptInputs.streakDays).toBe(3);
  });
});
