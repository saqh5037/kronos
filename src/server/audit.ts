/**
 * Audit log helper — best-effort write, never throws to caller.
 * Each mutation server action calls logAudit() AFTER its main work succeeds.
 * After a successful audit write, evaluates AlertRules for the tenant+action.
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

    // Evaluate alert rules after successful audit write.
    // Imported dynamically to avoid circular deps — alerts.ts is "use server".
    try {
      const { evaluateAndDispatch } = await import("./actions/alerts");
      await evaluateAndDispatch(payload);
    } catch (alertErr) {
      // Alert failures must never break the audit write.
      console.error("[audit] alert dispatch failed:", alertErr);
    }
  } catch (err) {
    // Audit failures must never break the main operation.
    console.error("[audit] failed to log event:", err);
  }
}
