/**
 * Request-scoped deduplication for shared fetches in the athlete home page.
 *
 * Each function here wraps a server action in React.cache() so that multiple
 * Suspense sections that need the same data only trigger ONE DB round-trip per
 * request. The cache is per-request (React's RSC render tree), not cross-request.
 *
 * NOTE: We deliberately do NOT cache requireCachedSession here at module level —
 * see the security note in src/server/session.ts about the PM2 cluster cross-tenant
 * leak. These wrappers are keyed by the action's own arguments, which is safe.
 */

import { cache } from "react";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { getTodayWODWithScores } from "@/server/actions/scores";

/**
 * Deduplicates getAthleteHome() across Suspense sections.
 * HeroSection, BookingSection, WeekStripSection, and RecentActivitySection
 * all need this data — they'll share one fetch.
 */
export const getAthleteHomeCached = cache(async (): Promise<AthleteHome> => {
  return getAthleteHome();
});

/**
 * Deduplicates listAvailableClasses(7) across Suspense sections.
 * BookingSection and WeekStripSection both need the 7-day class list.
 */
export const listAvailableClassesCached = cache(
  async (): Promise<AvailableClass[]> => {
    return listAvailableClasses(7);
  },
);

/**
 * Deduplicates getTodayWODWithScores() — only used by LeaderboardSection,
 * but wrapped for consistency and future-proofing.
 */
export const getTodayWODWithScoresCached = cache(async () => {
  return getTodayWODWithScores();
});
