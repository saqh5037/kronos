/**
 * Analytics wrapper — server-side event tracking via PostHog Capture API.
 * No-op when NEXT_PUBLIC_POSTHOG_KEY is not configured (local dev / tests).
 *
 * Why fetch instead of posthog-node:
 * - One less dep, no batching state to manage in serverless
 * - Server actions are short-lived, fire-and-forget is fine here
 * - PostHog ingest endpoint is stable: POST /capture/
 *
 * For client-side events (e.g. modal opened, button clicked), use posthog-js
 * directly in a "use client" component — out of scope for the server wrapper.
 */

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "";
const PH_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

export type EventName =
  | "booking_created"
  | "booking_cancelled"
  | "booking_checkin"
  | "score_submitted"
  | "pr_achieved"
  | "payment_registered"
  | "membership_assigned"
  | "class_cancelled";

type EventProperties = Record<string, string | number | boolean | null>;

/**
 * Track a server-side event. Tenant ID becomes the distinct_id so analytics
 * can roll up per box. The actorId (user) is included as a property.
 *
 * Fire-and-forget: never throws, never blocks. PostHog timeouts after 2s.
 */
export async function trackEvent(
  name: EventName,
  context: {
    tenantId: string;
    actorId?: string | null;
  } & EventProperties,
): Promise<void> {
  if (!PH_KEY) return;

  const { tenantId, actorId, ...rest } = context;
  const properties = {
    ...rest,
    tenantId,
    actorId: actorId ?? null,
    $process_person_profile: false, // box-level, not person-level
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    await fetch(`${PH_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: PH_KEY,
        event: name,
        distinct_id: tenantId,
        properties,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    // Analytics failures must never break the main operation.
    if (process.env.NODE_ENV !== "production") {
      console.warn("[analytics] track failed:", (err as Error).message);
    }
  }
}
