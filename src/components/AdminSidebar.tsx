"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Icon } from "@/components/kronos/v3/icons";
import { SignOutButton } from "@/components/auth/SignOutButton";

type LinkHref = ComponentProps<typeof Link>["href"];

type IconKey =
  | "dashboard"
  | "users"
  | "calendar"
  | "pin"
  | "check"
  | "card"
  | "mail"
  | "chart"
  | "settings"
  | "history"
  | "bolt"
  | "share";

type ModuleEntry = {
  href: LinkHref;
  label: string;
  icon: IconKey;
  exact?: boolean;
  ownerOnly?: boolean;
  badgeKey?: "sensitive";
};

type ModuleGroup = {
  title: string;
  items: ModuleEntry[];
};

const groups: ModuleGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
      { href: "/admin/atletas", label: "Atletas", icon: "users" },
      { href: "/admin/programacion", label: "Programación", icon: "pin" },
      { href: "/admin/reservas", label: "Reservas", icon: "calendar" },
    ],
  },
  {
    title: "ENTRENAMIENTO",
    items: [
      { href: "/admin/wods", label: "WODs", icon: "bolt" },
      { href: "/admin/movimientos", label: "Movimientos", icon: "bolt" },
      { href: "/admin/prs", label: "PRs", icon: "chart" },
      { href: "/admin/leaderboards", label: "Leaderboards", icon: "chart" },
    ],
  },
  {
    title: "GESTIÓN",
    items: [
      { href: "/admin/asistencia", label: "Asistencia", icon: "check" },
      { href: "/admin/pagos", label: "Pagos", icon: "card" },
      { href: "/admin/comunicaciones", label: "Comunicaciones", icon: "mail" },
      { href: "/admin/reportes", label: "Reportes", icon: "chart" },
    ],
  },
  {
    title: "CONFIG",
    items: [
      { href: "/admin/ajustes", label: "Ajustes del Box", icon: "settings" },
      {
        href: "/admin/auditoria",
        label: "Auditoría",
        icon: "history",
        ownerOnly: true,
        badgeKey: "sensitive",
      },
    ],
  },
];

function NavIcon({ kind, active }: { kind: IconKey; active: boolean }) {
  const color = active ? "var(--k-accent)" : "var(--k-t3)";
  const props = { width: 16, height: 16, style: { color } };
  switch (kind) {
    case "dashboard":
      return <Icon.Dashboard {...props} />;
    case "users":
      return <Icon.Users {...props} />;
    case "calendar":
      return <Icon.Calendar {...props} />;
    case "pin":
      return <Icon.Pin {...props} />;
    case "check":
      return <Icon.Check {...props} />;
    case "card":
      return <Icon.Card {...props} />;
    case "mail":
      return <Icon.Mail {...props} />;
    case "chart":
      return <Icon.Chart {...props} />;
    case "settings":
      return <Icon.Settings {...props} />;
    case "history":
      return <Icon.History {...props} />;
    case "bolt":
      return <Icon.Bolt {...props} />;
    case "share":
      return <Icon.Share {...props} />;
    default:
      return null;
  }
}

function KronosMark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: "var(--k-bg)",
          border: "1.5px solid var(--k-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--k-font-display)",
          fontSize: 15,
          fontWeight: 700,
          color: "var(--k-accent)",
          letterSpacing: "-0.04em",
          boxShadow: "var(--k-accent-glow)",
        }}
      >
        K
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--k-t1)",
          }}
        >
          KRONOS
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 8,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            marginTop: 3,
          }}
        >
          ADMIN · v1.0
        </span>
      </div>
    </div>
  );
}

type AdminSidebarProps = {
  sensitiveCount?: number;
  role?: string;
};

export default function AdminSidebar({
  sensitiveCount = 0,
  role,
}: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.ownerOnly || role === "OWNER"),
    }))
    .filter((g) => g.items.length > 0);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div
        className="lg:hidden flex"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--k-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              border: "1.5px solid var(--k-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--k-font-display)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--k-accent)",
              letterSpacing: "-0.04em",
            }}
          >
            K
          </div>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--k-t1)",
            }}
          >
            KRONOS
          </span>
        </div>
        <button
          type="button"
          aria-label="Abrir menú"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: "1px solid var(--k-line)",
            background: "var(--k-surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--k-t1)",
            cursor: "pointer",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      </div>
      {/* Spacer mobile */}
      <div
        className="lg:hidden"
        style={{ height: 56, flexShrink: 0 }}
        aria-hidden
      />

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <nav
        aria-label="Menú principal"
        className={`${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: 240,
          background: "var(--k-surface)",
          borderRight: "1px solid var(--k-line)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
          overflowY: "auto",
          transition: "transform 0.3s ease",
        }}
      >
        <KronosMark />
        <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
          {visibleGroups.map((g) => (
            <div key={g.title} style={{ marginBottom: 14 }}>
              <div
                style={{
                  padding: "10px 28px 6px",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  color: "var(--k-t4)",
                }}
              >
                {g.title}
              </div>
              {g.items.map((it) => {
                const hrefStr =
                  typeof it.href === "string"
                    ? it.href
                    : ((it.href as { pathname?: string }).pathname ?? "");
                const isActive = it.exact
                  ? pathname === hrefStr
                  : pathname.startsWith(hrefStr);
                const badgeValue =
                  it.badgeKey === "sensitive" && sensitiveCount > 0
                    ? sensitiveCount
                    : null;
                return (
                  <Link
                    key={hrefStr}
                    href={it.href}
                    className="k-tap"
                    style={{
                      minHeight: 44,
                      padding: "10px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: isActive
                        ? "var(--k-elevated)"
                        : "transparent",
                      color: isActive ? "var(--k-t1)" : "var(--k-t2)",
                      cursor: "pointer",
                      margin: "0 12px",
                      borderRadius: 8,
                      position: "relative",
                      textDecoration: "none",
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: "absolute",
                          left: -12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 3,
                          height: 18,
                          borderRadius: "0 2px 2px 0",
                          background: "var(--k-accent)",
                          boxShadow: "0 0 10px rgba(200,255,45,0.6)",
                        }}
                      />
                    )}
                    <NavIcon kind={it.icon} active={isActive} />
                    <span
                      style={{
                        flex: 1,
                        fontFamily: "var(--k-font-body)",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {it.label}
                    </span>
                    {badgeValue !== null && (
                      <span
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 9,
                          fontWeight: 600,
                          color: "var(--k-warning)",
                          background: "rgba(255,176,32,0.12)",
                          padding: "2px 7px",
                          borderRadius: 999,
                          letterSpacing: "0.04em",
                          border: "1px solid rgba(255,176,32,0.35)",
                        }}
                      >
                        {badgeValue > 99 ? "99+" : badgeValue}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            borderTop: "1px solid var(--k-line)",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <SignOutButton variant="menu" />
        </div>
      </nav>

      {/* Static placeholder for layout flow on desktop (sidebar is fixed) */}
      <div
        className="hidden lg:block"
        style={{ width: 240, flexShrink: 0 }}
        aria-hidden
      />
    </>
  );
}
