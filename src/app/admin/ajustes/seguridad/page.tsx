import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getPasswordStatus } from "@/server/actions/password";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Kronos — Seguridad" };
export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin/ajustes" as const, label: "Box" },
  { href: "/admin/ajustes/horarios" as const, label: "Horarios" },
  { href: "/admin/ajustes/notificaciones" as const, label: "Notificaciones" },
  { href: "/admin/ajustes/alertas" as const, label: "Alertas" },
  { href: "/admin/ajustes/apodos" as const, label: "Apodos" },
  { href: "/admin/ajustes/permisos" as const, label: "Permisos" },
  {
    href: "/admin/ajustes/seguridad" as const,
    label: "Seguridad",
    active: true,
  },
];

export default async function SeguridadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const { hasPassword } = await getPasswordStatus();

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <span className="k-eyebrow-bar">Configuración</span>
      <div className="mt-2 mb-6 flex items-baseline gap-2 flex-wrap">
        <span
          className="font-display text-[26px] leading-none"
          style={{ color: "var(--k-accent)" }}
        >
          Tu
        </span>
        <h1
          className="k-h-italic font-display font-extrabold text-[40px] leading-[1] tracking-[-0.02em]"
          style={{ color: "var(--k-t1)" }}
        >
          <em>seguridad</em>
        </h1>
      </div>
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all"
            style={{
              background: t.active ? "var(--k-accent)" : "var(--k-surface)",
              color: t.active ? "var(--k-accent-on)" : "var(--k-t2)",
              border: t.active ? "none" : "1px solid var(--k-line-2)",
            }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div className="k-card p-6">
        <h2
          className="font-display text-xl font-bold mb-1"
          style={{ color: "var(--k-t1)" }}
        >
          Contraseña
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--k-t2)" }}>
          {hasPassword
            ? "Ya tenés una contraseña configurada. Podés cambiarla o eliminarla."
            : "Magic link funciona perfecto, pero seteá una contraseña para entrar más rápido sin esperar el email."}
        </p>
        <PasswordForm hasPassword={hasPassword} />
      </div>
    </div>
  );
}
