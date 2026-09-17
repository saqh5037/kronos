import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { MoveHorizontal, ShieldCheck } from "lucide-react";
import { authOptions } from "@/server/auth";
import { listPermissions } from "@/server/actions/permissions";
import PermissionMatrix from "@/components/admin/PermissionMatrix";
import { permissionActionLabel } from "@/lib/labels";
import { SettingsShell } from "../_components/SettingsShell";

export const metadata = { title: "Kronos — Permisos" };

/** The only actions where a money threshold means anything. */
const MONEY_ACTIONS = [
  "REGISTER_CASH_PAYMENT",
  "APPLY_DISCOUNT",
  "REFUND_PAYMENT",
  "EDIT_PLAN_PRICING",
] as const;

export default async function PermisosPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const permissions = await listPermissions();

  return (
    <SettingsShell
      active="permisos"
      title="Tus"
      emphasis="permisos"
      description="Qué puede hacer cada rol sin pedirte permiso. Tú, como dueño, siempre puedes todo."
    >
      {/* Legend — "Aprobación" and "Umbral" were unexplained columns */}
      <div className="k-card mb-4 p-4">
        <p
          className="k-eyebrow mb-3 inline-flex items-center gap-1.5"
          style={{ color: "var(--k-t2)" }}
        >
          <ShieldCheck size={13} strokeWidth={2.2} aria-hidden />
          Cómo leer esta tabla
        </p>
        <ul className="flex flex-col gap-2 text-sm">
          <li style={{ color: "var(--k-t2)" }}>
            <strong style={{ color: "var(--k-t1)" }}>Coach · Staff</strong> —
            marca el rol para que pueda hacer la acción por su cuenta.
          </li>
          <li style={{ color: "var(--k-t2)" }}>
            <strong style={{ color: "var(--k-t1)" }}>Aprobación</strong> — con
            esto activo, la acción no se aplica sola: queda pendiente hasta que
            tú la autorices.
          </li>
          <li style={{ color: "var(--k-t2)" }}>
            <strong style={{ color: "var(--k-t1)" }}>Umbral (MXN)</strong> —
            solo aplica a las acciones que mueven dinero (
            {MONEY_ACTIONS.map((a) => permissionActionLabel[a]).join(", ")}). Es
            el monto a partir del cual hace falta tu aprobación; en el resto de
            las filas no tiene efecto.
          </li>
        </ul>
        <p className="mt-3 text-xs" style={{ color: "var(--k-t3)" }}>
          Los cambios se guardan solos en cuanto los tocas. No hay botón de
          guardar.
        </p>
      </div>

      {/* The matrix scrolls sideways under ~768 px — say so instead of clipping silently */}
      <p
        className="mb-2 inline-flex items-center gap-1.5 text-xs md:hidden"
        style={{ color: "var(--k-t3)" }}
      >
        <MoveHorizontal size={13} strokeWidth={2.2} aria-hidden />
        Desliza la tabla para ver Aprobación y Umbral
      </p>

      <PermissionMatrix permissions={permissions} />
    </SettingsShell>
  );
}
