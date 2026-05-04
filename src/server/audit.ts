/**
 * Audit log helper — best-effort write, never throws to caller.
 * Each mutation server action calls logAudit() AFTER its main work succeeds.
 */
import { db as rawDb } from "./db";
import type { AuditAction } from "@prisma/client";

export type AuditPayload = {
  tenantId: string;
  actorId: string | null;
  action: AuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
};

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    await rawDb.auditEvent.create({
      data: {
        tenantId: payload.tenantId,
        actorId: payload.actorId,
        action: payload.action,
        targetType: payload.targetType,
        targetId: payload.targetId,
        metadata: payload.metadata ? (payload.metadata as object) : undefined,
      },
    });
  } catch (err) {
    // Audit failures must never break the main operation.
    console.error("[audit] failed to log event:", err);
  }
}
