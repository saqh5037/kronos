import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

/**
 * Request-scoped cached session.
 *
 * NextAuth's `getServerSession` triggers the `jwt` callback on every call,
 * which hits PostgreSQL. In a single render, layout + page + server actions
 * may call it 3-5 times. Wrapping with React.cache deduplicates to a single
 * DB round-trip per request.
 *
 * Use this instead of `getServerSession(authOptions)` in all App Router
 * server components and server actions.
 */
export const getCachedSession = cache(async (): Promise<Session | null> => {
  return getServerSession(authOptions);
});

/**
 * Convenience wrapper that throws if the session is missing or has no tenant.
 */
export async function requireCachedSession() {
  const session = await getCachedSession();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}
