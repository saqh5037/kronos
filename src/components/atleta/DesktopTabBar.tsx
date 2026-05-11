"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const DESKTOP_TABS = [
  { href: "/atleta" as Route, label: "Inicio" },
  { href: "/atleta/reservar" as Route, label: "Reservar" },
  { href: "/atleta/skills" as Route, label: "Skills" },
  { href: "/atleta/salud" as Route, label: "Salud" },
  { href: "/atleta/wod" as Route, label: "WOD" },
  { href: "/atleta/perfil" as Route, label: "Yo" },
];

const DESKTOP_EXTRA = [
  { href: "/atleta/movimientos" as Route, label: "Movs" },
  { href: "/atleta/historial" as Route, label: "Historial" },
  { href: "/atleta/leaderboard" as Route, label: "Leaderboard" },
  { href: "/atleta/pagos" as Route, label: "Pagos" },
];

export default function DesktopTabBar({ mode }: { mode: "personal" | "box" }) {
  const pathname = usePathname();
  const tabs =
    mode === "personal"
      ? DESKTOP_TABS.filter((t) => t.href !== "/atleta/reservar")
      : DESKTOP_TABS;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: "rgba(8,8,10,0.92)",
        borderTop: "1px solid var(--k-line)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        padding: "8px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/atleta"
              ? pathname === "/atleta"
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: isActive ? "var(--k-elevated)" : "transparent",
                color: isActive ? "var(--k-accent)" : "var(--k-t3)",
                textDecoration: "none",
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 0.18s ease",
                border: isActive
                  ? "1px solid var(--k-accent-line)"
                  : "1px solid transparent",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--k-line)",
          margin: "0 12px",
        }}
      />
      <div style={{ display: "flex", gap: 4 }}>
        {DESKTOP_EXTRA.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: isActive ? "var(--k-elevated)" : "transparent",
                color: isActive ? "var(--k-accent)" : "var(--k-t3)",
                textDecoration: "none",
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                transition: "all 0.18s ease",
                border: isActive
                  ? "1px solid var(--k-accent-line)"
                  : "1px solid transparent",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
