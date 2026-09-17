import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import PersonalHomeView from "@/components/atleta/PersonalHomeView";
import {
  HeroSection,
  HomeHeaderSection,
} from "./_components/sections/HeroSection";
import { TodaySection } from "./_components/sections/TodaySection";
import { GreetingSection } from "./_components/sections/GreetingSection";
import { SurveySection } from "./_components/sections/SurveySection";
import { BookingSection } from "./_components/sections/BookingSection";
import { WeekStripSection } from "./_components/sections/WeekStripSection";
import { LeaderboardSection } from "./_components/sections/LeaderboardSection";
import { BadgesSection } from "./_components/sections/BadgesSection";
import { RecentActivitySection } from "./_components/sections/RecentActivitySection";
import { CompleteProfileBannerSection } from "./_components/sections/CompleteProfileBannerSection";
import {
  HomeHeaderSkeleton,
  TodaySkeleton,
  HeroSkeleton,
  GreetingSkeleton,
  SurveySkeleton,
  BookingSkeleton,
  WeekStripSkeleton,
  LeaderboardSkeleton,
  BadgesSkeleton,
  RecentActivitySkeleton,
} from "./_components/skeletons";

export const metadata = { title: "Kronos — Inicio" };

/**
 * Athlete home page — streaming version.
 *
 * Order is the daily loop, not a feature catalogue (audit 2026-09-15, P0 #8):
 * the first viewport answers "what do I do now" with the "Hoy" card and one
 * lime CTA; the streak hero and rings are the second row; badges sit below the
 * leaderboard; cancelling a booking lives inside the class card further down,
 * as a secondary ghost action, so it can never be the first button on screen.
 *
 * Each data-dependent block is its own Suspense boundary. The shell paints
 * immediately on navigation while sections stream in as their fetches resolve.
 *
 * Shared fetches (getAthleteHome, listAvailableClasses, getTodayWODWithScores)
 * are deduplicated via React.cache() in _components/request-cache.ts — multiple
 * Suspense sections that need the same data share one DB round-trip per request.
 *
 * Empty-state (no athlete profile) is handled inside HomeHeaderSection. When
 * home is null, all other sections also return null via the cached fetch — no
 * cascading errors, just a clean "Sin perfil" card.
 */
export default async function AtletaHomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.tenantId) {
    const box = await prismaBase.box.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true },
    });
    if (box && isPersonalBoxSlug(box.slug)) {
      // Same `pb-28 relative` shell as the box branch below: the athlete TabBar
      // is `fixed bottom-0` and 84px tall, so without the padding it sits on
      // top of the last card instead of below it.
      return (
        <div className="pb-28 relative">
          <Suspense fallback={null}>
            <PersonalHomeView />
          </Suspense>
        </div>
      );
    }
  }

  return (
    <div className="pb-28 relative">
      {/* COMPLETE PROFILE BANNER — only shown when onboarding was skipped */}
      <Suspense fallback={null}>
        <CompleteProfileBannerSection />
      </Suspense>

      {/* HEADER — greeting only; owns the "sin perfil" empty state */}
      <Suspense fallback={<HomeHeaderSkeleton />}>
        <HomeHeaderSection />
      </Suspense>

      {/* HOY — today's WOD, your class and the single primary action */}
      <Suspense fallback={<TodaySkeleton />}>
        <TodaySection />
      </Suspense>

      {/* STREAK + RINGS — second row */}
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

      {/* NEXT BOOKING / SUGGESTION — class card, cancel as a ghost action */}
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

      {/* BADGES — off the first viewport, below the leaderboard */}
      <Suspense fallback={<BadgesSkeleton />}>
        <BadgesSection />
      </Suspense>

      {/* LAST SCORE + LATEST PR — bottom of page, low urgency */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentActivitySection />
      </Suspense>
    </div>
  );
}
