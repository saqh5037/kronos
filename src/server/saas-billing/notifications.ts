import { db as prismaBase } from "../db";
import { sendEmail } from "@/lib/email";
import { logAudit } from "../audit";
import { renderPaymentFailedEmail } from "../email-templates/billing/payment-failed";
import { renderSubscriptionExpiredEmail } from "../email-templates/billing/subscription-expired";
import { renderTrialExpiringEmail } from "../email-templates/billing/trial-expiring";
import { SAAS_GRACE_PERIOD_DAYS } from "./lifecycle";

async function getOwnerOfTenant(tenantId: string): Promise<{
  email: string;
  name: string | null;
  boxName: string;
} | null> {
  const owner = await prismaBase.user.findFirst({
    where: { tenantId, role: "OWNER" },
    select: { email: true, name: true, box: { select: { name: true } } },
  });
  if (!owner) return null;
  return {
    email: owner.email,
    name: owner.name,
    boxName: owner.box?.name ?? "tu Box",
  };
}

function baseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";
}

/**
 * Envía emails operacionales sin bloquear la transacción que los disparó.
 * Si el envío falla, log y seguimos.
 */
async function safeSend(args: {
  tenantId: string;
  to: string;
  subject: string;
  html: string;
  auditKind: string;
}): Promise<void> {
  try {
    await sendEmail({ to: [args.to], subject: args.subject, html: args.html });
    await logAudit({
      tenantId: args.tenantId,
      actorId: null,
      action: "PAYMENT_INITIATED",
      targetType: "Box",
      targetId: args.tenantId,
      metadata: { kind: args.auditKind, recipient: args.to },
    });
  } catch (err) {
    console.error(
      `[saas-notifications] failed to send ${args.auditKind} to ${args.to}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function notifyPaymentFailed(tenantId: string): Promise<void> {
  const owner = await getOwnerOfTenant(tenantId);
  if (!owner) return;
  await safeSend({
    tenantId,
    to: owner.email,
    subject: `Pago pendiente en ${owner.boxName} — Kronos`,
    html: renderPaymentFailedEmail({
      boxName: owner.boxName,
      ownerName: owner.name,
      ctaUrl: `${baseUrl()}/admin/billing/checkout`,
      graceDays: SAAS_GRACE_PERIOD_DAYS,
    }),
    auditKind: "EMAIL_SENT_PAYMENT_FAILED",
  });
}

export async function notifySubscriptionExpired(
  tenantId: string,
): Promise<void> {
  const owner = await getOwnerOfTenant(tenantId);
  if (!owner) return;
  await safeSend({
    tenantId,
    to: owner.email,
    subject: `Suscripción expirada — ${owner.boxName} en Kronos`,
    html: renderSubscriptionExpiredEmail({
      boxName: owner.boxName,
      ownerName: owner.name,
      ctaUrl: `${baseUrl()}/admin/billing/checkout`,
    }),
    auditKind: "EMAIL_SENT_SUBSCRIPTION_EXPIRED",
  });
}

export async function notifyTrialExpiring(
  tenantId: string,
  daysRemaining: number,
): Promise<void> {
  const owner = await getOwnerOfTenant(tenantId);
  if (!owner) return;
  await safeSend({
    tenantId,
    to: owner.email,
    subject: `Tu trial de Kronos termina en ${daysRemaining} ${daysRemaining === 1 ? "día" : "días"}`,
    html: renderTrialExpiringEmail({
      boxName: owner.boxName,
      ownerName: owner.name,
      ctaUrl: `${baseUrl()}/admin/billing/checkout`,
      daysRemaining,
    }),
    auditKind: "EMAIL_SENT_TRIAL_EXPIRING",
  });
}

/**
 * Lookup último audit log con kind EMAIL_SENT_TRIAL_EXPIRING para idempotencia.
 */
export async function getLastTrialExpiringNotification(
  tenantId: string,
): Promise<Date | null> {
  const audit = await prismaBase.auditEvent.findFirst({
    where: {
      tenantId,
      targetType: "Box",
      metadata: { path: ["kind"], equals: "EMAIL_SENT_TRIAL_EXPIRING" },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  return audit?.createdAt ?? null;
}
