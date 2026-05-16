/**
 * Super-admin gate — autoriza endpoints/UI internos (Samuel + ops).
 *
 * **Diseño email-based (no role en schema):** evita migration. La lista
 * autorizada vive en env `SUPER_ADMIN_EMAILS` (comma-separated). Cambio
 * de personal = update var de env + reload, no migration.
 *
 * Cuándo NO usar esto:
 * - Roles regulares de tenant (OWNER/COACH/STAFF/ATHLETE) → usar
 *   middleware existente con role check.
 * - Permisos finos por feature → tabla Permission existente.
 *
 * Cuándo SÍ usar esto:
 * - Páginas `/admin/super/*` (cross-tenant, gestión de pilotos, debug)
 * - Server actions que pueden afectar múltiples tenants
 * - Dashboards de métricas globales
 */

function parseSuperAdminEmails(): ReadonlySet<string> {
  const raw = process.env.SUPER_ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0),
  );
}

/**
 * @param email del session.user. Case-insensitive.
 * @returns true si el email está en SUPER_ADMIN_EMAILS.
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const authorized = parseSuperAdminEmails();
  return authorized.has(email.toLowerCase());
}

/**
 * @returns lista de emails autorizados (sin orden garantizado).
 *   Útil para debug / UI "quién tiene acceso".
 */
export function listSuperAdmins(): string[] {
  return Array.from(parseSuperAdminEmails());
}
