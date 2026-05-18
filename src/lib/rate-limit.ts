/**
 * In-memory sliding-window rate limiter.
 *
 * Single-process: cada instancia de PM2 tiene su propio store. Para Kronos
 * (PM2 single-instance) es suficiente. Si pasamos a cluster, migrar a Redis
 * (@upstash/ratelimit) — la API de este módulo está diseñada para reemplazarse
 * sin tocar callers.
 *
 * Limpieza: el Map descarta timestamps fuera de ventana en cada lookup. Para
 * evitar memory leak con IPs únicas, se purgan keys completas cada
 * `CLEANUP_EVERY` requests.
 */

const buckets = new Map<string, number[]>();
const CLEANUP_EVERY = 1000;
let opsSinceCleanup = 0;

export type RateLimitResult = {
  ok: boolean;
  retryAfterSec: number;
  remaining: number;
};

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  const existing = buckets.get(key) ?? [];
  const fresh = existing.filter((t) => t > cutoff);

  if (fresh.length >= limit) {
    const oldest = fresh[0]!;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    buckets.set(key, fresh);
    maybeCleanup(now);
    return { ok: false, retryAfterSec, remaining: 0 };
  }

  fresh.push(now);
  buckets.set(key, fresh);
  maybeCleanup(now);

  return { ok: true, retryAfterSec: 0, remaining: limit - fresh.length };
}

/**
 * Read-only check: lee el bucket sin incrementar. Útil cuando quieres decidir
 * si bloquear ANTES de hacer la operación, e incrementar SOLO cuando la
 * operación falla (penalizar fallos, no éxitos — caso típico OTP verify).
 */
export function rateLimitCheck(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = buckets.get(key) ?? [];
  const fresh = existing.filter((t) => t > cutoff);

  if (fresh.length >= limit) {
    const oldest = fresh[0]!;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000),
    );
    return { ok: false, retryAfterSec, remaining: 0 };
  }
  return { ok: true, retryAfterSec: 0, remaining: limit - fresh.length };
}

/**
 * Incrementa el bucket sin chequear el cap. Llamar después de un fallo
 * cuando ya pasaste `rateLimitCheck` y quieres contar este intento.
 */
export function rateLimitHit(key: string, windowMs: number): void {
  const now = Date.now();
  const cutoff = now - windowMs;
  const existing = buckets.get(key) ?? [];
  const fresh = existing.filter((t) => t > cutoff);
  fresh.push(now);
  buckets.set(key, fresh);
  maybeCleanup(now);
}

function maybeCleanup(now: number) {
  opsSinceCleanup += 1;
  if (opsSinceCleanup < CLEANUP_EVERY) return;
  opsSinceCleanup = 0;
  // Drop buckets cuyo timestamp más reciente sea > 5 min — IPs inactivas.
  const stale = now - 5 * 60 * 1000;
  for (const [k, ts] of buckets.entries()) {
    const last = ts[ts.length - 1];
    if (last === undefined || last < stale) buckets.delete(k);
  }
}

/** Test-only: limpia el store entre tests. NO usar en runtime. */
export function __resetRateLimitForTests() {
  buckets.clear();
  opsSinceCleanup = 0;
}

/** Lee la IP del cliente desde headers proxy-aware. Fallback a "unknown". */
export function getClientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? "unknown";
}
