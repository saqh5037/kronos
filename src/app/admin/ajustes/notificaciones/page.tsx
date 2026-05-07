import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBoxNotifications } from "@/server/actions/box-notifications";
import { NotificationsForm } from "./_components/NotificationsForm";

export const metadata = { title: "Kronos — Notificaciones" };
export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin/ajustes" as const, label: "Box" },
  { href: "/admin/ajustes/horarios" as const, label: "Horarios" },
  {
    href: "/admin/ajustes/notificaciones" as const,
    label: "Notificaciones",
    active: true,
  },
  { href: "/admin/ajustes/alertas" as const, label: "Alertas" },
  { href: "/admin/ajustes/apodos" as const, label: "Apodos" },
  { href: "/admin/ajustes/permisos" as const, label: "Permisos" },
];

export default async function NotificacionesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");
  if (session.user.role !== "OWNER") redirect("/admin/ajustes");

  const settings = await getBoxNotifications();
  if (!settings) redirect("/admin");

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <span className="k-eyebrow-bar">Configuración</span>
      <div className="mt-2 mb-6 flex items-baseline gap-2 flex-wrap">
        <span
          className="font-script text-[26px] leading-none"
          style={{ color: "var(--red)" }}
        >
          Tus
        </span>
        <h1
          className="k-h-italic font-display font-extrabold text-[32px] md:text-[40px] leading-[1] tracking-[-0.02em]"
          style={{ color: "var(--text)" }}
        >
          <em>notificaciones</em>
        </h1>
      </div>
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: t.active ? "var(--grad)" : "var(--card)",
              color: t.active ? "#0a0a0c" : "var(--text-2)",
              border: t.active ? "none" : "1px solid var(--line)",
            }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <p className="text-sm text-[var(--text-2)] mb-6 max-w-2xl">
        Controla qué emails recibís de Kronos. Los avisos críticos del cobro
        (cargos fallidos, suscripción expirada) y el resumen semanal se pueden
        desactivar individualmente.
      </p>

      <NotificationsForm initial={settings} />
    </div>
  );
}
