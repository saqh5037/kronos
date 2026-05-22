"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Icon } from "@/components/kronos/v3/icons";

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
  | "dumbbell"
  | "trophy"
  | "bars"
  | "phone"
  | "globe"
  | "logout"
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
      { href: "/admin/movimientos", label: "Movimientos", icon: "dumbbell" },
      { href: "/admin/prs", label: "PRs", icon: "trophy" },
      { href: "/admin/leaderboards", label: "Leaderboards", icon: "bars" },
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

const footerItems: { href: LinkHref; label: string; icon: IconKey }[] = [
  { href: "/atleta", label: "App del atleta", icon: "phone" },
  { href: "/", label: "Landing pública", icon: "globe" },
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
    case "dumbbell":
      return <Icon.Dumbbell {...props} />;
    case "trophy":
      return <Icon.Trophy {...props} />;
    case "bars":
      return <Icon.Bars {...props} />;
    case "phone":
      return <Icon.Phone {...props} />;
    case "globe":
      return <Icon.Globe {...props} />;
    case "logout":
      return <Icon.Logout {...props} />;
    case "share":
      return <Icon.Share {...props} />;
    default:
      return null;
  }
}

function KronosLogo({
  size = 34,
  glow = true,
}: {
  size?: number;
  glow?: boolean;
}) {
  return (
    <div
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        style={{ position: "absolute", inset: 0, color: "var(--k-accent)" }}
      >
        <path
          d="M2 6 L2 2 L6 2"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="square"
          opacity="0.55"
        />
        <path
          d="M34 30 L34 34 L30 34"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="square"
          opacity="0.55"
        />
        <path
          d="M30 2 L34 2 L34 6"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="square"
          opacity="0.55"
        />
        <path
          d="M6 34 L2 34 L2 30"
          stroke="currentColor"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="square"
          opacity="0.55"
        />
        <line
          x1="11"
          y1="9"
          x2="11"
          y2="27"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
        />
        <line
          x1="11"
          y1="18"
          x2="22"
          y2="9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
        />
        <line
          x1="11"
          y1="18"
          x2="22"
          y2="27"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="square"
        />
        <circle cx="11" cy="18" r="1.8" fill="currentColor" />
      </svg>
      {glow && (
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: 8,
            boxShadow: "0 0 18px rgba(200,255,45,0.22)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

function KronosMark({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        padding: collapsed ? "18px 0 14px" : "20px 18px 16px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          justifyContent: collapsed ? "center" : "space-between",
        }}
      >
        <div
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Colapsar"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            minWidth: 0,
            cursor: "pointer",
          }}
        >
          <KronosLogo size={36} />
          {!collapsed && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                lineHeight: 1,
                minWidth: 0,
              }}
            >
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
                  fontSize: 8.5,
                  fontWeight: 500,
                  letterSpacing: "0.22em",
                  color: "var(--k-t3)",
                  marginTop: 4,
                }}
              >
                OS · v1.0
              </span>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            title="Colapsar"
            className="k-btn-icon"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "transparent",
              border: "1px solid var(--k-line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--k-t3)",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <Icon.Left width="12" height="12" />
          </button>
        )}
      </div>
      {collapsed && (
        <button
          onClick={onToggle}
          title="Expandir"
          className="k-btn-icon"
          style={{
            margin: "4px auto 0",
            width: 26,
            height: 22,
            borderRadius: 6,
            background: "transparent",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--k-t3)",
            padding: 0,
          }}
        >
          <Icon.Right width="12" height="12" />
        </button>
      )}
    </div>
  );
}

function BoxCard({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className="k-tap"
      style={{
        margin: collapsed ? "4px 10px 10px" : "0 14px 12px",
        padding: collapsed ? "10px 0" : "12px 12px",
        background: "var(--k-bg)",
        border: "1px solid var(--k-line)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 10,
        cursor: "pointer",
        justifyContent: collapsed ? "center" : "flex-start",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 2,
          background: "var(--k-accent)",
          boxShadow: "0 0 8px var(--k-accent)",
        }}
      />
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          background: "rgba(200,255,45,0.10)",
          border: "1px solid rgba(200,255,45,0.30)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--k-font-display)",
          fontSize: 11,
          fontWeight: 700,
          color: "var(--k-accent)",
          letterSpacing: "-0.04em",
          flexShrink: 0,
        }}
      >
        B
      </div>
      {!collapsed && (
        <>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                color: "var(--k-t1)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              TU BOX
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 8.5,
                fontWeight: 500,
                color: "var(--k-t3)",
                letterSpacing: "0.12em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              OWNER
            </span>
          </div>
          <Icon.Down
            width="12"
            height="12"
            style={{ color: "var(--k-t3)", flexShrink: 0 }}
          />
        </>
      )}
    </div>
  );
}

function LiveStrip({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      style={{
        padding: collapsed ? "10px 8px" : "10px 14px",
        borderTop: "1px solid var(--k-line)",
        background: "#0a0a0c",
        display: "flex",
        alignItems: "center",
        gap: 8,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <span
        className="k-pulse-dot"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--k-accent)",
          boxShadow: "0 0 8px var(--k-accent)",
          flexShrink: 0,
        }}
      />
      {!collapsed && (
        <>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--k-accent)",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            EN BOX
          </span>
          <span
            style={{
              flex: 1,
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              color: "var(--k-t2)",
              letterSpacing: "0.04em",
              textAlign: "right",
            }}
          >
            <LiveClock />
          </span>
        </>
      )}
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      );
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);
  return <>{time}</>;
}

function NavItem({
  item,
  active,
  collapsed,
  badge,
}: {
  item: { label: string; icon: IconKey; href?: LinkHref; onClick?: () => void };
  active: boolean;
  collapsed: boolean;
  badge?: string | number | null;
}) {
  const content = (
    <>
      {active && (
        <span
          style={{
            position: "absolute",
            left: -10,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
            borderRadius: "0 2px 2px 0",
            background: "var(--k-accent)",
            boxShadow: "0 0 10px rgba(200,255,45,0.7)",
          }}
        />
      )}
      <NavIcon kind={item.icon} active={active} />
      {!collapsed && (
        <span
          style={{
            flex: 1,
            fontFamily: "var(--k-font-body)",
            fontSize: 12.5,
            fontWeight: active ? 600 : 500,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.label}
        </span>
      )}
      {!collapsed && badge !== undefined && badge !== null && (
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 600,
            color: active ? "var(--k-accent)" : "var(--k-t3)",
            background: active ? "rgba(200,255,45,0.10)" : "transparent",
            padding: "1px 6px",
            borderRadius: 999,
            letterSpacing: "0.04em",
            border: active
              ? "1px solid rgba(200,255,45,0.20)"
              : "1px solid var(--k-line)",
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
      )}
    </>
  );

  const style: React.CSSProperties = {
    height: collapsed ? 38 : 34,
    padding: collapsed ? 0 : "0 12px",
    display: "flex",
    alignItems: "center",
    gap: 11,
    background: active ? "var(--k-elevated)" : "transparent",
    color: active ? "var(--k-t1)" : "var(--k-t2)",
    cursor: "pointer",
    margin: "0 10px 1px",
    borderRadius: 7,
    position: "relative",
    textDecoration: "none",
    justifyContent: collapsed ? "center" : "flex-start",
  };

  if (item.href) {
    return (
      <Link
        href={item.href}
        className="k-nav-item k-tap"
        data-active={active ? "1" : "0"}
        title={collapsed ? item.label : ""}
        style={style}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={item.onClick}
      className="k-nav-item k-tap"
      data-active={active ? "1" : "0"}
      title={collapsed ? item.label : ""}
      style={{ ...style, border: "none", width: "100%" }}
    >
      {content}
    </button>
  );
}

function SignOutNavItem({ collapsed }: { collapsed: boolean }) {
  const [isPending, startTransition] = useTransition();
  const handleClick = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/login" });
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="k-nav-item k-tap"
      data-active="0"
      title={collapsed ? "Cerrar sesión" : ""}
      style={{
        height: collapsed ? 38 : 34,
        padding: collapsed ? 0 : "0 12px",
        display: "flex",
        alignItems: "center",
        gap: 11,
        background: "transparent",
        color: "var(--k-t2)",
        cursor: "pointer",
        margin: "0 10px 1px",
        borderRadius: 7,
        position: "relative",
        textDecoration: "none",
        justifyContent: collapsed ? "center" : "flex-start",
        border: "none",
        width: "100%",
      }}
    >
      <Icon.Logout
        width={16}
        height={16}
        style={{ flexShrink: 0, color: "var(--k-t3)" }}
      />
      {!collapsed && (
        <span
          style={{
            flex: 1,
            fontFamily: "var(--k-font-body)",
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: "-0.005em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            textAlign: "left",
          }}
        >
          {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
        </span>
      )}
    </button>
  );
}

function NavGroup({
  section,
  collapsed,
  children,
}: {
  section: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      {!collapsed && (
        <div
          style={{
            padding: "8px 22px 4px",
            fontFamily: "var(--k-font-display)",
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: "0.24em",
            color: "var(--k-t4)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {section}
          <span
            style={{ flex: 1, height: 1, background: "var(--k-elevated)" }}
          />
        </div>
      )}
      {collapsed && (
        <div
          style={{
            height: 1,
            margin: "8px 16px 4px",
            background: "var(--k-elevated)",
          }}
        />
      )}
      {children}
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
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("kronos-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("kronos-sidebar-collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

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

  const visibleGroups = groups
    .map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.ownerOnly || role === "OWNER"),
    }))
    .filter((g) => g.items.length > 0);

  const sidebarWidth = collapsed ? 64 : 228;

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
          height: "calc(56px + env(safe-area-inset-top))",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "env(safe-area-inset-top) 16px 0 16px",
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--k-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <KronosLogo size={26} glow={false} />
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
        style={{
          height: "calc(56px + env(safe-area-inset-top))",
          flexShrink: 0,
        }}
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
        className={`k-sidebar ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: sidebarWidth,
          background: "#0B0B0E",
          borderRight: "1px solid var(--k-line)",
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 50,
          overflow: "hidden",
          transition:
            "width 220ms cubic-bezier(0.4,0,0.2,1), transform 0.3s ease",
        }}
      >
        <KronosMark collapsed={collapsed} onToggle={toggleCollapsed} />
        <BoxCard collapsed={collapsed} />
        <div
          className="k-scroll"
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingTop: 2,
            paddingBottom: 8,
          }}
        >
          {visibleGroups.map((g) => (
            <NavGroup key={g.title} section={g.title} collapsed={collapsed}>
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
                    ? sensitiveCount > 99
                      ? "99+"
                      : sensitiveCount
                    : undefined;
                return (
                  <NavItem
                    key={hrefStr}
                    item={{ label: it.label, icon: it.icon, href: it.href }}
                    active={isActive}
                    collapsed={collapsed}
                    badge={badgeValue}
                  />
                );
              })}
            </NavGroup>
          ))}
        </div>
        <LiveStrip collapsed={collapsed} />
        <div
          style={{
            borderTop: "1px solid var(--k-line)",
            padding: "6px 0 10px",
            background: "#0B0B0E",
            flexShrink: 0,
          }}
        >
          {footerItems.map((it) => {
            const isActive = pathname === it.href;
            return (
              <NavItem
                key={it.label}
                item={{ label: it.label, icon: it.icon, href: it.href }}
                active={isActive}
                collapsed={collapsed}
              />
            );
          })}
          <SignOutNavItem collapsed={collapsed} />
        </div>
      </nav>

      {/* Static placeholder for layout flow on desktop */}
      <div
        className="hidden lg:block"
        style={{
          width: sidebarWidth,
          flexShrink: 0,
          transition: "width 220ms cubic-bezier(0.4,0,0.2,1)",
        }}
        aria-hidden
      />
    </>
  );
}
