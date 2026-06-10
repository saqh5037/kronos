"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useState, useEffect, useId } from "react";
import { Icon } from "./icons";

type LinkHref = ComponentProps<typeof Link>["href"];

const ACC = "var(--k-accent)";
const WARN = "var(--k-warning)";
const DANGER = "var(--k-danger)";

export type NavBadge = string | number | undefined;
export type AlertSeverity = "warning" | "danger";

export type ClassRowData = {
  hora: string;
  clase: string;
  coach: string;
  taken: number;
  capacity: number;
  waitlist: number;
  action: string;
};

export type AlertRowData = {
  severity: AlertSeverity;
  text: string;
  cta: string;
  href?: LinkHref;
};

export type AdminDashboardV3Props = {
  boxName: string;
  boxLocation?: string;
  boxInitials?: string;
  ownerName: string;
  ownerFirstName?: string;
  ownerInitial?: string;
  ownerRole?: string;
  rangeLabel: string;
  greeting: string;
  dateLabel: string;
  // KPI hero
  mrr: string;
  mrrDelta?: string;
  mrrDeltaAbs?: string;
  mrrSpark: number[];
  activeAthletes: string;
  arpu: string;
  churn30d: string;
  // Secondary KPIs
  attendanceToday: { taken: number; capacity: number; pct: number };
  classesProgrammed: number;
  classesWithWaitlist: number;
  newAthletes30d: number;
  newAthletesDelta?: string;
  newAthletesBreakdown?: string;
  atRiskCount: number;
  atRiskTotal: number;
  atRiskNote?: string;
  // Charts
  revenueChart: { data: number[]; total: string; delta?: string };
  attendanceChart: { data: number[]; total: string; delta?: string };
  // Tables
  nextClasses: ClassRowData[];
  alerts: AlertRowData[];
  // Counts
  classesTodayLabel: string;
};

function Sparkline({
  data,
  w = 180,
  h = 44,
  stroke = "var(--k-accent)",
  strokeW = 1.75,
  fill = true,
}: {
  data: number[];
  w?: number;
  h?: number;
  stroke?: string;
  strokeW?: number;
  fill?: boolean;
}) {
  const gradientId = useId();
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map(
    (v, i) =>
      `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`,
  );
  const path = "M" + pts.join(" L");
  const area = path + ` L${w},${h} L0,${h} Z`;
  const id = `spark-grad-${gradientId}`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={stroke} stopOpacity="0.18" />
              <stop offset="1" stopColor={stroke} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${id})`} />
        </>
      )}
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
        style={{ position: "absolute", inset: 0, color: ACC }}
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

function KronosMark({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: collapsed ? "24px 0" : "24px 24px",
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      <KronosLogo size={30} />
      {!collapsed && (
        <div
          style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}
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
      )}
    </div>
  );
}

function NavItem({
  href,
  icon: Ic,
  label,
  active,
  collapsed,
  badge,
}: {
  href: LinkHref;
  icon: (p: {
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
  }) => React.ReactNode;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  badge?: NavBadge;
}) {
  return (
    <Link
      href={href}
      className="k-nav-item k-tap"
      data-active={active ? "1" : "0"}
      style={{
        height: 38,
        padding: collapsed ? 0 : "0 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: active ? "var(--k-elevated)" : "transparent",
        color: active ? "var(--k-t1)" : "var(--k-t2)",
        cursor: "pointer",
        margin: "0 12px",
        borderRadius: 8,
        position: "relative",
        justifyContent: collapsed ? "center" : "flex-start",
        textDecoration: "none",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: -12,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
            borderRadius: "0 2px 2px 0",
            background: ACC,
            boxShadow: "0 0 10px rgba(200,255,45,0.6)",
          }}
        />
      )}
      <Ic
        width={16}
        height={16}
        style={{ flexShrink: 0, color: active ? ACC : "var(--k-t3)" }}
      />
      {!collapsed && (
        <>
          <span
            style={{
              flex: 1,
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: active ? 600 : 500,
              letterSpacing: "-0.005em",
            }}
          >
            {label}
          </span>
          {badge !== undefined && badge !== null && badge !== "" && (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 600,
                color: ACC,
                background: "var(--k-accent-soft)",
                padding: "1px 6px",
                borderRadius: 999,
                letterSpacing: "0.04em",
              }}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </Link>
  );
}

function NavGroup({
  title,
  collapsed,
  children,
}: {
  title: string;
  collapsed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {!collapsed && (
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
          {title}
        </div>
      )}
      {collapsed && (
        <div
          style={{ height: 1, margin: "8px 16px", background: "var(--k-line)" }}
        />
      )}
      {children}
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
          background: ACC,
          boxShadow: `0 0 8px ${ACC}`,
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
          color: ACC,
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
          background: ACC,
          boxShadow: `0 0 8px ${ACC}`,
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
              color: ACC,
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
            {time}
          </span>
        </>
      )}
    </div>
  );
}

function Sidebar({
  collapsed = false,
  athletesBadge,
  reservasBadge,
}: {
  collapsed?: boolean;
  athletesBadge?: NavBadge;
  reservasBadge?: NavBadge;
}) {
  return (
    <div
      style={{
        width: collapsed ? 64 : 240,
        background: "var(--k-surface)",
        borderRight: "1px solid var(--k-line)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        position: "relative",
        flexShrink: 0,
      }}
    >
      <KronosMark collapsed={collapsed} />
      <BoxCard collapsed={collapsed} />
      <div
        className="k-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          paddingTop: 6,
          paddingBottom: 8,
        }}
      >
        <NavGroup title="PRINCIPAL" collapsed={collapsed}>
          <NavItem
            href="/admin"
            icon={Icon.Dashboard}
            label="Dashboard"
            active
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/atletas"
            icon={Icon.Users}
            label="Atletas"
            collapsed={collapsed}
            badge={athletesBadge}
          />
          <NavItem
            href="/admin/programacion"
            icon={Icon.Pin}
            label="Programación"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/reservas"
            icon={Icon.Calendar}
            label="Reservas"
            collapsed={collapsed}
            badge={reservasBadge}
          />
        </NavGroup>
        <NavGroup title="ENTRENAMIENTO" collapsed={collapsed}>
          <NavItem
            href="/admin/wods"
            icon={Icon.Bolt}
            label="WODs"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/movimientos"
            icon={Icon.Dumbbell}
            label="Movimientos"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/prs"
            icon={Icon.Trophy}
            label="PRs"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/leaderboards"
            icon={Icon.Bars}
            label="Leaderboards"
            collapsed={collapsed}
          />
        </NavGroup>
        <NavGroup title="GESTIÓN" collapsed={collapsed}>
          <NavItem
            href="/admin/asistencia"
            icon={Icon.Check}
            label="Asistencia"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/pagos"
            icon={Icon.Card}
            label="Pagos"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/comunicaciones"
            icon={Icon.Mail}
            label="Comunicaciones"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/reportes"
            icon={Icon.Chart}
            label="Reportes"
            collapsed={collapsed}
          />
        </NavGroup>
        <NavGroup title="CONFIG" collapsed={collapsed}>
          <NavItem
            href="/admin/ajustes"
            icon={Icon.Settings}
            label="Ajustes del Box"
            collapsed={collapsed}
          />
          <NavItem
            href="/admin/auditoria"
            icon={Icon.History}
            label="Auditoría"
            collapsed={collapsed}
          />
        </NavGroup>
      </div>
      <LiveStrip collapsed={collapsed} />
      <div
        style={{
          borderTop: "1px solid var(--k-line)",
          padding: "6px 0 10px",
          background: "var(--k-surface)",
        }}
      >
        <NavItem
          href="/atleta"
          icon={Icon.Phone}
          label="App del atleta"
          collapsed={collapsed}
        />
        <NavItem
          href="/"
          icon={Icon.Globe}
          label="Landing pública"
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

function AdminHeader({
  boxName,
  boxLocation,
  boxInitials,
  ownerInitial,
}: {
  boxName: string;
  boxLocation?: string;
  boxInitials?: string;
  ownerInitial?: string;
}) {
  return (
    <div
      style={{
        height: 64,
        borderBottom: "1px solid var(--k-line)",
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 24,
        background: "rgba(8,8,10,0.6)",
        backdropFilter: "blur(8px)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 14px",
          border: "1px solid var(--k-line)",
          borderRadius: 8,
          cursor: "pointer",
          background: "var(--k-surface)",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            border: `1.5px solid ${ACC}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--k-font-body)",
            fontSize: 9,
            fontWeight: 800,
            color: ACC,
            letterSpacing: "-0.02em",
          }}
        >
          {boxInitials ?? boxName.slice(0, 2).toUpperCase()}
        </div>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-t1)",
            letterSpacing: "-0.01em",
          }}
        >
          {boxName.toUpperCase()}
          {boxLocation ? ` · ${boxLocation.toUpperCase()}` : ""}
        </span>
        <Icon.Down
          width={14}
          height={14}
          style={{ color: "var(--k-t3)", marginLeft: 2 }}
        />
      </div>

      <div
        style={{
          flex: 1,
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 14px",
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 8,
          cursor: "text",
        }}
      >
        <Icon.Search width={15} height={15} style={{ color: "var(--k-t3)" }} />
        <span
          style={{
            flex: 1,
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            color: "var(--k-t3)",
          }}
        >
          Buscar atletas, clases, pagos…
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            color: "var(--k-t3)",
            padding: "2px 6px",
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            borderRadius: 4,
            letterSpacing: "0.06em",
          }}
        >
          ⌘ K
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.Bell width={16} height={16} style={{ color: "var(--k-t2)" }} />
          <span
            style={{
              position: "absolute",
              top: 8,
              right: 9,
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ACC,
              boxShadow: `0 0 8px ${ACC}`,
            }}
          />
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.Theme width={15} height={15} style={{ color: "var(--k-t2)" }} />
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--k-line)",
            border: "1px solid var(--k-line-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--k-t1)",
            cursor: "pointer",
          }}
        >
          {ownerInitial ?? "C"}
        </div>
      </div>
    </div>
  );
}

function Headline({
  greeting,
  boxName,
  dateLabel,
  rangeLabel,
}: {
  greeting: string;
  boxName: string;
  dateLabel: string;
  rangeLabel: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
          }}
        >
          DASHBOARD · HOY
        </span>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "var(--k-t1)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {greeting}
        </h1>
        <span
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t2)",
            letterSpacing: "-0.005em",
          }}
        >
          Esto es lo que pasa en{" "}
          <span style={{ color: "var(--k-t1)", fontWeight: 500 }}>
            {boxName}
          </span>{" "}
          · {dateLabel}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "var(--k-t1)",
            }}
          >
            {rangeLabel}
          </span>
          <Icon.Down width={13} height={13} style={{ color: "var(--k-t3)" }} />
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <Icon.Download
            width={15}
            height={15}
            style={{ color: "var(--k-t2)" }}
          />
        </div>
      </div>
    </div>
  );
}

function KpiHero(props: AdminDashboardV3Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 20,
      }}
      className="k-kpi-hero"
    >
      <div
        className="k-grain"
        style={{
          padding: 32,
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 20,
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ACC,
              boxShadow: `0 0 10px ${ACC}`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.2em",
              color: ACC,
            }}
          >
            MRR · INGRESO MENSUAL
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            lineHeight: 0.9,
          }}
        >
          <span
            className="k-mono"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: "-0.05em",
              color: ACC,
            }}
          >
            {props.mrr}
          </span>
        </div>
        {(props.mrrDelta || props.mrrDeltaAbs) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: -4,
              flexWrap: "wrap",
            }}
          >
            {props.mrrDelta && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: ACC,
                }}
              >
                <Icon.Up width={13} height={13} />
                {props.mrrDelta}
              </span>
            )}
            {props.mrrDeltaAbs && (
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--k-t2)",
                }}
              >
                · {props.mrrDeltaAbs}
              </span>
            )}
          </div>
        )}
        {props.mrrSpark.length >= 2 && (
          <div style={{ margin: "4px -8px 0" }}>
            <Sparkline data={props.mrrSpark} w={490} h={64} strokeW={2} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 18,
            borderTop: "1px solid var(--k-line)",
            marginTop: "auto",
          }}
        >
          {[
            { label: "ATLETAS ACTIVOS", value: props.activeAthletes },
            { label: "ARPU", value: props.arpu },
            { label: "CHURN · 30D", value: props.churn30d },
          ].map((m) => (
            <div key={m.label}>
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  color: "var(--k-t3)",
                  marginBottom: 5,
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--k-t1)",
                  fontFeatureSettings: '"tnum" 1',
                }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          className="k-grain"
          style={{
            flex: 1,
            padding: "20px 24px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "var(--k-t3)",
            }}
          >
            ASISTENCIAS HOY
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--k-t1)",
                lineHeight: 1,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {props.attendanceToday.taken}
              <span style={{ color: "var(--k-t3)" }}>
                {" "}
                / {props.attendanceToday.capacity}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 600,
                color: ACC,
                background: "var(--k-accent-soft)",
                padding: "3px 8px",
                borderRadius: 999,
                letterSpacing: "0.04em",
              }}
            >
              {props.attendanceToday.pct}%
            </span>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: "var(--k-elevated)",
              overflow: "hidden",
              marginTop: -2,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${props.attendanceToday.pct}%`,
                background: ACC,
                boxShadow: `0 0 8px ${ACC}`,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 11.5,
              color: "var(--k-t2)",
              lineHeight: 1.4,
            }}
          >
            {props.classesProgrammed} clases programadas ·{" "}
            <span style={{ color: "var(--k-t1)" }}>
              {props.classesWithWaitlist} con waitlist
            </span>
          </div>
        </div>

        <div
          className="k-grain"
          style={{
            flex: 1,
            padding: "20px 24px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "var(--k-t3)",
            }}
          >
            NUEVOS ATLETAS · 30D
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "var(--k-t1)",
                lineHeight: 1,
              }}
            >
              {props.newAthletes30d > 0 ? "+" : ""}
              {props.newAthletes30d}
            </span>
            {props.newAthletesDelta && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: ACC,
                }}
              >
                <Icon.Up width={11} height={11} />
                {props.newAthletesDelta}
              </span>
            )}
          </div>
          {props.newAthletesBreakdown && (
            <div
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 11.5,
                color: "var(--k-t2)",
                lineHeight: 1.4,
              }}
            >
              {props.newAthletesBreakdown}
            </div>
          )}
        </div>

        <Link
          href="/admin/atletas?at_risk=1"
          className="k-grain k-tap"
          style={{
            flex: 1,
            padding: "20px 24px",
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            position: "relative",
            overflow: "hidden",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.18em",
                color: "var(--k-t3)",
              }}
            >
              ATLETAS EN RIESGO
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontFamily: "var(--k-font-body)",
                fontSize: 12,
                fontWeight: 600,
                color: ACC,
                cursor: "pointer",
              }}
            >
              Ver lista <Icon.Right width={11} height={11} />
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: ACC,
                lineHeight: 1,
              }}
            >
              {props.atRiskCount}
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--k-t2)",
              }}
            >
              de {props.atRiskTotal} totales
            </span>
          </div>
          {props.atRiskNote && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "var(--k-font-body)",
                fontSize: 11.5,
                color: "var(--k-t2)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: WARN,
                }}
              />
              {props.atRiskNote}
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  eyebrow,
  value,
  delta,
  data,
  yLabels,
}: {
  title: string;
  eyebrow: string;
  value: string;
  delta?: string;
  data: number[];
  yLabels: string[];
}) {
  const w = 540;
  const h = 160;
  const pad = { l: 36, r: 8, t: 12, b: 24 };
  const min = 0;
  const max = Math.max(...data) * 1.1 || 1;
  const innerW = w - pad.l - pad.r;
  const innerH = h - pad.t - pad.b;
  const pts = data.map(
    (v, i) =>
      `${pad.l + (i / (data.length - 1 || 1)) * innerW},${
        pad.t + innerH - ((v - min) / (max - min || 1)) * innerH
      }`,
  );
  const path = "M" + pts.join(" L");
  const area =
    path +
    ` L${pad.l + innerW},${pad.t + innerH} L${pad.l},${pad.t + innerH} Z`;
  const id = title.replace(/\s/g, "-").toLowerCase();
  const xLabels = ["1 abr", "8", "15", "22", "29", "7 may"];
  const idx = Math.floor(data.length * 0.62);
  const tipX = pad.l + (idx / (data.length - 1 || 1)) * innerW;
  const tipY = pad.t + innerH - ((data[idx] - min) / (max - min || 1)) * innerH;

  return (
    <div
      className="k-grain"
      style={{
        padding: 24,
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
        height: 280,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "var(--k-t3)",
              marginBottom: 6,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-body)",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: "var(--k-t1)",
              }}
            >
              {title}
            </span>
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--k-t1)",
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {value}
            </span>
            {delta && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 600,
                  color: ACC,
                }}
              >
                <Icon.Up width={10} height={10} />
                {delta}
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 2,
            background: "var(--k-elevated)",
            borderRadius: 8,
          }}
        >
          {[
            { l: "1S", a: false },
            { l: "1M", a: true },
            { l: "3M", a: false },
            { l: "1A", a: false },
          ].map((t) => (
            <span
              key={t.l}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                color: t.a ? "var(--k-t1)" : "var(--k-t3)",
                background: t.a ? "var(--k-line)" : "transparent",
                padding: "5px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {t.l}
            </span>
          ))}
        </div>
      </div>

      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C8FF2D" stopOpacity="0.18" />
            <stop offset="1" stopColor="#C8FF2D" stopOpacity="0" />
          </linearGradient>
        </defs>
        {yLabels.map((lbl, i) => {
          const y = pad.t + innerH - (i / (yLabels.length - 1 || 1)) * innerH;
          return (
            <g key={i}>
              <line
                x1={pad.l}
                y1={y}
                x2={pad.l + innerW}
                y2={y}
                stroke="#14141A"
                strokeWidth="1"
                strokeDasharray={i === 0 ? "0" : "2 3"}
              />
              <text
                x={pad.l - 8}
                y={y + 3}
                fontFamily="var(--k-font-display)"
                fontSize="9"
                fill="#54545C"
                textAnchor="end"
                letterSpacing="0.06em"
              >
                {lbl}
              </text>
            </g>
          );
        })}
        {xLabels.map((lbl, i) => {
          const x = pad.l + (i / (xLabels.length - 1)) * innerW;
          return (
            <text
              key={i}
              x={x}
              y={h - 6}
              fontFamily="var(--k-font-display)"
              fontSize="9"
              fill="#54545C"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              {lbl}
            </text>
          );
        })}
        <path d={area} fill={`url(#g-${id})`} />
        <path
          d={path}
          fill="none"
          stroke="#C8FF2D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g>
          <line
            x1={tipX}
            y1={pad.t}
            x2={tipX}
            y2={pad.t + innerH}
            stroke="#26262E"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          <circle
            cx={tipX}
            cy={tipY}
            r="5"
            fill="#08080A"
            stroke="#C8FF2D"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
}

function ClassesTable({
  classes,
  classesTodayLabel,
}: {
  classes: ClassRowData[];
  classesTodayLabel: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "0 4px",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "var(--k-t3)",
            }}
          >
            PRÓXIMAS CLASES · HOY
          </div>
          <div
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 18,
              fontWeight: 600,
              color: "var(--k-t1)",
              letterSpacing: "-0.02em",
            }}
          >
            {classesTodayLabel}
          </div>
        </div>
        <Link
          href="/admin/programacion"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
            fontWeight: 600,
            color: ACC,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          Ver todas las clases <Icon.Right width={11} height={11} />
        </Link>
      </div>
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "72px 180px 140px 1fr 90px 110px",
            padding: "12px 16px",
            borderBottom: "1px solid var(--k-line)",
            background: "var(--k-bg)",
            gap: 16,
          }}
        >
          {["HORA", "CLASE", "COACH", "RESERVAS", "WAITLIST", "ACCIÓN"].map(
            (h, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  color: "var(--k-t4)",
                  textAlign: i === 5 ? "right" : "left",
                }}
              >
                {h}
              </span>
            ),
          )}
        </div>
        {classes.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              color: "var(--k-t3)",
            }}
          >
            Sin clases programadas para hoy.
          </div>
        ) : (
          classes.map((c, i) => {
            const pct = (c.taken / c.capacity) * 100;
            const full = c.taken === c.capacity;
            return (
              <div
                key={i}
                className="k-tap"
                style={{
                  display: "grid",
                  gridTemplateColumns: "72px 180px 140px 1fr 90px 110px",
                  alignItems: "center",
                  padding: "14px 16px",
                  borderBottom: "1px solid var(--k-elevated)",
                  cursor: "pointer",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--k-t1)",
                    fontFeatureSettings: '"tnum" 1',
                  }}
                >
                  {c.hora}
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--k-t1)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {c.clase}
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-body)",
                    fontSize: 12,
                    color: "var(--k-t2)",
                  }}
                >
                  {c.coach}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontFamily: "var(--k-font-display)",
                      fontSize: 12,
                      fontWeight: 600,
                      color: full ? ACC : "var(--k-t1)",
                      minWidth: 48,
                      fontFeatureSettings: '"tnum" 1',
                    }}
                  >
                    {c.taken} / {c.capacity}
                  </span>
                  <div
                    style={{
                      flex: 1,
                      maxWidth: 140,
                      height: 4,
                      background: "var(--k-elevated)",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: ACC,
                        boxShadow: full ? `0 0 8px ${ACC}` : "none",
                      }}
                    />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 600,
                    color: c.waitlist > 0 ? WARN : "var(--k-t4)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {c.waitlist > 0 ? `+${c.waitlist} wait` : "—"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    justifyContent: "flex-end",
                    fontFamily: "var(--k-font-body)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--k-t1)",
                  }}
                >
                  {c.action}{" "}
                  <Icon.Right
                    width={11}
                    height={11}
                    style={{ color: "var(--k-t3)" }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Alerts({ alerts }: { alerts: AlertRowData[] }) {
  if (alerts.length === 0) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            padding: "0 4px",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: ACC,
              display: "inline-block",
              transform: "translateY(-1px)",
              boxShadow: `0 0 8px ${ACC}`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: ACC,
            }}
          >
            TODO EN ORDEN
          </span>
        </div>
        <div
          style={{
            background: "var(--k-surface)",
            border: "1px solid var(--k-line)",
            borderRadius: 16,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <Icon.Check width={18} height={18} style={{ color: ACC }} />
          <span
            style={{
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              color: "var(--k-t2)",
            }}
          >
            Sin acciones pendientes ahora.
          </span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: WARN,
            boxShadow: `0 0 8px ${WARN}`,
            display: "inline-block",
            transform: "translateY(-1px)",
          }}
        />
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            color: WARN,
          }}
        >
          REQUIERE TU ATENCIÓN · {alerts.length}
        </span>
      </div>
      <div
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {alerts.map((a, i) => {
          const color = a.severity === "danger" ? DANGER : WARN;
          const Inner = (
            <div
              className="k-tap"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 18px",
                borderBottom:
                  i < alerts.length - 1
                    ? "1px solid var(--k-elevated)"
                    : "none",
                cursor: "pointer",
              }}
            >
              <Icon.Alert
                width={16}
                height={16}
                style={{ color, flexShrink: 0 }}
              />
              <div
                style={{
                  flex: 1,
                  fontFamily: "var(--k-font-body)",
                  fontSize: 13,
                  color: "var(--k-t1)",
                  letterSpacing: "-0.005em",
                }}
              >
                {a.text}
              </div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  fontWeight: 600,
                  color: ACC,
                }}
              >
                {a.cta} <Icon.Right width={11} height={11} />
              </span>
            </div>
          );
          return a.href ? (
            <Link
              key={i}
              href={a.href}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {Inner}
            </Link>
          ) : (
            <div key={i}>{Inner}</div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboardV3(props: AdminDashboardV3Props) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--k-bg)",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        color: "var(--k-t1)",
      }}
    >
      <Sidebar
        athletesBadge={props.activeAthletes}
        reservasBadge={props.attendanceToday.taken}
      />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <AdminHeader
          boxName={props.boxName}
          boxLocation={props.boxLocation}
          boxInitials={props.boxInitials}
          ownerInitial={props.ownerInitial}
        />
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 32px 64px" }}>
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 32,
            }}
          >
            <Headline
              greeting={props.greeting}
              boxName={props.boxName}
              dateLabel={props.dateLabel}
              rangeLabel={props.rangeLabel}
            />
            <KpiHero {...props} />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
              }}
              className="k-charts-row"
            >
              <ChartCard
                title="Revenue diario"
                eyebrow="INGRESO · ÚLTIMOS 30 DÍAS"
                value={props.revenueChart.total}
                delta={props.revenueChart.delta}
                data={props.revenueChart.data}
                yLabels={["$0", "$1.2K", "$2.4K"]}
              />
              <ChartCard
                title="Asistencia diaria"
                eyebrow="CHECK-INS · ÚLTIMOS 30 DÍAS"
                value={props.attendanceChart.total}
                delta={props.attendanceChart.delta}
                data={props.attendanceChart.data}
                yLabels={["0", "50", "100"]}
              />
            </div>
            <ClassesTable
              classes={props.nextClasses}
              classesTodayLabel={props.classesTodayLabel}
            />
            <Alerts alerts={props.alerts} />
          </div>
        </div>
      </div>
    </div>
  );
}
