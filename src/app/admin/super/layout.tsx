import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/server/auth";
import { isSuperAdmin } from "@/lib/super-admin";
import { SuperBreadcrumbs } from "./_components/SuperBreadcrumbs";

/**
 * Layout gate para `/admin/super/*` — solo accesible a super-admins
 * configurados en env `SUPER_ADMIN_EMAILS`.
 *
 * Si el usuario no autorizado intenta acceder: 404 (no 401/403 — para no
 * filtrar la existencia de las rutas internas).
 *
 * The lime band is the visible difference the audit asked for: box admin and
 * platform admin shared a chrome, so nobody could tell they had left tenant
 * scope (audit 2026-09-15, admin-management P1).
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
  return (
    <>
      <div
        className="sticky top-0 z-30"
        style={{
          borderTop: "3px solid var(--k-accent)",
          background: "var(--k-surface)",
          borderBottom: "1px solid var(--k-line-2)",
        }}
      >
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-6 py-2.5">
          <span
            className="font-display text-[10px] font-bold tracking-[0.18em] uppercase"
            style={{ color: "var(--k-accent)" }}
          >
            Plataforma Kronos · super-admin
          </span>
          <SuperBreadcrumbs />
        </div>
      </div>
      {children}
    </>
  );
}
