import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import {
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
} from "@/server/actions/alerts";
import { db as rawDb } from "@/server/db";
import type { AuditAction, AlertChannel } from "@prisma/client";

export const metadata = { title: "Kronos — Alertas" };

const CHANNEL_LABELS: Record<AlertChannel, string> = {
  EMAIL: "Email",
  PUSH: "Push",
  IN_APP: "In-App",
  BOTH: "Email + Push",
};

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: "PAYMENT_REGISTERED", label: "Pago registrado" },
  { value: "PAYMENT_VOIDED", label: "Pago anulado" },
  { value: "PAYMENT_INITIATED", label: "Checkout iniciado" },
  { value: "PAYMENT_CONFIRMED", label: "Pago confirmado" },
  { value: "MEMBERSHIP_CANCELLED", label: "Membresía cancelada" },
  { value: "MEMBERSHIP_PAUSED", label: "Membresía pausada" },
  { value: "SCORE_SUBMITTED", label: "Score registrado" },
];

export default async function AlertasPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    redirect("/admin");
  }

  const [rules, owners] = await Promise.all([
    listAlertRules(),
    rawDb.user.findMany({
      where: { tenantId: session.user.tenantId, role: "OWNER" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <p className="k-eyebrow mb-2">Notificaciones</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-2">
        Alertas
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Define cuándo y cómo te notificamos sobre eventos críticos del box.
      </p>

      {/* Create new rule form */}
      <div className="k-card p-6 mb-6">
        <h2 className="font-semibold mb-4">Nueva regla</h2>
        <form
          action={async (fd: FormData) => {
            "use server";
            const action = fd.get("action") as AuditAction;
            const channel = fd.get("channel") as AlertChannel;
            const thresholdVal = fd.get("threshold");
            const threshold = thresholdVal ? Number(thresholdVal) : null;
            const recipientIds = fd.getAll("recipientIds") as string[];
            await createAlertRule({ action, channel, threshold, recipientIds });
          }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Acción
            </label>
            <select
              name="action"
              required
              className="w-full bg-[var(--bg-soft)] border border-white/10 rounded px-3 py-2 text-sm"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Canal
            </label>
            <select
              name="channel"
              className="w-full bg-[var(--bg-soft)] border border-white/10 rounded px-3 py-2 text-sm"
            >
              <option value="EMAIL">Email</option>
              <option value="BOTH">Email + Push (cuando haya PWA)</option>
              <option value="PUSH">Push (cuando haya PWA)</option>
              <option value="IN_APP">In-App (próxima fase)</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Umbral mínimo ($) — opcional
            </label>
            <input
              type="number"
              name="threshold"
              placeholder="Ej: 1000"
              min={0}
              className="w-full bg-[var(--bg-soft)] border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm text-[var(--muted)] block mb-1">
              Destinatarios
            </label>
            <div className="space-y-1">
              {owners.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="recipientIds"
                    value={u.id}
                    defaultChecked
                  />
                  <span>{u.name ?? u.email}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="k-btn-grad px-6 py-2 rounded-lg text-sm font-medium"
            >
              Crear regla
            </button>
          </div>
        </form>
      </div>

      {/* Rules table */}
      {rules.length === 0 ? (
        <div className="k-card p-12 text-center text-[var(--muted)]">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium">Sin reglas de alerta</p>
          <p className="text-sm mt-1">
            Crea una regla arriba para empezar a recibir alertas.
          </p>
        </div>
      ) : (
        <div className="k-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-[var(--muted)] font-medium">
                  Acción
                </th>
                <th className="text-left p-4 text-[var(--muted)] font-medium">
                  Canal
                </th>
                <th className="text-left p-4 text-[var(--muted)] font-medium">
                  Umbral
                </th>
                <th className="text-center p-4 text-[var(--muted)] font-medium w-20">
                  Activa
                </th>
                <th className="w-20 p-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rules.map((rule) => {
                const actionLabel =
                  ACTION_OPTIONS.find((o) => o.value === rule.action)?.label ??
                  rule.action;
                return (
                  <tr
                    key={rule.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4 font-medium">{actionLabel}</td>
                    <td className="p-4 text-[var(--muted)]">
                      {CHANNEL_LABELS[rule.channel]}
                    </td>
                    <td className="p-4 text-[var(--muted)]">
                      {rule.threshold !== null ? `$${rule.threshold}` : "—"}
                    </td>
                    <td className="p-4 text-center">
                      <form
                        action={async () => {
                          "use server";
                          await updateAlertRule(rule.id, {
                            enabled: !rule.enabled,
                          });
                        }}
                      >
                        <button
                          type="submit"
                          className={`w-5 h-5 rounded border-2 transition-colors ${
                            rule.enabled
                              ? "bg-[var(--recovery)] border-[var(--recovery)]"
                              : "border-white/20 bg-transparent"
                          }`}
                        />
                      </form>
                    </td>
                    <td className="p-4 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await deleteAlertRule(rule.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-[var(--pr)] hover:opacity-70 transition-opacity text-xs"
                        >
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
