"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";

const CRUMB_LABELS: Record<string, string> = {
  platform: "Plataforma",
  pilotos: "Pilotos",
  nuevo: "Nuevo piloto",
};

/**
 * Where am I, inside the platform. Super-admin looked exactly like box admin
 * (audit 2026-09-15, admin-management P1), so a team member could not tell
 * whether they were acting as Kronos or as one box.
 */
export function SuperBreadcrumbs() {
  const pathname = usePathname() ?? "";
  const segments = pathname
    .replace(/^\/admin\/super\/?/, "")
    .split("/")
    .filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav
      aria-label="Ruta"
      className="flex flex-wrap items-center gap-1 text-[11px]"
      style={{ color: "var(--k-t3)" }}
    >
      <Link href="/admin" className="hover:text-[var(--k-t1)]">
        Admin
      </Link>
      <ChevronRight size={12} strokeWidth={2.2} aria-hidden />
      <span>Plataforma Kronos</span>
      {segments.map((segment, i) => {
        const href = `/admin/super/${segments.slice(0, i + 1).join("/")}`;
        const isLast = i === segments.length - 1;
        return (
          <span key={href} className="flex items-center gap-1">
            <ChevronRight size={12} strokeWidth={2.2} aria-hidden />
            {isLast ? (
              <span style={{ color: "var(--k-t1)" }}>
                {CRUMB_LABELS[segment] ?? segment}
              </span>
            ) : (
              <Link href={href as Route} className="hover:text-[var(--k-t1)]">
                {CRUMB_LABELS[segment] ?? segment}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
