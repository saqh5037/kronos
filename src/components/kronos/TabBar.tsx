"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/atleta",
    label: "Inicio",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H10v7H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: "/atleta/reservar",
    label: "Reservar",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/atleta/wod",
    label: "WOD",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
      </svg>
    ),
  },
  {
    href: "/atleta/perfil",
    label: "Atleta",
    icon: (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
      </svg>
    ),
  },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 h-20 flex items-center px-3 border-t z-40"
        style={{
          background: "var(--bg)",
          borderColor: "var(--line)",
          paddingBottom: "8px",
        }}
      >
        {tabs.map((tab) => {
          const isActive =
            pathname === tab.href ||
            (tab.href !== "/atleta" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center gap-1.5 py-2 text-xs font-semibold transition-colors"
              style={{
                color: isActive ? "var(--text)" : "rgba(255,255,255,0.4)",
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
        {/* Spacer for FAB */}
        <div className="w-14" />
      </div>
      {/* FAB — K button */}
      <button
        className="fixed bottom-6 right-4 w-14 h-14 rounded-full flex items-center justify-center z-50 border-2 border-bg"
        style={{
          background: "var(--grad)",
          boxShadow: "0 0 28px rgba(58,163,255,0.35)",
        }}
        onClick={() => {}}
        aria-label="Acción rápida"
      >
        <span
          className="font-display font-bold text-xl"
          style={{ color: "#0a1a14" }}
        >
          K
        </span>
      </button>
    </>
  );
}
