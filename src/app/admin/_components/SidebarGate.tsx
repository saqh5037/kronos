"use client";

import { usePathname } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

/**
 * Renderiza el AdminSidebar legacy SALVO en `/admin` (que ya tiene su propia
 * sidebar v3 dentro del componente AdminDashboardV3).
 */
export function SidebarGate({
  sensitiveCount,
  role,
}: {
  sensitiveCount: number;
  role: string | undefined;
}) {
  const pathname = usePathname();
  // Exclude exact `/admin` (dashboard v3 ya trae sidebar)
  if (pathname === "/admin") return null;
  return <AdminSidebar sensitiveCount={sensitiveCount} role={role} />;
}
