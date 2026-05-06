import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { listAlertRules } from "@/server/actions/alerts";
import { db as rawDb } from "@/server/db";
import AlertRulesPanel from "@/components/admin/AlertRulesPanel";
import type { AuditAction } from "@prisma/client";

export const metadata = { title: "Kronos — Alertas" };

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
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <p className="k-eyebrow mb-2">Notificaciones</p>
      <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-1 text-text">
        Alertas
      </h1>
      <p className="text-text-2 mb-6 text-sm">
        Define cuándo y cómo te notificamos sobre eventos críticos del box.
      </p>

      <AlertRulesPanel
        rules={rules}
        owners={owners}
        actionOptions={ACTION_OPTIONS}
      />
    </div>
  );
}
