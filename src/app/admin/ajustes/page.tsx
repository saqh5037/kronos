import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import BoxSettingsForm from "@/components/admin/BoxSettingsForm";
import { SupportCodeCard } from "./_components/SupportCodeCard";

export const metadata = { title: "Kronos — Ajustes" };

const TABS = [
  { href: "/admin/ajustes" as const, label: "Box", active: true },
  { href: "/admin/ajustes/horarios" as const, label: "Horarios" },
  { href: "/admin/ajustes/notificaciones" as const, label: "Notificaciones" },
  { href: "/admin/ajustes/alertas" as const, label: "Alertas" },
  { href: "/admin/ajustes/apodos" as const, label: "Apodos" },
  { href: "/admin/ajustes/permisos" as const, label: "Permisos" },
  { href: "/admin/ajustes/seguridad" as const, label: "Seguridad" },
];

export default async function AjustesPage() {
  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "OWNER";
  const box = await getBox();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <span className="k-eyebrow-bar">Configuración</span>
      <div className="mt-2 mb-6 flex items-baseline gap-2 flex-wrap">
        <span
          className="font-display text-[26px] leading-none"
          style={{ color: "var(--k-accent)" }}
        >
          Tus
        </span>
        <h1
          className="k-h-italic font-display font-extrabold text-[40px] leading-[1] tracking-[-0.02em]"
          style={{ color: "var(--k-t1)" }}
        >
          <em>ajustes</em>
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
      <SupportCodeCard code={box.supportCode} />
      <BoxSettingsForm box={box} canEdit={canEdit} />
    </div>
  );
}
