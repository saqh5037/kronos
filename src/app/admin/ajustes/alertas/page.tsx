import { redirect } from "next/navigation";

export const metadata = { title: "Kronos — Avisos" };

/**
 * Alerts merged into Avisos (audit 2026-09-15, admin-management P1): they were
 * two tabs for one concept. The route stays alive and lands on the section.
 */
export default function AlertasRedirectPage() {
  redirect("/admin/ajustes/notificaciones#alertas");
}
