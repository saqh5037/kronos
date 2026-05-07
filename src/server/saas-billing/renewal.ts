import { db as prismaBase } from "../db";
import { logAudit } from "../audit";

export type RenewalResult =
  | { ok: true; invoiceId: string; newPeriodEnd: Date }
  | { ok: false; reason: string };

/**
 * Renueva una SaasSubscription en modo mock: extiende currentPeriodEnd
 * +1 mes y crea una nueva SaasInvoice por el plan price actual. Audit log.
 *
 * Idempotencia: lookup por status; si ya no está ACTIVE o ya tiene period futuro,
 * skip silencioso (caller debió llamar evaluateRenewal antes).
 *
 * Real mode: NO debe llamarse — el cobro recurrente lo dispara MP preapproval
 * via webhook (TODO sprint 4.x).
 */
export async function renewSubscriptionMock(
  subscriptionId: string,
  now: Date = new Date(),
): Promise<RenewalResult> {
  const sub = await prismaBase.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      tenantId: true,
      status: true,
      currentPeriodEnd: true,
      plan: { select: { priceMxnCents: true, name: true } },
    },
  });
  if (!sub) return { ok: false, reason: "SUBSCRIPTION_NOT_FOUND" };
  if (sub.status !== "ACTIVE") {
    return { ok: false, reason: `STATUS_NOT_ACTIVE:${sub.status}` };
  }
  if (!sub.currentPeriodEnd) {
    return { ok: false, reason: "NO_PERIOD_END" };
  }
  if (sub.currentPeriodEnd.getTime() > now.getTime()) {
    return { ok: false, reason: "PERIOD_NOT_EXPIRED" };
  }

  const oldPeriodEnd = sub.currentPeriodEnd;
  const newPeriodEnd = new Date(oldPeriodEnd);
  newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

  const [, invoice] = await prismaBase.$transaction([
    prismaBase.saasSubscription.update({
      where: { id: sub.id },
      data: { currentPeriodEnd: newPeriodEnd },
    }),
    prismaBase.saasInvoice.create({
      data: {
        tenantId: sub.tenantId,
        subscriptionId: sub.id,
        amountMxnCents: sub.plan.priceMxnCents,
        status: "PAID",
        periodStart: oldPeriodEnd,
        periodEnd: newPeriodEnd,
        paidAt: now,
      },
      select: { id: true },
    }),
    prismaBase.box.update({
      where: { id: sub.tenantId },
      data: { trialEndsAt: newPeriodEnd },
    }),
  ]);

  await logAudit({
    tenantId: sub.tenantId,
    actorId: null,
    action: "PAYMENT_CONFIRMED",
    targetType: "SaasSubscription",
    targetId: sub.id,
    metadata: {
      kind: "SAAS_RENEWED_MOCK",
      invoiceId: invoice.id,
      planName: sub.plan.name,
      newPeriodEnd: newPeriodEnd.toISOString(),
    },
  });

  return { ok: true, invoiceId: invoice.id, newPeriodEnd };
}
