import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { isSuperAdmin } from "@/lib/super-admin";

/**
 * Gate dedicado para server actions de super-admin.
 *
 * NOTA: este módulo NO lleva `"use server"` a propósito. `requireSuperAdmin`
 * es un helper server-side importado por otras actions, no una server action
 * en sí. Marcarlo `"use server"` lo expondría como endpoint RPC público sin
 * necesidad. Los importadores (super-pilotos, super-platform) ya tienen su
 * propio `"use server"` y heredan el contexto server al invocarlo.
 *
 * IMPORTANTE: Las server actions con `"use server"` son endpoints HTTP
 * públicos invocables por cualquier sesión válida — el layout `/admin/super/*`
 * que llama notFound() protege el RENDER de la page, NO al RPC de las
 * actions importadas. Cada server action sensible debe validar por sí misma.
 *
 * Devuelve `{ ok: false, error: "UNAUTHORIZED" }` para que los callers
 * tipen el resultado de forma consistente.
 */
export async function requireSuperAdmin(): Promise<
  true | { ok: false; error: "UNAUTHORIZED" }
> {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email)) {
    return { ok: false, error: "UNAUTHORIZED" };
  }
  return true;
}
