import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

/**
 * Session lookup wrapper sin cache compartido entre requests.
 *
 * Versión previa: `cache(async () => getServerSession())` sin argumentos.
 * Bug observado E2E 2026-05-17: en PM2 cluster (8 workers), el `cache()` de
 * React con key vacía `[]` podía servir la session de un request al
 * siguiente request del mismo worker. Atleta nuevo logueado veía la session
 * de Bernardo Q. (atleta seed DOMINUS) — cross-tenant data leak.
 *
 * Fix: llamar `getServerSession` directo. NextAuth ya optimiza el JWT
 * decode internamente. El overhead de N llamadas en un render es aceptable
 * vs el riesgo de servir session ajena.
 *
 * Si el perf se vuelve un issue, mover el `cache()` al nivel del Server
 * Component padre con args explícitos (cookie hash o similar), nunca a
 * nivel de módulo compartido entre requests.
 */
export async function getCachedSession(): Promise<Session | null> {
  return getServerSession(authOptions);
}

/**
 * Convenience wrapper that throws if the session is missing or has no tenant.
 */
export async function requireCachedSession() {
  const session = await getCachedSession();
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  return session;
}
