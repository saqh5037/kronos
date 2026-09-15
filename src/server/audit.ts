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

/**
 * Payment rows are written with a `membershipId` and an amount, so the audit
 * feed could only ever say "Cobro en efectivo · $2,500 MXN" — the owner had to
 * open the payment to learn WHOSE it was (audit 2026-09-15, S7).
 *
 * Names are resolved once, here, at write time, because the audit log is an
 * immutable record of what was true then: a plan renamed next month must not
 * rewrite last month's history. Resolving from `targetId` rather than from
 * `metadata.membershipId` covers every writer — the cash register, the Mercado
 * Pago checkout, the webhook that confirms or fails it, and a void — since all
 * of them target the `Payment` row.
 *
 * Best-effort like the rest of this module: a failed lookup logs the event
 * without names rather than losing the event.
 */
async function withPaymentSubject(
  payload: AuditPayload,
): Promise<Record<string, unknown> | undefined> {
  const metadata = payload.metadata;
  if (payload.targetType !== "Payment") return metadata;
  if (metadata?.athleteName && metadata?.planName) return metadata;

  try {
    const payment = await rawDb.payment.findFirst({
      where: { id: payload.targetId, tenantId: payload.tenantId },
      select: {
        membership: {
          select: {
            athlete: { select: { firstName: true, lastName: true } },
            plan: { select: { name: true } },
          },
        },
      },
    });

    const athlete = payment?.membership?.athlete;
    const planName = payment?.membership?.plan?.name;
    if (!athlete && !planName) return metadata;

    return {
      ...(metadata ?? {}),
      ...(athlete
        ? { athleteName: `${athlete.firstName} ${athlete.lastName}` }
        : {}),
      ...(planName ? { planName } : {}),
    };
  } catch (err) {
    console.error("[audit] could not resolve payment subject:", err);
    return metadata;
  }
}

export async function logAudit(payload: AuditPayload): Promise<void> {
  try {
    const metadata = await withPaymentSubject(payload);

    await rawDb.auditEvent.create({
      data: {
        tenantId: payload.tenantId,
        actorId: payload.actorId,
        action: payload.action,
        targetType: payload.targetType,
        targetId: payload.targetId,
        metadata: metadata ? (metadata as object) : undefined,
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
