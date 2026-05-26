/**
 * BookingSection — streams the next class card (or suggestion or empty state).
 *
 * Uses both getAthleteHomeCached() and listAvailableClassesCached() so the
 * fetches dedup with WeekStripSection (same request, same React.cache key).
 *
 * getSuggestedNextClass() is kept with .catch(()=>null) per the original code —
 * a failure in the suggestion engine must not blank the entire section.
 */

import Link from "next/link";
import {
  getSuggestedNextClass,
  type SuggestedBooking,
} from "@/server/actions/athlete-home";
import {
  getAthleteHomeCached,
  listAvailableClassesCached,
} from "../request-cache";
import { SuggestedBookingCard } from "@/components/atleta/SuggestedBookingCard";
import CancelMyBookingButton from "@/components/kronos/CancelMyBookingButton";
import KCard from "@/components/kronos/KCard";
import RevealOnScroll from "@/components/kronos/RevealOnScroll";
import { formatDayMonth, formatTime } from "@/lib/week";

export async function BookingSection() {
  const [home, classes, suggestion] = await Promise.all([
    getAthleteHomeCached(),
    listAvailableClassesCached(),
    getSuggestedNextClass().catch((): SuggestedBooking => null),
  ]);

  if (!home) return null;

  const nextClassDetail = home.nextBooking
    ? classes.find((c) => c.id === home.nextBooking!.classId)
    : null;

  return (
    <RevealOnScroll
      data-tour="home.next-booking"
      variant="fade-up"
      className="mt-4 px-3.5"
    >
      {home.nextBooking ? (
        <KCard variant="featured">
          <div className="p-3.5 flex items-center gap-3.5">
            <div
              className="text-center px-2.5 py-1.5 rounded-xl min-w-[54px]"
              style={{ background: "var(--k-surface)" }}
            >
              <div
                className="font-mono text-[9px] tracking-[0.1em] font-bold"
                style={{ color: "var(--k-t3)" }}
              >
                {home.nextBooking.startsAt.toDateString() ===
                new Date().toDateString()
                  ? "HOY"
                  : formatDayMonth(home.nextBooking.startsAt).toUpperCase()}
              </div>
              <div
                className="font-display text-xl font-bold"
                style={{ color: "var(--k-t2)" }}
              >
                {formatTime(home.nextBooking.startsAt)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold mb-0.5">
                Tu próxima clase
              </div>
              <div
                className="text-[11px] flex gap-2 items-center flex-wrap"
                style={{ color: "var(--k-t2)" }}
              >
                {home.nextBooking.coachName && (
                  <span>Coach {home.nextBooking.coachName}</span>
                )}
                {nextClassDetail && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: "var(--k-t2)" }}>
                      ● {nextClassDetail.bookedCount}/{nextClassDetail.capacity}
                    </span>
                  </>
                )}
              </div>
            </div>
            <CancelMyBookingButton bookingId={home.nextBooking.bookingId} />
          </div>
        </KCard>
      ) : suggestion ? (
        <SuggestedBookingCard suggestion={suggestion} />
      ) : (
        <Link href="/atleta/reservar" className="block">
          <KCard variant="ghost">
            <p
              className="text-sm text-center py-3"
              style={{ color: "var(--k-t2)" }}
            >
              Sin reservas activas. Toca para reservar.
            </p>
          </KCard>
        </Link>
      )}
    </RevealOnScroll>
  );
}
