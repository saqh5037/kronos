/**
 * WeekStripSection — streams the "reserved dot" data onto the week strip.
 *
 * The strip itself (labels + numbers) renders instantly as the Suspense
 * fallback (<WeekStrip bookedDayKeys={empty}/>); this async section resolves the
 * booked days and re-renders the strip WITH the dots. On failure it degrades to
 * an empty set — the strip stays fully navigable, just without dots.
 */

import { listWeekClassesCached } from "../request-cache";
import { WeekStrip, dayKey } from "../WeekStrip";

export async function WeekStripSection({
  selectedIso,
  todayIso,
}: {
  selectedIso: string;
  todayIso: string;
}) {
  let bookedDayKeys = new Set<string>();
  try {
    const classes = await listWeekClassesCached(todayIso);
    bookedDayKeys = new Set(
      classes
        .filter((c) => c.myBookingStatus === "BOOKED")
        .map((c) => dayKey(c.startsAt)),
    );
  } catch {
    // Strip still renders (without dots) — never block navigation on this.
  }

  return (
    <WeekStrip
      selectedIso={selectedIso}
      todayIso={todayIso}
      bookedDayKeys={bookedDayKeys}
    />
  );
}
