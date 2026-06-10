/**
 * Cache layer — Next.js `unstable_cache` + `revalidateTag` wrappers.
 *
 * Tags convention: `{model}:{tenantId}:{aspect}` — tenantId está en TODA
 * cache key y en TODO tag (invariante de seguridad: evita cross-tenant leak).
 *
 * PM2 cluster note (8 workers, shared .next/cache filesystem):
 *   `revalidateTag` invalida el filesystem cache compartido y el LRU in-memory
 *   del worker que recibe la mutation. Los demás workers solo se enteran al TTL
 *   (o al siguiente cycle de disk-read del cache). El TTL es la GARANTÍA DURA;
 *   `revalidateTag` es best-effort optimistic invalidation para el worker local.
 *   No asumir que otros workers ven el dato fresco de inmediato tras revalidateTag.
 *
 * IMPLEMENTACIÓN: `unstable_cache` recibe sus tags al MOMENTO de configurar
 * la fn cacheada, no al invocarla. Para que cada id registre su tag granular,
 * envolvemos `unstable_cache(...)` dentro de una factory que cierra sobre el
 * arg y construye la entrada con tags específicos.
 *
 * REGLA DURA: nunca leer cookies()/headers()/session dentro del callback de
 * unstable_cache — esas APIs no están disponibles en ese contexto. Siempre
 * pasar tenantId como argumento.
 *
 * Revalidate por tiempo Y por tag explícito tras mutaciones.
 */

import { unstable_cache, revalidateTag } from "next/cache";
import { db } from "@/server/db";
import { buildCapabilityBuckets } from "@/lib/analytics/capability";
import { localDayWindow } from "@/lib/wod-date";

const FIVE_MINUTES = 5 * 60;
const TEN_MINUTES = 10 * 60;
const FIFTEEN_MINUTES = 15 * 60;
const ONE_HOUR = 60 * 60;
const SIX_HOURS = 6 * 60 * 60;

// ─── Tag builders ───────────────────────────────────────────────────────────

export const cacheTags = {
  boxDiscipline: (boxId: string) => `box:${boxId}:discipline`,
  athleteMemberships: (athleteId: string) => `athlete:${athleteId}:memberships`,
  prStats: (tenantId: string) => `prstats:${tenantId}`,
  movementCatalog: (tenantId: string) => `movements:${tenantId}:catalog`,
  badgeCatalog: (tenantId: string) => `badges:${tenantId}:catalog`,
  todayWod: (tenantId: string, dateKey: string) => `wod:${tenantId}:${dateKey}`,
} as const;

// ─── Box discipline ──────────────────────────────────────────────────────────

/**
 * Resuelve la Discipline de un Box. Cacheado 5 min + tag granular.
 * Invalidar tras: Box.disciplineId update (onboarding, admin settings).
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
 * Memberships ACTIVE de un athlete. Cacheado 5 min + tag granular.
 * Invalidar tras: Membership create/update/cancel.
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

// ─── Box PR stats ────────────────────────────────────────────────────────────

/**
 * Shape del cache de PRs del box. Diseñado para servir a AMBOS consumidores:
 *
 * - capability.ts: necesita boxMaxByMovement + overallScores por atleta
 * - rankings.ts: necesita valuesByMovement (array de valores para percentiles)
 *
 * La semántica de "mejor" para box max usa: TIME → menor es mejor (min),
 * demás → mayor es mejor (max). Esto refleja cómo `buildCapabilityBuckets`
 * normaliza: siempre divide por el "best" del box para ese movimiento.
 *
 * NOTA: para capability, el "max" conceptual ya está embebido en cómo
 * buildCapabilityBuckets trabaja — acepta boxMaxByMovement donde el caller
 * histórico usaba `v > cur` (mayor siempre). Para mantener semántica EXACTA
 * del código original, preservamos max numérico aquí (igual que el original).
 */
export type BoxMovementStats = {
  /**
   * Por movimiento: max numérico (para buildCapabilityBuckets) y array de
   * todos los valores de PRs del box (para computePercentile en rankings).
   */
  byMovement: Record<
    string,
    {
      max: number;
      values: number[];
      movementName: string;
    }
  >;
  /**
   * Score total (suma 5 categorías) por atleta, para computar overallRank.
   * Key = athleteId, value = overall score.
   */
  overallByAthlete: Record<string, number>;
  /**
   * Array de todos los overall scores (para computePercentile del rank global).
   */
  overallScores: number[];
};

/**
 * Estadísticas agregadas de PRs del box, cacheadas 15 min.
 * Reemplaza las dos queries O(PRs del box entero) en capability.ts y
 * el groupBy manual en rankings.ts.
 *
 * TTL = 15 min. Invalidar tras: guardar score/PR (submitScore).
 */
export function getCachedBoxMovementStats(tenantId: string) {
  return unstable_cache(
    async () => {
      // Una sola query para todos los PRs del box.
      const allPRs = await db.pR.findMany({
        where: { tenantId },
        select: {
          athleteId: true,
          movementId: true,
          value: true,
          movement: { select: { name: true } },
        },
      });

      const byMovement: BoxMovementStats["byMovement"] = {};
      for (const pr of allPRs) {
        const v = Number(pr.value);
        if (!byMovement[pr.movementId]) {
          byMovement[pr.movementId] = {
            max: v,
            values: [v],
            movementName: pr.movement.name,
          };
        } else {
          const entry = byMovement[pr.movementId];
          if (v > entry.max) entry.max = v;
          entry.values.push(v);
        }
      }

      // Agrupar PRs por atleta para calcular overallScores.
      const boxMaxByMovement = new Map<string, number>(
        Object.entries(byMovement).map(([id, e]) => [id, e.max]),
      );

      const allByAthlete = new Map<
        string,
        { movementId: string; movementName: string; value: number }[]
      >();
      for (const pr of allPRs) {
        const arr = allByAthlete.get(pr.athleteId) ?? [];
        arr.push({
          movementId: pr.movementId,
          movementName: pr.movement.name,
          value: Number(pr.value),
        });
        allByAthlete.set(pr.athleteId, arr);
      }

      const overallByAthlete: BoxMovementStats["overallByAthlete"] = {};
      const overallScores: number[] = [];
      for (const [aid, prs] of allByAthlete) {
        const buckets = buildCapabilityBuckets({
          myPRs: prs,
          boxMaxByMovement,
        });
        const total = buckets.reduce((s, b) => s + b.score, 0);
        overallByAthlete[aid] = total;
        overallScores.push(total);
      }

      return {
        byMovement,
        overallByAthlete,
        overallScores,
      } satisfies BoxMovementStats;
    },
    ["box-movement-stats", tenantId],
    {
      revalidate: FIFTEEN_MINUTES,
      tags: [cacheTags.prStats(tenantId), "box-movement-stats"],
    },
  )();
}

export function invalidatePRStats(tenantId: string): void {
  revalidateTag(cacheTags.prStats(tenantId));
}

// ─── Movement catalog ────────────────────────────────────────────────────────

/**
 * Catálogo completo de movimientos del box. Cacheado 1 hora.
 * No cachea info por-atleta — solo datos del catálogo compartido.
 * Invalidar tras: createMovement, updateMovement, updateMovementVideoUrl,
 * restoreStandardMovement.
 */
export function getCachedMovementCatalog(tenantId: string) {
  return unstable_cache(
    async () => {
      return db.movement.findMany({
        where: { tenantId },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          isStandard: true,
          videoUrl: true,
          standardDescription: true,
          equipment: true,
        },
      });
    },
    ["movement-catalog", tenantId],
    {
      revalidate: ONE_HOUR,
      tags: [cacheTags.movementCatalog(tenantId), "movement-catalog"],
    },
  )();
}

export function invalidateMovementCatalog(tenantId: string): void {
  revalidateTag(cacheTags.movementCatalog(tenantId));
}

// ─── Badge catalog ───────────────────────────────────────────────────────────

/**
 * Catálogo estático de badges del box (sin progreso por atleta). Cacheado 6 h.
 * Invalidar cuando se creen/editen badges (operación infrecuente, solo super-admin).
 *
 * IMPORTANTE: no cachea achievement/progreso por atleta — eso es dinámico
 * y vive en listBadgesWithProgress (no cacheado aquí).
 */
export function getCachedBadgeCatalog(tenantId: string) {
  return unstable_cache(
    async () => {
      return db.badge.findMany({
        where: { tenantId },
        orderBy: { code: "asc" },
      });
    },
    ["badge-catalog", tenantId],
    {
      revalidate: SIX_HOURS,
      tags: [cacheTags.badgeCatalog(tenantId), "badge-catalog"],
    },
  )();
}

export function invalidateBadgeCatalog(tenantId: string): void {
  revalidateTag(cacheTags.badgeCatalog(tenantId));
}

// ─── Today's WOD (box-level, sin info por-atleta) ────────────────────────────

/**
 * WOD asignado a la primera clase activa del día. Cacheado 10 min.
 * dateKey = "YYYY-MM-DD" en la timezone del box — el caller lo genera y pasa como argumento
 * (nunca leer Date dentro del callback; el callback se ejecuta en cache context).
 *
 * timezone: IANA tz del box (e.g. "America/Mexico_City"). Default "UTC" para
 * compatibilidad con callers existentes que no lo pasan.
 *
 * IMPORTANTE: cachea SOLO la parte del box. El score del atleta NO se incluye
 * aquí — el caller debe recuperarlo por separado si lo necesita.
 *
 * Invalidar tras: createClass, updateClass (cuando cambia el wodId del día).
 */
export function getCachedTodayWod(
  tenantId: string,
  dateKey: string,
  timezone = "UTC",
) {
  // dateKey format: "YYYY-MM-DD" in box-local timezone.
  // Window is computed using box timezone so evening classes (e.g. 20:30 CDMX = 02:30Z next day)
  // fall within the correct local calendar day window.
  const { start: startOfDay, end: endOfDay } = localDayWindow(
    dateKey,
    timezone,
  );

  return unstable_cache(
    async () => {
      const klass = await db.class.findFirst({
        where: {
          tenantId,
          startsAt: { gte: startOfDay, lte: endOfDay },
          isActive: true,
          wodId: { not: null },
        },
        orderBy: { startsAt: "asc" },
        include: {
          wod: {
            include: {
              movements: {
                orderBy: { order: "asc" },
                include: { movement: { select: { name: true } } },
              },
            },
          },
        },
      });

      if (!klass || !klass.wod) return null;

      return {
        classId: klass.id,
        startsAt: klass.startsAt,
        wodId: klass.wod.id,
        wodName: klass.wod.name,
        wodType: klass.wod.type,
        scoreType: klass.wod.scoreType,
        description: klass.wod.description,
        timeCap: klass.wod.timeCap,
        movements: klass.wod.movements.map((m) => ({
          movementId: m.movementId,
          name: m.movement.name,
          reps: m.reps,
          weight: m.weight ? Number(m.weight) : null,
          notes: m.notes,
          order: m.order,
        })),
      };
    },
    ["today-wod", tenantId, dateKey],
    {
      revalidate: TEN_MINUTES,
      tags: [cacheTags.todayWod(tenantId, dateKey), "today-wod"],
    },
  )();
}

export function invalidateTodayWod(tenantId: string, dateKey: string): void {
  revalidateTag(cacheTags.todayWod(tenantId, dateKey));
}

/**
 * Returns the IANA timezone for a box (tenantId = boxId).
 * Lightweight — one findUnique on Box.timezone. Not cached (callers are server actions
 * that run infrequently). Falls back to "UTC" if box not found.
 */
export async function getBoxTimezone(tenantId: string): Promise<string> {
  const box = await db.box.findUnique({
    where: { id: tenantId },
    select: { timezone: true },
  });
  return box?.timezone ?? "UTC";
}

// ─── Sweep helpers (después de mutaciones grandes) ───────────────────────────

/**
 * Invalida todos los caches asociados a un Box. Granular por boxId.
 */
export function invalidateBoxCache(boxId: string): void {
  revalidateTag(cacheTags.boxDiscipline(boxId));
  revalidateTag("box-discipline");
}
