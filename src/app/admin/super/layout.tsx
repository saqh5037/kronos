import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/server/auth";
import { isSuperAdmin } from "@/lib/super-admin";

/**
 * Layout gate para `/admin/super/*` — solo accesible a super-admins
 * configurados en env `SUPER_ADMIN_EMAILS`.
 *
 * Si el usuario no autorizado intenta acceder: 404 (no 401/403 — para no
 * filtrar la existencia de las rutas internas).
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session?.user?.email)) {
    notFound();
  }
  return <div data-mode="super">{children}</div>;
}
