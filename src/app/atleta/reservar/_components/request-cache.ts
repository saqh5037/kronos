/**
 * Request-scoped dedup for the booking page.
 *
 * listAvailableClasses(7) is consumed by BOTH WeekStripSection (reserved dots)
 * and DayContentSection (the day's class list). Keyed by (userId, tenantId) so
 * the two sections share ONE DB round-trip per request without any cross-tenant
 * risk — see the empty-key leak note in src/app/atleta/_components/request-cache.ts.
 */

import { cache } from "react";
import { getCachedSession } from "@/server/session";
import {
  listAvailableClasses,
  type AvailableClass,
} from "@/server/actions/bookings";

const _listWeekClassesByKey = cache(
  async (
    _userId: string,
    _tenantId: string,
    todayIso: string,
  ): Promise<AvailableClass[]> => {
    return listAvailableClasses(7, new Date(todayIso));
  },
);

/** The next 7 days of classes for the current athlete, deduped per request. */
export async function listWeekClassesCached(
  todayIso: string,
): Promise<AvailableClass[]> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) return [];
  return _listWeekClassesByKey(
    session.user.id,
    session.user.tenantId,
    todayIso,
  );
}
