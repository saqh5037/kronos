/**
 * GreetingSection — streams the AI-generated personalized greeting.
 *
 * This is intentionally its own Suspense boundary because getDailyGreeting()
 * calls Gemini and is the SLOWEST fetch on the page (~300-800ms). Isolating it
 * means the rest of the page paints immediately while the greeting catches up.
 *
 * Boundary guard (audit 2026-09-15, P2 copy): the card once read "Emma, con tu
 * alta energía, es hora de que Helen sienta tu nuevo PR." Helen is a benchmark
 * WOD, not a person, so the sentence was meaningless. `buildGeminiPrompt` now
 * tells the model that in writing, and `sanitizeGreeting` refuses model output
 * that still personifies the WOD, falling back to the deterministic text.
 *
 * The guard runs here because `getDailyGreeting` (src/server/actions/ai.ts) is
 * outside this wave's ownership; the one-line fix there is noted in the report.
 */

import { getDailyGreeting } from "@/server/actions/ai";
import PersonalizedGreeting from "@/components/atleta/PersonalizedGreeting";
import { sanitizeGreeting } from "@/lib/ai/personalized-greeting";
import { getAthleteHomeCached } from "../request-cache";

export async function GreetingSection() {
  // Gemini/network can fail — degrade silently so the rest of the page is unaffected.
  try {
    const [greeting, home] = await Promise.all([
      getDailyGreeting(),
      getAthleteHomeCached(),
    ]);
    if (!greeting) return null;

    const safeText = sanitizeGreeting(greeting.text, {
      firstName: home?.athlete?.firstName ?? "",
      attendanceStreakDays: home?.streak ?? 0,
      weekAttendance: home?.weekAttendance ?? 0,
      weekGoal: home?.weekGoal ?? 5,
      lastPRDaysAgo: null,
      todayReadiness: null,
      nextClass: home?.nextBooking
        ? {
            startsAt: home.nextBooking.startsAt,
            wodName: home.nextBooking.wodName,
            coachName: home.nextBooking.coachName,
          }
        : null,
    });

    return (
      <PersonalizedGreeting greeting={{ ...greeting, text: safeText }} />
    );
  } catch {
    return null;
  }
}
