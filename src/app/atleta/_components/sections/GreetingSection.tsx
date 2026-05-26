/**
 * GreetingSection — streams the AI-generated personalized greeting.
 *
 * This is intentionally its own Suspense boundary because getDailyGreeting()
 * calls Gemini and is the SLOWEST fetch on the page (~300-800ms). Isolating it
 * means the rest of the page paints immediately while the greeting catches up.
 */

import { getDailyGreeting } from "@/server/actions/ai";
import PersonalizedGreeting from "@/components/atleta/PersonalizedGreeting";

export async function GreetingSection() {
  // Gemini/network can fail — degrade silently so the rest of the page is unaffected.
  try {
    const greeting = await getDailyGreeting();
    return <PersonalizedGreeting greeting={greeting} />;
  } catch {
    return null;
  }
}
