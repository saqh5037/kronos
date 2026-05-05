"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "../auth";
import { db as rawDb } from "../db";
import { sendEmail } from "@/lib/email";
import type { AuditPayload } from "../audit";
import type { AuditAction, AlertChannel } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertRuleRow = {
  id: string;
  action: AuditAction;
  channel: AlertChannel;
  threshold: number | null;
  enabled: boolean;
  recipientIds: string[];
  createdAt: Date;
  updatedAt: Date;
};

// ─── Dispatch ─────────────────────────────────────────────────────────────────

/**
 * Called from logAudit() after every successful audit event.
 * Evaluates all enabled AlertRules for this tenant+action.
 * Dispatches email if rule matches. Never throws — errors are logged only.
 */
export async function evaluateAndDispatch(event: AuditPayload): Promise<void> {
  try {
    const rules = await rawDb.alertRule.findMany({
      where: {
        tenantId: event.tenantId,
        action: event.action,
        enabled: true,
      },
    });

    if (rules.length === 0) return;

    const metadata = event.metadata ?? {};
    const eventAmount =
      typeof metadata.amount === "number" ? metadata.amount : null;
    const eventPercentage =
      typeof metadata.percentage === "number" ? metadata.percentage : null;

    for (const rule of rules) {
      const threshold = rule.threshold ? Number(rule.threshold) : null;

      // Evaluate threshold: if threshold set, compare against amount or percentage
      if (threshold !== null) {
        const compareValue = eventAmount ?? eventPercentage;
        if (compareValue === null || compareValue < threshold) continue;
      }

      await dispatchAlert(rule.id, event, rule.recipientIds, rule.channel);
    }
  } catch (err) {
    console.error("[alerts] evaluateAndDispatch failed:", err);
  }
}

async function dispatchAlert(
  ruleId: string,
  event: AuditPayload,
  recipientIds: string[],
  channel: AlertChannel,
): Promise<void> {
  try {
    if (recipientIds.length === 0) return;

    // Resolve recipient emails
    const users = await rawDb.user.findMany({
      where: { id: { in: recipientIds }, tenantId: event.tenantId },
      select: { email: true },
    });
    const emails = users.map((u) => u.email).filter(Boolean);
    if (emails.length === 0) return;

    const shouldEmail = channel === "EMAIL" || channel === "BOTH";
    const shouldInApp = channel === "IN_APP" || channel === "BOTH";

    if (shouldEmail && emails.length > 0) {
      const subject = `[Kronos] Alerta: ${humanizeAction(event.action)}`;
      const html = buildAlertEmail(event);
      await sendEmail({ to: emails, subject, html });
    }

    if (channel === "PUSH") {
      // TODO Sprint 3 — web-push integration
      console.log(
        `[alerts] PUSH dispatch not implemented yet (rule ${ruleId})`,
      );
    }

    if (shouldInApp) {
      // Send in-app notification to each recipient
      const { notify } = await import("./notifications");
      for (const userId of recipientIds) {
        await notify(userId, "ALERT", {
          title: `Alerta: ${humanizeAction(event.action)}`,
          body: buildAlertBody(event),
          link: "/admin/auditoria",
        });
      }
    }
  } catch (err) {
    console.error(`[alerts] dispatch failed for rule ${ruleId}:`, err);
  }
}

function humanizeAction(action: AuditAction): string {
  const map: Partial<Record<AuditAction, string>> = {
    PAYMENT_REGISTERED: "Pago registrado",
    PAYMENT_VOIDED: "Pago anulado",
    PAYMENT_INITIATED: "Checkout iniciado",
    PAYMENT_CONFIRMED: "Pago confirmado",
    PAYMENT_FAILED: "Pago fallido",
    MEMBERSHIP_ASSIGNED: "Membresía asignada",
    MEMBERSHIP_CANCELLED: "Membresía cancelada",
    MEMBERSHIP_PAUSED: "Membresía pausada",
    BOOKING_CREATED: "Reserva creada",
    BOOKING_CANCELLED: "Reserva cancelada",
    SCORE_SUBMITTED: "Score registrado",
    PR_ACHIEVED: "PR logrado",
    WHITEBOARD_UPLOADED: "Pizarra subida",
    BULK_SCORES_FROM_WHITEBOARD: "Scores cargados desde pizarra",
  };
  return map[action] ?? action;
}

function buildAlertBody(event: AuditPayload): string {
  const meta = event.metadata ?? {};
  const parts: string[] = [];
  if (meta.amount !== undefined)
    parts.push(`Monto: $${Number(meta.amount).toFixed(2)}`);
  if (meta.percentage !== undefined)
    parts.push(`Porcentaje: ${meta.percentage}%`);
  return parts.join(" · ") || `Acción detectada en tenant ${event.tenantId}`;
}

function buildAlertEmail(event: AuditPayload): string {
  const meta = event.metadata ?? {};
  const lines: string[] = [
    `<h2>Alerta de Kronos</h2>`,
    `<p><strong>Acción:</strong> ${humanizeAction(event.action)}</p>`,
    `<p><strong>Tenant:</strong> ${event.tenantId}</p>`,
    `<p><strong>Actor:</strong> ${event.actorId ?? "sistema"}</p>`,
  ];

  if (meta.amount !== undefined) {
    lines.push(
      `<p><strong>Monto:</strong> $${Number(meta.amount).toFixed(2)} ${meta.currency ?? ""}</p>`,
    );
  }
  if (meta.percentage !== undefined) {
    lines.push(`<p><strong>Porcentaje:</strong> ${meta.percentage}%</p>`);
  }

  lines.push(
    `<p style="color:#888;font-size:12px;">Generado automáticamente por Kronos — ${new Date().toISOString()}</p>`,
  );

  return lines.join("\n");
}

// ─── CRUD Server Actions ───────────────────────────────────────────────────────

async function requireOwnerSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) throw new Error("Unauthorized");
  if (session.user.role !== "OWNER") throw new Error("Forbidden — OWNER only");
  return session;
}

export async function listAlertRules(): Promise<AlertRuleRow[]> {
  const session = await requireOwnerSession();
  const rules = await rawDb.alertRule.findMany({
    where: { tenantId: session.user.tenantId },
    orderBy: { createdAt: "asc" },
  });
  return rules.map((r) => ({
    id: r.id,
    action: r.action,
    channel: r.channel,
    threshold: r.threshold ? Number(r.threshold) : null,
    enabled: r.enabled,
    recipientIds: r.recipientIds,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function createAlertRule(data: {
  action: AuditAction;
  channel: AlertChannel;
  threshold?: number | null;
  recipientIds: string[];
}) {
  const session = await requireOwnerSession();
  await rawDb.alertRule.create({
    data: {
      tenantId: session.user.tenantId,
      action: data.action,
      channel: data.channel,
      threshold: data.threshold ?? null,
      enabled: true,
      recipientIds: data.recipientIds,
    },
  });
  revalidatePath("/admin/ajustes/alertas");
  return { ok: true };
}

export async function updateAlertRule(
  id: string,
  data: {
    enabled?: boolean;
    threshold?: number | null;
    recipientIds?: string[];
    channel?: AlertChannel;
  },
) {
  const session = await requireOwnerSession();
  // Verify belongs to tenant
  const rule = await rawDb.alertRule.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!rule) throw new Error("Regla no encontrada");

  await rawDb.alertRule.update({
    where: { id },
    data: {
      ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
      ...(data.threshold !== undefined ? { threshold: data.threshold } : {}),
      ...(data.recipientIds !== undefined
        ? { recipientIds: data.recipientIds }
        : {}),
      ...(data.channel !== undefined ? { channel: data.channel } : {}),
    },
  });

  revalidatePath("/admin/ajustes/alertas");
  return { ok: true };
}

export async function deleteAlertRule(id: string) {
  const session = await requireOwnerSession();
  const rule = await rawDb.alertRule.findFirst({
    where: { id, tenantId: session.user.tenantId },
  });
  if (!rule) throw new Error("Regla no encontrada");

  await rawDb.alertRule.delete({ where: { id } });
  revalidatePath("/admin/ajustes/alertas");
  return { ok: true };
}
