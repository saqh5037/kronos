/**
 * Route-level skeleton for the athlete home page.
 *
 * Used by Next.js during hard navigation (initial load) before the Suspense
 * boundaries stream in. Uses the same skeleton pieces as the Suspense fallbacks
 * so the layout shape is consistent between hard nav and soft nav.
 */

import {
  HomeHeaderSkeleton,
  TodaySkeleton,
  HeroSkeleton,
  GreetingSkeleton,
  BookingSkeleton,
  WeekStripSkeleton,
  LeaderboardSkeleton,
  BadgesSkeleton,
  RecentActivitySkeleton,
} from "./_components/skeletons";

export default function AtletaLoading() {
  return (
    <div className="pb-28">
      <HomeHeaderSkeleton />
      <TodaySkeleton />
      <HeroSkeleton />
      <GreetingSkeleton />
      <BookingSkeleton />
      <WeekStripSkeleton />
      <LeaderboardSkeleton />
      <BadgesSkeleton />
      <RecentActivitySkeleton />
    </div>
  );
}
