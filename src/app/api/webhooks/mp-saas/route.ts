/**
 * Webhook MercadoPago — SaaS subscription billing (sprint 3.1).
 *
 * Recibe notificaciones de cobros de Kronos al Box (no de atletas al Box).
 * Transita SaasSubscription PENDING → ACTIVE y Box.subscriptionStatus → ACTIVE
 * cuando MP confirma el cobro.
 *
 * Solo activo cuando MERCADOPAGO_ACCESS_TOKEN está presente. En modo mock,
 * la transición la hace `confirmCheckoutMock()` directamente desde el server action.
 *
 * Idempotencia: si SaasSubscription ya es ACTIVE y la notificación es de aprobación,
 * se ignora (devuelve 200).
 */
import { NextRequest, NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import { getPaymentClient, isMpConfigured } from "@/lib/payments/mp-client";
import { nextBillingDate } from "@/lib/saas-billing";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type MpNotification = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isMpConfigured()) {
    return NextResponse.json(
      { error: "MP no configurado en este servidor" },
      { status: 503 },
    );
  }

  let body: MpNotification;
  try {
    body = (await req.json()) as MpNotification;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const topic = body.type ?? body.action ?? "";
  const mpPaymentId = body.data?.id ? String(body.data.id) : null;

  if (!topic.includes("payment") || !mpPaymentId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  let mpPayment: {
    status: string | null | undefined;
    external_reference: string | null | undefined;
  };
  try {
    const client = getPaymentClient();
    const fetched = await client.get({ id: mpPaymentId });
    mpPayment = {
      status: fetched.status,
      external_reference: fetched.external_reference,
    };
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch MP payment", detail: String(err) },
      { status: 502 },
    );
  }

  const subscriptionId = mpPayment.external_reference;
  if (!subscriptionId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sub = await rawDb.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: {
      id: true,
      tenantId: true,
      status: true,
    },
  });
  if (!sub) {
    return NextResponse.json(
      { error: "SaasSubscription no encontrada" },
      { status: 404 },
    );
  }

  if (mpPayment.status !== "approved") {
    await logAudit({
      tenantId: sub.tenantId,
      actorId: null,
      action: "PAYMENT_FAILED",
      targetType: "SaasSubscription",
      targetId: sub.id,
      metadata: {
        kind: "SAAS_WEBHOOK_NON_APPROVED",
        mpStatus: mpPayment.status ?? "unknown",
      },
    });
    return NextResponse.json({ ok: true, status: mpPayment.status });
  }

  if (sub.status === "ACTIVE") {
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const startsAt = new Date();
  const currentPeriodEnd = nextBillingDate(startsAt);

  await rawDb.$transaction([
    rawDb.saasSubscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        startsAt,
        currentPeriodEnd,
        mpSubscriptionId: mpPaymentId,
      },
    }),
    rawDb.box.update({
      where: { id: sub.tenantId },
      data: {
        subscriptionStatus: "ACTIVE",
        trialEndsAt: currentPeriodEnd,
      },
    }),
  ]);

  await logAudit({
    tenantId: sub.tenantId,
    actorId: null,
    action: "PAYMENT_CONFIRMED",
    targetType: "SaasSubscription",
    targetId: sub.id,
    metadata: {
      kind: "SAAS_WEBHOOK_CONFIRMED",
      mpPaymentId,
    },
  });

  return NextResponse.json({ ok: true, activated: true });
}
