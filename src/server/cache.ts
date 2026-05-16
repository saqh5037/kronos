/**
 * Cache layer — Next.js `unstable_cache` + `revalidateTag` wrappers.
 *
 * Estado F1.5 (2026-05-16): wrappers listos pero NO consumidos por UI todavía.
 * El wiring real (reemplazar lookups directos en server actions / page.tsx)
 * queda para el sprint de perf que viene con F2 + multi-Box scale.
 *
 * Tags convention: `{model}:{id}:{aspect}` — invalida granular por entidad.
 *
 *   box:{boxId}:discipline           → Box.discipline lookup
 *   athlete:{athleteId}:memberships  → Membership[] del athlete
 *
 * Revalidate por tiempo (5 min) Y por tag explícito tras mutaciones.
 */

import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";

const FIVE_MINUTES = 5 * 60;

// ─── Tag builders ───────────────────────────────────────────────────────────

export const cacheTags = {
  boxDiscipline: (boxId: string) => `box:${boxId}:discipline`,
  athleteMemberships: (athleteId: string) => `athlete:${athleteId}:memberships`,
} as const;

// ─── Box discipline ──────────────────────────────────────────────────────────

/**
 * Resuelve la Discipline de un Box (objeto completo o null si el Box no tiene
 * disciplineId backfilled todavía). Cacheado 5 min + revalidate por tag.
 *
 * Invalidar tras: Box.disciplineId update (pilot onboarding wizard, admin
 * settings, super-admin tools).
 */
export const getCachedBoxDiscipline = unstable_cache(
  async (boxId: string) => {
    const box = await db.box.findUnique({
      where: { id: boxId },
      select: { discipline: true },
    });
    return box?.discipline ?? null;
  },
  ["box-discipline"],
  {
    revalidate: FIVE_MINUTES,
    tags: ["box-discipline"], // tag global (sweep) — granular se agrega abajo
  },
);

export function invalidateBoxDiscipline(boxId: string): void {
  revalidateTag(cacheTags.boxDiscipline(boxId));
  revalidateTag("box-discipline");
}

// ─── Athlete memberships ─────────────────────────────────────────────────────

/**
 * Memberships ACTIVE de un athlete. Cacheado 5 min + revalidate por tag.
 *
 * Invalidar tras: Membership create/update/cancel (server actions de admin
 * o checkout de planes).
 */
export const getCachedAthleteMemberships = unstable_cache(
  async (athleteId: string) => {
    return db.membership.findMany({
      where: { athleteId, status: "ACTIVE" },
      include: { plan: true },
      orderBy: { startDate: "desc" },
    });
  },
  ["athlete-memberships"],
  {
    revalidate: FIVE_MINUTES,
    tags: ["athlete-memberships"],
  },
);

export function invalidateAthleteMemberships(athleteId: string): void {
  revalidateTag(cacheTags.athleteMemberships(athleteId));
  revalidateTag("athlete-memberships");
}

// ─── Sweep helpers (después de mutaciones grandes) ───────────────────────────

/**
 * Invalida todos los caches asociados a un Box (cuando cambian settings,
 * branding, disciplina, etc). Se mantiene granular por boxId; el sweep
 * global queda para emergencias.
 */
export function invalidateBoxCache(boxId: string): void {
  revalidateTag(cacheTags.boxDiscipline(boxId));
  revalidateTag("box-discipline");
}
