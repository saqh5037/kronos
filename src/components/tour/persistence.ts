/**
 * Tour dismissal persistence — pure, framework-agnostic.
 *
 * Historical bug: the tour was only marked "seen" when it completed naturally.
 * Skipping it (X button, backdrop click, Escape, or auto-skip on a missing
 * anchor) did NOT persist, so `TourAutoStart` re-triggered the same tour on
 * every navigation. From the user's point of view, dismissing == "don't show
 * this again", regardless of how it ended — so `endTour` now persists for ANY
 * end reason via this helper.
 */

/**
 * Persist that a tour has been seen. Best-effort: storage may be unavailable
 * (private mode, quota) — failures are swallowed so the UI never breaks.
 */
export function markTourSeen(
  storageKey: string,
  storage: Pick<Storage, "setItem"> | undefined = typeof window !== "undefined"
    ? window.localStorage
    : undefined,
  now: Date = new Date(),
): void {
  if (!storage) return;
  try {
    storage.setItem(storageKey, now.toISOString());
  } catch {
    // localStorage blocked — silently ignore.
  }
}
