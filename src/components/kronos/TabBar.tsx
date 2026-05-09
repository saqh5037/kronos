"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

type Tab = {
  href: string;
  label: string;
  /** Oculto cuando el atleta está en Box Personal (sin coach/clases). */
  hideForPersonal?: boolean;
  icon: (active: boolean) => React.ReactNode;
};

const allTabs: Tab[] = [
  {
    href: "/atleta",
    label: "Inicio",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
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
    hideForPersonal: true,
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
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
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12" />
      </svg>
    ),
  },
  {
    href: "/atleta/logros",
    label: "Logros",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
        <path d="M7 6H4a2 2 0 0 0 0 4h3" />
        <path d="M17 6h3a2 2 0 0 1 0 4h-3" />
      </svg>
    ),
  },
  {
    href: "/atleta/perfil",
    label: "Yo",
    icon: (active: boolean) => (
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        fill="none"
        stroke="currentColor"
        strokeWidth={active ? 2.4 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
      </svg>
    ),
  },
];

type TabBarProps = {
  /** "personal" oculta tabs marcados con hideForPersonal (ej: Reservar). */
  mode?: "personal" | "box";
};

export default function TabBar({ mode = "box" }: TabBarProps) {
  const pathname = usePathname();
  const tabs = allTabs.filter(
    (t) => !(mode === "personal" && t.hideForPersonal),
  );

  const activeIndex = tabs.findIndex((tab) => {
    if (tab.href === "/atleta") return pathname === tab.href;
    return pathname.startsWith(tab.href);
  });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: "rgba(8,8,10,0.92)",
        borderTop: "1px solid var(--k-line)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        height: 84,
        paddingBottom: 24,
        paddingTop: 12,
      }}
    >
      <div className="flex items-stretch h-full px-1">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={tab.href}
              href={tab.href as Route}
              className="relative flex-1 flex flex-col items-center justify-center gap-[5px]"
              style={{
                color: isActive ? "var(--k-accent)" : "var(--k-t3)",
                textDecoration: "none",
              }}
            >
              <motion.span
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {tab.icon(isActive)}
              </motion.span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
