"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  { href: "/admin", label: "Dashboard", icon: "dashboard", exact: true },
  { href: "/admin/atletas", label: "Atletas", icon: "athletes" },
  { href: "/admin/programacion", label: "Programación", icon: "schedule" },
  { href: "/admin/reservas", label: "Reservas", icon: "bookings" },
  { href: "/admin/asistencia", label: "Asistencia", icon: "attendance" },
  { href: "/admin/wods", label: "WODs", icon: "wods" },
  { href: "/admin/prs", label: "PRs", icon: "prs" },
  { href: "/admin/leaderboards", label: "Leaderboards", icon: "leaderboards" },
  { href: "/admin/pagos", label: "Pagos", icon: "payments" },
  { href: "/admin/comunicaciones", label: "Comunicaciones", icon: "comms" },
  { href: "/admin/reportes", label: "Reportes", icon: "reports" },
  { href: "/admin/ajustes", label: "Ajustes", icon: "settings" },
];

function NavIcon({ icon, active }: { icon: string; active: boolean }) {
  const color = active ? "var(--recovery)" : "currentColor";
  const icons: Record<string, React.ReactNode> = {
    dashboard: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="1" width="6" height="6" rx="1" />
        <rect x="9" y="1" width="6" height="6" rx="1" />
        <rect x="1" y="9" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
    ),
    athletes: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="5" r="3" />
        <path d="M2 14c.8-3 3-5 6-5s5.2 2 6 5" />
      </svg>
    ),
    schedule: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="3" width="14" height="12" rx="1.5" />
        <path d="M1 7h14M5 1v4M11 1v4" />
      </svg>
    ),
    bookings: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 2h2.5A1.5 1.5 0 0 1 15 3.5v10A1.5 1.5 0 0 1 13.5 15h-11A1.5 1.5 0 0 1 1 13.5v-10A1.5 1.5 0 0 1 2.5 2H5" />
        <rect x="5" y="1" width="6" height="3" rx="1" />
        <path d="M5 9l2 2 4-4" />
      </svg>
    ),
    attendance: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M1 8a7 7 0 1 0 14 0A7 7 0 0 0 1 8z" />
        <path d="M5 8l2.5 2.5L11 5" />
      </svg>
    ),
    wods: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5v6M12 5v6M2 7v2M14 7v2M4 8h8" />
      </svg>
    ),
    prs: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 2l1.8 3.6L14 6.3l-3 2.9.7 4.1L8 11.3l-3.7 1.9.7-4.1L2 6.3l4.2-.7z" />
      </svg>
    ),
    leaderboards: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="9" width="4" height="6" rx="0.5" />
        <rect x="6" y="5" width="4" height="10" rx="0.5" />
        <rect x="11" y="1" width="4" height="14" rx="0.5" />
      </svg>
    ),
    payments: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="1" y="4" width="14" height="9" rx="1.5" />
        <path d="M1 7h14" />
        <path d="M4 10.5h2" />
      </svg>
    ),
    comms: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 10.67A2 2 0 0 1 12 12H5l-3 3V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6.67z" />
      </svg>
    ),
    reports: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 1h7l3 3v11H3z" />
        <path d="M10 1v3h3" />
        <path d="M5 8h6M5 11h4" />
      </svg>
    ),
    settings: (
      <svg
        viewBox="0 0 16 16"
        width="14"
        height="14"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="8" cy="8" r="2.5" />
        <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.1 3.1l1.4 1.4M11.5 11.5l1.4 1.4M3.1 12.9l1.4-1.4M11.5 4.5l1.4-1.4" />
      </svg>
    ),
  };
  return <>{icons[icon] ?? null}</>;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="w-56 flex flex-col border-r flex-shrink-0 py-4 overflow-y-auto"
      style={{ background: "var(--bg-soft)", borderColor: "var(--line)" }}
    >
      {/* Logo */}
      <div
        className="px-4 pb-4 mb-2 border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-display font-bold text-sm"
            style={{ background: "var(--grad)", color: "#0a1a14" }}
          >
            K
          </div>
          <span className="font-display font-bold text-sm tracking-tight">
            Kronos
          </span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex flex-col gap-0.5 px-2">
        {modules.map((mod) => {
          const isActive = mod.exact
            ? pathname === mod.href
            : pathname.startsWith(mod.href);

          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "text-white" : "text-white/50 hover:text-white/80"
              }`}
              style={isActive ? { background: "var(--card)" } : {}}
            >
              <NavIcon icon={mod.icon} active={isActive} />
              {mod.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
