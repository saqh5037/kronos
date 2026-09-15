import Link from "next/link";
import type { ReactNode } from "react";

/**
 * One chrome for the whole settings area (audit 2026-09-15, admin-management P1).
 *
 * Before this, seven settings pages used three different chromes, four
 * different eyebrows and four content widths; the tab bar — the thing that says
 * "these pages are one area" — only appeared on three of them.
 *
 * `/admin/ajustes/alertas` is no longer a tab: alerts and notifications are the
 * same concept ("emails I get") and now live as two sections of one page, with
 * the old route redirecting to the section.
 */
export const SETTINGS_TABS = [
  { key: "box", href: "/admin/ajustes", label: "Box" },
  { key: "horarios", href: "/admin/ajustes/horarios", label: "Horarios" },
  { key: "avisos", href: "/admin/ajustes/notificaciones", label: "Avisos" },
  { key: "apodos", href: "/admin/ajustes/apodos", label: "Apodos" },
  { key: "permisos", href: "/admin/ajustes/permisos", label: "Permisos" },
  { key: "seguridad", href: "/admin/ajustes/seguridad", label: "Seguridad" },
] as const;

export type SettingsTabKey = (typeof SETTINGS_TABS)[number]["key"];

type Props = {
  active: SettingsTabKey;
  /** Plain part of the heading, e.g. "Tus". */
  title: string;
  /** Italic part of the heading, e.g. "ajustes". */
  emphasis: string;
  description?: ReactNode;
  children: ReactNode;
};

export function SettingsShell({
  active,
  title,
  emphasis,
  description,
  children,
}: Props) {
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <span className="k-eyebrow-bar">Ajustes</span>
      <div className="mt-2 mb-4 flex flex-wrap items-baseline gap-2">
        <span
          className="font-display text-[22px] leading-none md:text-[26px]"
          style={{ color: "var(--k-accent)" }}
        >
          {title}
        </span>
        <h1
          className="k-h-italic font-display text-[32px] leading-[1] font-extrabold tracking-[-0.02em] md:text-[40px]"
          style={{ color: "var(--k-t1)" }}
        >
          <em>{emphasis}</em>
        </h1>
      </div>

      {/* Scrollable at 360 with an edge fade so the clipped tabs read as more */}
      <div className="relative mb-6">
        <nav
          aria-label="Secciones de ajustes"
          className="flex gap-1 overflow-x-auto pb-1 pr-8"
        >
          {SETTINGS_TABS.map((t) => {
            const isActive = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                aria-current={isActive ? "page" : undefined}
                className="min-h-11 rounded-full px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: isActive ? "var(--k-accent)" : "var(--k-surface)",
                  color: isActive ? "var(--k-accent-on)" : "var(--k-t2)",
                  border: isActive ? "none" : "1px solid var(--k-line-2)",
                }}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 bottom-1 w-8"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,8,10,0) 0%, var(--k-bg) 85%)",
          }}
        />
      </div>

      {description ? (
        <p
          className="mb-6 max-w-2xl text-sm leading-relaxed"
          style={{ color: "var(--k-t2)" }}
        >
          {description}
        </p>
      ) : null}

      {children}
    </div>
  );
}
