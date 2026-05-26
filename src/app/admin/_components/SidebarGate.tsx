"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

/**
 * Renders AdminSidebar except on exact `/admin` (dashboard v3 brings its own).
 * Detects super-admin routes and switches the sidebar to "super" mode.
 */
export function SidebarGate({
  sensitiveCount,
  role,
}: {
  sensitiveCount: number;
  role: string | undefined;
}) {
  const pathname = usePathname();
  // Exclude exact `/admin` (dashboard v3 already includes sidebar)
  if (pathname === "/admin") return null;

  const mode = pathname.startsWith("/admin/super") ? "super" : "box";
  return (
    <AdminSidebar sensitiveCount={sensitiveCount} role={role} mode={mode} />
  );
}
