"use client";

/**
 * TourAutoStart — intentionally NO-OP.
 *
 * Tours are now opt-in: the user launches them manually via the "?" TourTriggerButton
 * rendered on each screen. Auto-starting on every first-visit caused a poor UX
 * (tour firing over home immediately after onboarding, re-firing after dismissal
 * because persistence was unreliable).
 *
 * The component is kept as a named export so the import in template.tsx compiles
 * without changes. If auto-start needs to be re-enabled in the future, restore
 * the polling logic here — the persistence layer (markTourSeen / storageKey check)
 * is still intact in TourProvider and persistence.ts.
 */
export function TourAutoStart() {
  return null;
}
