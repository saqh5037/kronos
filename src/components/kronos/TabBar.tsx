"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

const tabs = [
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
    href: "/atleta/perfil",
    label: "Atleta",
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

export default function TabBar() {
  const pathname = usePathname();

  const activeIndex = tabs.findIndex((tab) => {
    if (tab.href === "/atleta") return pathname === tab.href;
    return pathname.startsWith(tab.href);
  });

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t"
      style={{
        background: "color-mix(in srgb, var(--bg-soft) 80%, transparent)",
        borderColor: "var(--line)",
        backdropFilter: "blur(28px) saturate(1.4)",
        WebkitBackdropFilter: "blur(28px) saturate(1.4)",
      }}
    >
      <div className="flex items-center h-16 px-2">
        {tabs.map((tab, i) => {
          const isActive = i === activeIndex;
          return (
            <Link
              key={tab.href}
              href={tab.href as Route}
              className="relative flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition-colors"
              style={{
                color: isActive ? "var(--text)" : "var(--text-3)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute -top-px left-1/2 -translate-x-1/2 h-[2.5px] rounded-full"
                  style={{
                    width: 24,
                    background: "var(--grad)",
                    boxShadow:
                      "0 0 10px rgba(230, 0, 38, 0.35), 0 0 20px rgba(0, 68, 255, 0.15)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <motion.span
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {tab.icon(isActive)}
              </motion.span>
              <span className="font-medium tracking-wide">{tab.label}</span>
            </Link>
          );
        })}
        {/* Theme toggle */}
        <div className="flex items-center justify-center px-1">
          <ThemeToggle className="!p-2 !rounded-full !w-9 !h-9" />
        </div>
      </div>
    </div>
  );
}
