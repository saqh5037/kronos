/**
 * Pin the test process timezone.
 *
 * CI (GitHub Actions) runs in UTC; a laptop in Mexico runs in
 * America/Mexico_City. Six tests in this suite used to pass locally and fail on
 * PR #49 for exactly that reason — they were pinning code that read the host's
 * calendar instead of the box's (see `src/lib/tz.ts` for the product bug).
 *
 * Defaulting to UTC makes a bare `pnpm test` reproduce CI. An explicit
 * `TZ=America/Mexico_City pnpm test` still wins, because the point of fixing
 * the code was that BOTH must be green — a hard override would only hide the
 * next regression.
 */
process.env.TZ ??= "UTC";
