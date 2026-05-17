/**
 * Cache layer — Next.js `unstable_cache` + `revalidateTag` wrappers.
 *
 * Estado F1.5+ (2026-05-16 fix): wrappers consumidos por `/admin/wods`
 * (ver F1.4 SmartWODForm) y disponibles para otros call-sites.
 *
 * Tags convention: `{model}:{id}:{aspect}` — invalida granular por entidad.
 *
 *   box:{boxId}:discipline           → Box.discipline lookup
 *   athlete:{athleteId}:memberships  → Membership[] del athlete
 *
 * IMPLEMENTACIÓN: `unstable_cache` recibe sus tags al MOMENTO de configurar
 * la fn cacheada, no al invocarla. Para que cada `boxId` registre su tag
 * granular, envolvemos `unstable_cache(...)` dentro de una factory que
 * cierra sobre el arg y construye la entrada con tags específicos.
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
 * Resuelve la Discipline de un Box (objeto completo o null si el Box no
 * tiene disciplineId backfilled todavía). Cacheado 5 min + revalidate por
 * tag granular `box:${boxId}:discipline` + tag global `box-discipline`.
 *
 * Invalidar tras: Box.disciplineId update (pilot onboarding wizard, admin
 * settings, super-admin tools).
 */
export function getCachedBoxDiscipline(boxId: string) {
  return unstable_cache(
    async () => {
      const box = await db.box.findUnique({
        where: { id: boxId },
        select: { discipline: true },
      });
      return box?.discipline ?? null;
    },
    ["box-discipline", boxId],
    {
      revalidate: FIVE_MINUTES,
      tags: [cacheTags.boxDiscipline(boxId), "box-discipline"],
    },
  )();
}

export function invalidateBoxDiscipline(boxId: string): void {
  revalidateTag(cacheTags.boxDiscipline(boxId));
  revalidateTag("box-discipline");
}

// ─── Athlete memberships ─────────────────────────────────────────────────────

/**
 * Memberships ACTIVE de un athlete. Cacheado 5 min + revalidate por tag
 * granular `athlete:${athleteId}:memberships` + tag global.
 *
 * Invalidar tras: Membership create/update/cancel (server actions de admin
 * o checkout de planes).
 */
export function getCachedAthleteMemberships(athleteId: string) {
  return unstable_cache(
    async () => {
      return db.membership.findMany({
        where: { athleteId, status: "ACTIVE" },
        include: { plan: true },
        orderBy: { startDate: "desc" },
      });
    },
    ["athlete-memberships", athleteId],
    {
      revalidate: FIVE_MINUTES,
      tags: [cacheTags.athleteMemberships(athleteId), "athlete-memberships"],
    },
  )();
}

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
