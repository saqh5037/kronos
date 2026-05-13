"use server";

import { cache } from "react";
import { getCachedSession } from "@/server/session";
import { withTenant } from "@/server/db";

export type CurrentAthlete = {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string | null;
} | null;

/**
 * Request-scoped cached athlete lookup.
 *
 * Dozens of server actions independently resolve the current athlete from
 * the userId. This wrapper deduplicates to a single query per request.
 */
export const getCurrentAthleteCached = cache(
  async (): Promise<CurrentAthlete> => {
    const session = await getCachedSession();
    if (!session?.user?.tenantId) return null;

    const db = withTenant(session.user.tenantId);
    const athlete = await db.athlete.findFirst({
      where: { userId: session.user.id },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });

    return athlete ?? null;
  },
);
