/**
 * Request-scoped deduplication for shared fetches in the athlete home page.
 *
 * Each function wraps a server action in React.cache() KEYED BY (userId, tenantId)
 * so multiple Suspense sections needing the same data trigger ONE DB round-trip
 * per request, WITHOUT risking a cross-tenant leak.
 *
 * Why keyed (NOT empty-key cache()): the codebase hit a real cross-tenant leak on
 * 2026-05-17 — `cache(async () => ...)` with an empty key `[]` under PM2 cluster
 * served one request's result to another on the same worker. See the notes in
 * src/server/session.ts and src/server/actions/athlete-cache.ts. Passing the
 * session identity as explicit args guarantees two requests from different users
 * NEVER share a cache entry, even if React's cache were not strictly per-render.
 * Same user within the same request → still deduped.
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- the (userId, tenantId) params exist ONLY to key React.cache() per-identity; the wrapped actions resolve the session themselves */
import { cache } from "react";
import { getCachedSession } from "@/server/session";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";
import { getTodayWODWithScores } from "@/server/actions/scores";

type TodayWODWithScores = Awaited<ReturnType<typeof getTodayWODWithScores>>;

const _getAthleteHomeByKey = cache(
  async (_userId: string, _tenantId: string): Promise<AthleteHome> => {
    return getAthleteHome();
  },
);

const _listAvailableClassesByKey = cache(
  async (_userId: string, _tenantId: string): Promise<AvailableClass[]> => {
    return listAvailableClasses(7);
  },
);

const _getTodayWODWithScoresByKey = cache(
  async (_userId: string, _tenantId: string): Promise<TodayWODWithScores> => {
    return getTodayWODWithScores();
  },
);

/**
 * Deduplicates getAthleteHome() across the Hero, Booking, WeekStrip and
 * RecentActivity sections — one fetch per request.
 */
export async function getAthleteHomeCached(): Promise<AthleteHome> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) return null;
  return _getAthleteHomeByKey(session.user.id, session.user.tenantId);
}

/** Deduplicates listAvailableClasses(7) across Booking + WeekStrip sections. */
export async function listAvailableClassesCached(): Promise<AvailableClass[]> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) return [];
  return _listAvailableClassesByKey(session.user.id, session.user.tenantId);
}

/** Today's WOD + scores (LeaderboardSection); keyed for the same safety guarantee. */
export async function getTodayWODWithScoresCached(): Promise<TodayWODWithScores> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) {
    return { wod: null, scores: [] };
  }
  return _getTodayWODWithScoresByKey(session.user.id, session.user.tenantId);
}
