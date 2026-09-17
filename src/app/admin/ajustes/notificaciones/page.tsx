import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { AuditAction } from "@prisma/client";
import { authOptions } from "@/server/auth";
import { db as rawDb } from "@/server/db";
import { getBoxNotifications } from "@/server/actions/box-notifications";
import { listAlertRules } from "@/server/actions/alerts";
import AlertRulesPanel from "@/components/admin/AlertRulesPanel";
import { SettingsShell } from "../_components/SettingsShell";
import { NotificationsForm } from "./_components/NotificationsForm";

export const metadata = { title: "Kronos — Avisos" };
export const dynamic = "force-dynamic";

const ACTION_OPTIONS: { value: AuditAction; label: string }[] = [
  { value: "PAYMENT_REGISTERED", label: "Pago registrado" },
  { value: "PAYMENT_VOIDED", label: "Pago anulado" },
  { value: "PAYMENT_INITIATED", label: "Checkout iniciado" },
  { value: "PAYMENT_CONFIRMED", label: "Pago confirmado" },
  { value: "MEMBERSHIP_CANCELLED", label: "Membresía cancelada" },
  { value: "MEMBERSHIP_PAUSED", label: "Membresía pausada" },
  { value: "SCORE_SUBMITTED", label: "Score registrado" },
];

/**
 * Avisos — one page, two sections (audit 2026-09-15, admin-management P1).
 *
 * "Alertas" and "Notificaciones" were two tabs for one concept: emails the
 * owner receives. They are now two sections here, and /admin/ajustes/alertas
 * redirects to the second one.
 */
export default async function AvisosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin/ajustes");

  const settings = await getBoxNotifications();
  if (!settings) redirect("/admin");

  const [rules, owners] = await Promise.all([
    listAlertRules(),
    rawDb.user.findMany({
      where: { tenantId: session.user.tenantId, role: "OWNER" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <SettingsShell
      active="avisos"
      title="Tus"
      emphasis="avisos"
      description="Todo lo que Kronos te manda por correo, en un solo lugar: los avisos que te enviamos nosotros y las alertas que dispara tu propio box."
    >
      <section className="mb-8">
        <h2 className="font-display mb-1 text-lg font-bold">
          Avisos de Kronos
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--k-t2)" }}>
          Correos que te manda Kronos sobre tu suscripción y el resumen del mes.
        </p>
        <NotificationsForm initial={settings} />
      </section>

      <section id="alertas" className="scroll-mt-24">
        <h2 className="font-display mb-1 text-lg font-bold">
          Alertas de tu box
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--k-t2)" }}>
          Correos que dispara lo que pasa dentro del box: un cobro registrado,
          una membresía cancelada, un score nuevo.
        </p>
        <AlertRulesPanel
          rules={rules}
          owners={owners}
          actionOptions={ACTION_OPTIONS}
        />
      </section>
    </SettingsShell>
  );
}
