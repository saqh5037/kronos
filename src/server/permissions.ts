/**
 * RBAC parametrizable — helper can()
 *
 * OWNER siempre tiene acceso a todo.
 * Otros roles consultan la tabla Permission del tenant.
 * Cachea por request usando un Map keyed by tenantId+action.
 */

import { db as rawDb } from "./db";
import type { PermissionAction, Role } from "@prisma/client";
import type { Session } from "next-auth";

export type { PermissionAction };

export type CanResult = {
  allowed: boolean;
  requiresApproval: boolean;
};

// Request-scoped cache: evita múltiples queries a Permission en el mismo request
const requestCache = new Map<string, CanResult>();

/**
 * Checks if the current session user can perform the given action.
 *
 * OWNER → always allowed, never requiresApproval.
 * Other roles → query Permission table for this tenant+action.
 * If no Permission row found → deny (safe default).
 */
export async function can(
  action: PermissionAction,
  session: Session,
): Promise<CanResult> {
  const role = session.user.role as Role;
  const tenantId = session.user.tenantId;

  // OWNER always allowed — no DB hit needed
  if (role === "OWNER") {
    return { allowed: true, requiresApproval: false };
  }

  const cacheKey = `${tenantId}::${action}`;
  const cached = requestCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const permission = await rawDb.permission.findUnique({
    where: { tenantId_action: { tenantId, action } },
    select: {
      allowedRoles: true,
      requiresOwnerApproval: true,
      threshold: true,
    },
  });

  let result: CanResult;

  if (!permission) {
    // No Permission row → deny by default (secure)
    result = { allowed: false, requiresApproval: false };
  } else {
    const roleAllowed = (permission.allowedRoles as Role[]).includes(role);
    result = {
      allowed: roleAllowed,
      requiresApproval: roleAllowed && permission.requiresOwnerApproval,
    };
  }

  requestCache.set(cacheKey, result);
  return result;
}

/**
 * Clear the request-scoped cache.
 * Call this at the start of each server action if needed for isolation.
 */
export function clearPermissionCache(): void {
  requestCache.clear();
}

/**
 * Creates a PermissionGrantRequest when a non-OWNER tries to perform
 * an action that requiresOwnerApproval.
 */
export async function createGrantRequest(opts: {
  tenantId: string;
  requesterId: string;
  action: PermissionAction;
  targetType: string;
  targetId: string;
  payload: Record<string, unknown>;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  const req = await rawDb.permissionGrantRequest.create({
    data: {
      tenantId: opts.tenantId,
      requesterId: opts.requesterId,
      action: opts.action,
      targetType: opts.targetType,
      targetId: opts.targetId,
      payload: opts.payload as object,
      status: "PENDING",
      expiresAt,
    },
  });

  return req.id;
}
