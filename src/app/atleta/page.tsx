import { Suspense } from "react";
import { HeroSection } from "./_components/sections/HeroSection";
import { GreetingSection } from "./_components/sections/GreetingSection";
import { SurveySection } from "./_components/sections/SurveySection";
import { BookingSection } from "./_components/sections/BookingSection";
import { WeekStripSection } from "./_components/sections/WeekStripSection";
import { LeaderboardSection } from "./_components/sections/LeaderboardSection";
import { RecentActivitySection } from "./_components/sections/RecentActivitySection";
import { CompleteProfileBannerSection } from "./_components/sections/CompleteProfileBannerSection";
import {
  HeroSkeleton,
  GreetingSkeleton,
  SurveySkeleton,
  BookingSkeleton,
  WeekStripSkeleton,
  LeaderboardSkeleton,
  RecentActivitySkeleton,
} from "./_components/skeletons";

export const metadata = { title: "Kronos — Inicio" };

/**
 * Athlete home page — streaming version.
 *
 * Each data-dependent block is its own Suspense boundary. The shell paints
 * immediately on navigation while sections stream in as their fetches resolve.
 *
 * Shared fetches (getAthleteHome, listAvailableClasses, getTodayWODWithScores)
 * are deduplicated via React.cache() in _components/request-cache.ts — multiple
 * Suspense sections that need the same data share one DB round-trip per request.
 *
 * Empty-state (no athlete profile) is handled inside HeroSection. When home is
 * null, all other sections also return null via the cached fetch — no cascading
 * errors, just a clean "Sin perfil" card.
 */
export default function AtletaHomePage() {
  return (
    <div className="pb-28 relative">
      {/* COMPLETE PROFILE BANNER — only shown when onboarding was skipped */}
      <Suspense fallback={null}>
        <CompleteProfileBannerSection />
      </Suspense>

      {/* HERO + STATS + TROPHIES — largest block, paints as soon as it resolves */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* GREETING — isolated because Gemini can be slow (300-800ms) */}
      <Suspense fallback={<GreetingSkeleton />}>
        <GreetingSection />
      </Suspense>

      {/* READINESS SURVEY — optional, empty skeleton so layout doesn't shift */}
      <Suspense fallback={<SurveySkeleton />}>
        <SurveySection />
      </Suspense>

      {/* NEXT BOOKING / SUGGESTION — core action card */}
      <Suspense fallback={<BookingSkeleton />}>
        <BookingSection />
      </Suspense>

      {/* WEEK STRIP — shares class list fetch with BookingSection (deduped) */}
      <Suspense fallback={<WeekStripSkeleton />}>
        <WeekStripSection />
      </Suspense>

      {/* LEADERBOARD — only if there's a WOD today with scores */}
      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardSection />
      </Suspense>

      {/* LAST SCORE + LATEST PR — bottom of page, low urgency */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivitySection />
      </Suspense>
    </div>
  );
}
