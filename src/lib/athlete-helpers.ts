import type { AthleteSort } from "@/server/actions/athletes";

type SortDir = "asc" | "desc";

/**
 * Maps an AthleteSort key to a Prisma orderBy object.
 * Extracted as a pure helper so it can be unit tested without
 * pulling in the NextAuth / server action dependency chain.
 */
export function buildAthleteOrderBy(
  sortBy: AthleteSort,
  sortDir: SortDir,
): Record<string, unknown> | Array<Record<string, unknown>> {
  switch (sortBy) {
    case "name":
      return [{ firstName: sortDir }, { lastName: sortDir }];
    case "totalScores":
      return { _count: { scores: sortDir } };
    case "lastAttendanceAt":
      // Prisma supports orderBy on aggregate across a relation with _max.
      // This sorts by the most recent ATTENDED booking's checkedInAt.
      return { bookings: { _max: { checkedInAt: sortDir } } };
    case "createdAt":
    default:
      return { createdAt: sortDir };
  }
}
