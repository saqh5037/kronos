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
 * Cacheado por request via React.cache para que múltiples páginas/componentes
 * que lo llamen en el mismo render compartan el mismo resultado sin re-query.
 *
 * Devuelve isPersonal=false + nulls si no hay sesión — caller decide cómo
 * tratar (probablemente redirect a /login antes de llegar acá).
 */
export const getBoxMode = cache(async (): Promise<BoxMode> => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) {
    return { isPersonal: false, boxId: null, boxSlug: null, boxName: null };
  }
  const box = await db.box.findUnique({
    where: { id: session.user.tenantId },
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
});
