/**
 * Webhook MercadoPago — SaaS subscription billing (sprint 3.1 + HMAC en 3.2).
 *
 * Recibe notificaciones de cobros de Kronos al Box (no de atletas al Box).
 * Transita SaasSubscription PENDING → ACTIVE y Box.subscriptionStatus → ACTIVE
 * cuando MP confirma el cobro.
 *
 * Solo activo cuando MERCADOPAGO_ACCESS_TOKEN está presente. En modo mock,
 * la transición la hace `confirmCheckoutMock()` directamente desde el server action.
 *
 * Persistencia: cada llamada crea un WebhookEvent (caja negra). HMAC validado
 * contra MERCADOPAGO_WEBHOOK_SECRET (compartido con webhook de pagos atletas).
 * Idempotencia: si SaasSubscription ya es ACTIVE y la notificación es de aprobación,
 * se ignora (devuelve 200).
 */
import { NextRequest, NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import { getPaymentClient, isMpConfigured } from "@/lib/payments/mp-client";
import { verifyMpSignature } from "@/lib/payments/mp-webhook";
import { nextBillingDate } from "@/lib/saas-billing";
import { logAudit } from "@/server/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type MpNotification = {
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

const TRACKED_HEADERS = [
  "x-signature",
  "x-request-id",
  "x-idempotency-key",
  "user-agent",
  "content-type",
];

function snapshotHeaders(req: NextRequest): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of TRACKED_HEADERS) {
    const v = req.headers.get(name);
    if (v) out[name] = v;
  }
  return out;
}

async function markEventProcessed(
  eventId: string,
  fields: {
    processingStatus: "processed" | "failed" | "ignored";
    errorMsg?: string | null;
    tenantId?: string | null;
    signatureValid?: boolean | null;
    externalId?: string | null;
  },
) {
  if (!eventId) return;
  try {
    await rawDb.webhookEvent.update({
      where: { id: eventId },
      data: {
        processingStatus: fields.processingStatus,
        errorMsg: fields.errorMsg ?? null,
        tenantId: fields.tenantId ?? null,
        signatureValid: fields.signatureValid,
        externalId: fields.externalId ?? null,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(
      `[mp-saas-webhook] failed to update WebhookEvent ${eventId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isMpConfigured()) {
    return NextResponse.json(
      { error: "MP no configurado en este servidor" },
      { status: 503 },
    );
  }

  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const signatureHeader = req.headers.get("x-signature");
  const requestIdHeader = req.headers.get("x-request-id");
  const headersSnapshot = snapshotHeaders(req);

  let body: MpNotification = {};
  let parseError: string | null = null;
  try {
    body = (await req.json()) as MpNotification;
  } catch (err) {
    parseError = err instanceof Error ? err.message : "invalid json";
  }

  // Caja negra: persistir SIEMPRE.
  let eventId = "";
  try {
    const event = await rawDb.webhookEvent.create({
      data: {
        source: "mercadopago-saas",
        externalId: body?.data?.id != null ? String(body.data.id) : null,
        rawPayload: parseError
          ? { _parse_error: parseError }
          : (body as object),
        rawHeaders: headersSnapshot,
        processingStatus: "received",
      },
      select: { id: true },
    });
    eventId = event.id;
  } catch (err) {
    console.error(
      "[mp-saas-webhook] WebhookEvent persist failed:",
      err instanceof Error ? err.message : err,
    );
  }

  if (parseError) {
    await markEventProcessed(eventId, {
      processingStatus: "failed",
      errorMsg: `body parse error: ${parseError}`,
    });
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const dataIdRaw = body?.data?.id ?? null;
  const dataId = dataIdRaw != null ? String(dataIdRaw) : null;

  if (!dataId) {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: "no data.id",
    });
    return NextResponse.json({ ok: true, skipped: "no data.id" });
  }

  // Validar HMAC. Prod sin secret → 503. Dev sin secret → warn + skip.
  let signatureValid: boolean | null = null;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[mp-saas-webhook] MERCADOPAGO_WEBHOOK_SECRET ausente en producción — rechazando.",
      );
      await markEventProcessed(eventId, {
        processingStatus: "failed",
        errorMsg: "webhook secret not configured (prod)",
        externalId: dataId,
      });
      return NextResponse.json(
        { error: "webhook secret not configured" },
        { status: 503 },
      );
    }
    console.warn(
      "[mp-saas-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — skipping signature check (DEV ONLY).",
    );
  } else {
    const sig = verifyMpSignature({
      signatureHeader,
      requestIdHeader,
      dataId,
      secret,
    });
    signatureValid = sig.valid;
    if (!sig.valid) {
      await markEventProcessed(eventId, {
        processingStatus: "failed",
        errorMsg: sig.reason ?? "invalid signature",
        signatureValid: false,
        externalId: dataId,
      });
      return NextResponse.json(
        { error: "invalid signature", reason: sig.reason },
        { status: 401 },
      );
    }
  }

  const topic = body.type ?? body.action ?? "";
  if (!topic.includes("payment")) {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: `topic: ${topic || "unknown"}`,
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  let mpPayment: {
    status: string | null | undefined;
    external_reference: string | null | undefined;
  };
  try {
    const client = getPaymentClient();
    const fetched = await client.get({ id: dataId });
    mpPayment = {
      status: fetched.status,
      external_reference: fetched.external_reference,
    };
  } catch (err) {
    await markEventProcessed(eventId, {
      processingStatus: "failed",
      errorMsg: `failed to fetch MP payment: ${String(err)}`,
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json(
      { error: "Failed to fetch MP payment", detail: String(err) },
      { status: 502 },
    );
  }

  const subscriptionId = mpPayment.external_reference;
  if (!subscriptionId) {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: "no external_reference",
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sub = await rawDb.saasSubscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, tenantId: true, status: true },
  });
  if (!sub) {
    await markEventProcessed(eventId, {
      processingStatus: "failed",
      errorMsg: "SaasSubscription not found",
      signatureValid,
      externalId: dataId,
    });
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
    await markEventProcessed(eventId, {
      processingStatus: "processed",
      tenantId: sub.tenantId,
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json({ ok: true, status: mpPayment.status });
  }

  if (sub.status === "ACTIVE") {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: "already active (idempotent)",
      tenantId: sub.tenantId,
      signatureValid,
      externalId: dataId,
    });
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
        mpSubscriptionId: dataId,
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
    metadata: { kind: "SAAS_WEBHOOK_CONFIRMED", mpPaymentId: dataId },
  });

  await markEventProcessed(eventId, {
    processingStatus: "processed",
    tenantId: sub.tenantId,
    signatureValid,
    externalId: dataId,
  });

  return NextResponse.json({ ok: true, activated: true });
}
