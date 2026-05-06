import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { listPermissions } from "@/server/actions/permissions";
import PermissionMatrix from "@/components/admin/PermissionMatrix";

export const metadata = { title: "Kronos — Permisos" };

export default async function PermisosPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const permissions = await listPermissions();

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <p className="k-eyebrow mb-2">Seguridad</p>
      <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-1 text-text">
        Permisos
      </h1>
      <p className="text-text-2 mb-6 text-sm">
        Define qué puede tocar cada quién. El dueño manda.
      </p>

      <PermissionMatrix permissions={permissions} />
    </div>
  );
}
