import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import {
  listPermissions,
  updatePermission,
} from "@/server/actions/permissions";
import type { PermissionAction, Role } from "@prisma/client";

export const metadata = { title: "Kronos — Permisos" };

const ALL_ACTIONS: PermissionAction[] = [
  "REGISTER_CASH_PAYMENT",
  "APPLY_DISCOUNT",
  "REFUND_PAYMENT",
  "EDIT_PLAN_PRICING",
  "DELETE_ATHLETE",
  "MARK_OVERDUE",
  "VIEW_FINANCIAL_REPORTS",
  "EDIT_OTHERS_SCORES",
];

const ACTION_LABELS: Record<PermissionAction, string> = {
  REGISTER_CASH_PAYMENT: "Registrar pago en efectivo",
  APPLY_DISCOUNT: "Aplicar descuento",
  REFUND_PAYMENT: "Anular / reembolsar pago",
  EDIT_PLAN_PRICING: "Editar precios de planes",
  DELETE_ATHLETE: "Eliminar atleta",
  MARK_OVERDUE: "Marcar como vencido",
  VIEW_FINANCIAL_REPORTS: "Ver reportes financieros",
  EDIT_OTHERS_SCORES: "Editar scores de otros",
};

const ROLES: Role[] = ["COACH", "STAFF"];

export default async function PermisosPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const permissions = await listPermissions();
  const permMap = new Map(permissions.map((p) => [p.action, p]));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <p className="k-eyebrow mb-2">Seguridad</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-2">
        Permisos
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Controla qué acciones pueden realizar coaches y staff. OWNER siempre
        tiene acceso completo.
      </p>

      <div className="k-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left p-4 font-medium text-[var(--muted)]">
                Acción
              </th>
              {ROLES.map((role) => (
                <th
                  key={role}
                  className="text-center p-4 font-medium text-[var(--muted)] w-24"
                >
                  {role}
                </th>
              ))}
              <th className="text-center p-4 font-medium text-[var(--muted)] w-32">
                Aprobación del dueño
              </th>
              <th className="text-center p-4 font-medium text-[var(--muted)] w-32">
                Umbral ($)
              </th>
              <th className="w-20 p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {ALL_ACTIONS.map((action) => {
              const perm = permMap.get(action);
              const allowedRoles = perm?.allowedRoles ?? [];
              const requiresApproval = perm?.requiresOwnerApproval ?? false;
              const threshold = perm?.threshold ?? null;

              return (
                <PermissionRow
                  key={action}
                  action={action}
                  label={ACTION_LABELS[action]}
                  allowedRoles={allowedRoles}
                  requiresOwnerApproval={requiresApproval}
                  threshold={threshold}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PermissionRow({
  action,
  label,
  allowedRoles,
  requiresOwnerApproval,
  threshold,
}: {
  action: PermissionAction;
  label: string;
  allowedRoles: Role[];
  requiresOwnerApproval: boolean;
  threshold: number | null;
}) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      <td className="p-4 font-medium">{label}</td>

      {ROLES.map((role) => {
        const checked = allowedRoles.includes(role);
        return (
          <td key={role} className="p-4 text-center">
            <form
              action={async (fd: FormData) => {
                "use server";
                const newChecked = fd.get("checked") === "true";
                const newRoles = newChecked
                  ? [...allowedRoles.filter((r) => r !== role), role]
                  : allowedRoles.filter((r) => r !== role);
                await updatePermission(
                  action,
                  newRoles,
                  threshold,
                  requiresOwnerApproval,
                );
              }}
            >
              <input type="hidden" name="checked" value={String(!checked)} />
              <button
                type="submit"
                className={`w-5 h-5 rounded border-2 transition-colors ${
                  checked
                    ? "bg-[var(--recovery)] border-[var(--recovery)]"
                    : "border-white/20 bg-transparent"
                }`}
                title={
                  checked ? `Quitar permiso a ${role}` : `Dar permiso a ${role}`
                }
              />
            </form>
          </td>
        );
      })}

      <td className="p-4 text-center">
        <form
          action={async () => {
            "use server";
            await updatePermission(
              action,
              allowedRoles,
              threshold,
              !requiresOwnerApproval,
            );
          }}
        >
          <button
            type="submit"
            className={`w-5 h-5 rounded border-2 transition-colors ${
              requiresOwnerApproval
                ? "bg-[var(--strain)] border-[var(--strain)]"
                : "border-white/20 bg-transparent"
            }`}
            title={
              requiresOwnerApproval
                ? "Desactivar aprobación"
                : "Activar aprobación del dueño"
            }
          />
        </form>
      </td>

      <td className="p-4 text-center">
        <form
          action={async (fd: FormData) => {
            "use server";
            const val = fd.get("threshold");
            const num = val ? Number(val) : null;
            await updatePermission(
              action,
              allowedRoles,
              num,
              requiresOwnerApproval,
            );
          }}
        >
          <input
            type="number"
            name="threshold"
            defaultValue={threshold ?? ""}
            placeholder="—"
            className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-center"
            min={0}
          />
          <button
            type="submit"
            className="ml-1 text-xs text-[var(--muted)] hover:text-white transition-colors"
          >
            OK
          </button>
        </form>
      </td>

      <td className="p-4 text-right">
        <span className="text-xs text-[var(--muted)]">OWNER siempre</span>
      </td>
    </tr>
  );
}
