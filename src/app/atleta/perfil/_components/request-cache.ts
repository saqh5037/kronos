/**
 * Request-scoped deduplication for shared fetches in the athlete profile page.
 *
 * getAthleteHome() is consumed by PerfilHeroSection, PerfilStatsSection and
 * PerfilContentSection (empty-state / hub). We key React.cache() by (userId,
 * tenantId) to guarantee cross-tenant safety — same pattern as the home page
 * request-cache.ts. See the cross-tenant leak note in
 * src/app/atleta/_components/request-cache.ts for why empty-key cache() is
 * never acceptable.
 */

/* eslint-disable @typescript-eslint/no-unused-vars -- (userId, tenantId) exist ONLY to key React.cache() per-identity */
import { cache } from "react";
import { getCachedSession } from "@/server/session";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";

const _getAthleteHomeByKey = cache(
  async (_userId: string, _tenantId: string): Promise<AthleteHome> => {
    return getAthleteHome();
  },
);

/** Deduplicates getAthleteHome() across all perfil sections. */
export async function getAthleteHomeCached(): Promise<AthleteHome> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) return null;
  return _getAthleteHomeByKey(session.user.id, session.user.tenantId);
}
