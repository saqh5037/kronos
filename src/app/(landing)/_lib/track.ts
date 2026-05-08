// Lightweight tracker for landing page events. Fire-and-forget; never throws.
// Server-side tracking lives in src/lib/analytics.ts. This file is the client mirror.

import posthog from "posthog-js";

type EventName =
  | "landing_hero_cta_clicked"
  | "landing_pricing_viewed"
  | "landing_pricing_tier_clicked"
  | "landing_demo_booked"
  | "landing_currency_switched";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: EventName, props?: EventProps): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(event, props);
  } catch {
    // never block UI on telemetry failures
  }
}
