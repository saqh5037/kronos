"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

/**
 * `/admin` renders its own 240 px sidebar inside `AdminDashboardV3`, but
 * `globals.css` hides that one (`.k-admin-sidebar`) below 1023 px — which left
 * the dashboard with no navigation at all on a phone or tablet. So on `/admin`
 * we mount the responsive `AdminSidebar` only below `lg`, where the V3 one is
 * gone; every other admin route mounts it at all widths. Exactly one
 * navigation is visible at any viewport.
 */
export function SidebarGate({
  sensitiveCount,
  role,
}: {
  sensitiveCount: number;
  role: string | undefined;
}) {
  const pathname = usePathname();

  if (pathname === "/admin") {
    return (
      <div className="lg:hidden">
        <AdminSidebar sensitiveCount={sensitiveCount} role={role} />
      </div>
    );
  }

  return <AdminSidebar sensitiveCount={sensitiveCount} role={role} />;
}
