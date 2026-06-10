/**
 * Query key factory for TanStack Query.
 *
 * All keys are prefixed with [tenantId, userId] to guarantee physical
 * isolation between tenants and between users on the same device.
 * Never call a fetcher without both identifiers in the key.
 */

export const queryKeys = {
  // Movement catalog — semi-static, shared across the tenant (no user data)
  movementCatalog: (tenantId: string, userId: string) =>
    [tenantId, userId, "movements", "catalog"] as const,

  // Badge / skill catalog — semi-static, unlocked state is user-specific
  badgeCatalog: (tenantId: string, userId: string) =>
    [tenantId, userId, "badges", "catalog"] as const,

  // WOD of the day — changes daily, short stale window
  todayWod: (tenantId: string, userId: string, date: string) =>
    [tenantId, userId, "wod", "today", date] as const,
} as const;
