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
 * Request-scoped cached athlete lookup, KEYED por (userId, tenantId).
 *
 * IMPORTANTE: la versión previa usaba `cache(async () => { ... })` sin
 * argumentos, lo que dejaba el cache key como `[]`. Bajo PM2 cluster con
 * 8 workers, si dos atletas distintos (incluso de tenants distintos) tocaban
 * el mismo worker, el cache podía servir el resultado del primero al
 * segundo — leak cross-tenant observado en E2E 2026-05-17 (atleta nuevo de
 * Test Box E2E veía datos de Bernardo Q. del Box DOMINUS).
 *
 * Fix defensivo: pasamos `userId` y `tenantId` como argumentos explícitos.
 * Aunque `react.cache` debería ser per-render, pasar args garantiza que el
 * cache key incluye la identidad del usuario — dos requests con userId
 * distinto nunca comparten resultado. La deduplicación dentro del mismo
 * request (mismo userId) sigue funcionando.
 */
const _getCurrentAthleteByKey = cache(
  async (userId: string, tenantId: string): Promise<CurrentAthlete> => {
    const db = withTenant(tenantId);
    const athlete = await db.athlete.findFirst({
      where: { userId },
      select: { id: true, userId: true, firstName: true, lastName: true },
    });
    return athlete ?? null;
  },
);

export async function getCurrentAthleteCached(): Promise<CurrentAthlete> {
  const session = await getCachedSession();
  if (!session?.user?.tenantId || !session.user.id) return null;
  return _getCurrentAthleteByKey(session.user.id, session.user.tenantId);
}
