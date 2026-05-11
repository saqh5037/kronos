"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

const EXTRA_LINKS = [
  { href: "/atleta/historial" as Route, label: "Historial", icon: "📊" },
  { href: "/atleta/leaderboard" as Route, label: "Leaderboard", icon: "🏆" },
  { href: "/atleta/pagos" as Route, label: "Mis pagos", icon: "💳" },
  { href: "/atleta/perfil" as Route, label: "Perfil completo", icon: "👤" },
];

export default function AthleteDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        aria-label="Menú"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 35,
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid var(--k-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-t1)",
          cursor: "pointer",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 45,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          zIndex: 50,
          background: "var(--k-surface)",
          borderRight: "1px solid var(--k-line)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          padding: "20px 16px",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "var(--k-accent)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          Más opciones
        </div>
        {EXTRA_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--k-bg)",
              border: "1px solid var(--k-line)",
              textDecoration: "none",
              color: "var(--k-t1)",
              fontFamily: "var(--k-font-body)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 18 }}>{link.icon}</span>
            {link.label}
          </Link>
        ))}

        <div style={{ marginTop: "auto" }}>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              textDecoration: "none",
              color: "var(--k-t3)",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Landing pública
          </Link>
        </div>
      </div>
    </>
  );
}
