"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { m } from "framer-motion";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Home,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";

/**
 * P2 — every tab drew its own inline `<svg>` path. The bottom nav is the one
 * surface an athlete sees on every screen, so five hand-rolled glyphs were five
 * chances to drift from the icon system (CLAUDE.md house rule 1: lucide-react).
 *
 * The swap is deliberately like-for-like: same 22 px box, same 1.8 / 2.4 stroke
 * pair, same meaning per tab (house → Home, calendar → CalendarDays, star →
 * Star, pulse line → Activity, barbell → Dumbbell, bust → User), so the visual
 * weight at 360 px is unchanged.
 */
const ICON_SIZE = 22;
const STROKE_IDLE = 1.8;
const STROKE_ACTIVE = 2.4;

type Tab = {
  href: string;
  label: string;
  /** Oculto cuando el atleta está en Box Personal (sin coach/clases). */
  hideForPersonal?: boolean;
  /** Oculto siempre del bottom nav (la ruta sigue accesible por URL). */
  hideAlways?: boolean;
  Icon: LucideIcon;
};

const allTabs: Tab[] = [
  { href: "/atleta", label: "Inicio", Icon: Home },
  {
    href: "/atleta/reservar",
    label: "Reservar",
    hideForPersonal: true,
    Icon: CalendarDays,
  },
  { href: "/atleta/skills", label: "Skills", Icon: Star },
  { href: "/atleta/salud", label: "Salud", Icon: Activity },
  { href: "/atleta/wod", label: "WOD", Icon: Dumbbell },
  { href: "/atleta/perfil", label: "Yo", Icon: User },
];

type TabBarProps = {
  /** "personal" oculta tabs marcados con hideForPersonal (ej: Reservar). */
  mode?: "personal" | "box";
  /** Muestra un dot titilante en la tab "Yo" cuando hay notificaciones del coach. */
  yoBadge?: boolean;
};

export default function TabBar({ mode = "box", yoBadge = false }: TabBarProps) {
  const pathname = usePathname();
  const tabs = allTabs.filter(
    (t) => !t.hideAlways && !(mode === "personal" && t.hideForPersonal),
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
          const showBadge = tab.label === "Yo" && yoBadge && !isActive;
          return (
            <Link
              key={tab.href}
              href={tab.href as Route}
              aria-current={isActive ? "page" : undefined}
              aria-label={tab.label}
              className="relative flex-1 flex flex-col items-center justify-center gap-[5px]"
              style={{
                color: isActive ? "var(--k-accent)" : "var(--k-t3)",
                textDecoration: "none",
                minWidth: 0,
              }}
            >
              <m.span
                animate={isActive ? { scale: 1.05 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative"
              >
                <tab.Icon
                  size={ICON_SIZE}
                  strokeWidth={isActive ? STROKE_ACTIVE : STROKE_IDLE}
                  aria-hidden
                />
                {showBadge && (
                  <span
                    style={{
                      position: "absolute",
                      top: -2,
                      right: -2,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      background: "var(--k-accent)",
                      boxShadow: "0 0 6px rgba(200,255,45,0.6)",
                      animation: "k-badge-pulse 1.5s ease-in-out infinite",
                    }}
                  />
                )}
              </m.span>
              <span
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
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
