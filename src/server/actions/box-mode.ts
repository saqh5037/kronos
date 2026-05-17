import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";

export type BoxMode = {
  isPersonal: boolean;
  boxId: string | null;
  boxSlug: string | null;
  boxName: string | null;
};

/**
 * Resuelve si el atleta está en su Box Personal (auto-creado en signup
 * independiente, slug `me-*`) o en un Box real con coach.
 *
 * Cache keyed por `tenantId` explícito — necesario para evitar el cross-tenant
 * leak detectado en E2E 2026-05-17 (cache() sin args podía compartir
 * resultados entre requests en el mismo worker PM2).
 */
const _getBoxModeByTenant = cache(
  async (tenantId: string): Promise<BoxMode> => {
    const box = await db.box.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true, name: true },
    });
    if (!box) {
      return { isPersonal: false, boxId: null, boxSlug: null, boxName: null };
    }
    return {
      isPersonal: isPersonalBoxSlug(box.slug),
      boxId: box.id,
      boxSlug: box.slug,
      boxName: box.name,
    };
  },
);

export async function getBoxMode(): Promise<BoxMode> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return { isPersonal: false, boxId: null, boxSlug: null, boxName: null };
  }
  return _getBoxModeByTenant(session.user.tenantId);
}
