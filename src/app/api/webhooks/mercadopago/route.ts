/**
 * Webhook MercadoPago — recibe notificaciones de pagos.
 *
 * 1. Persiste WebhookEvent SIEMPRE (caja negra), incluso si el body no parsea.
 * 2. Valida HMAC-SHA256 con MERCADOPAGO_WEBHOOK_SECRET. En prod sin secret → 503.
 * 3. Filtra por topic "payment". Otros topics se ignoran (registrados).
 * 4. Fetch el pago de MP, busca Payment local por external_reference.
 * 5. Idempotencia: si Payment ya está PAID y webhook no es REFUNDED → ignorar.
 * 6. Update Payment + Membership en transacción atómica + audit.
 *
 * Side effects (email, etc.) corren fuera de la transacción.
 */
import { NextRequest, NextResponse } from "next/server";
import { db as rawDb } from "@/server/db";
import { getPaymentClient } from "@/lib/payments/mp-client";
import {
  mapMpStatusToLocal,
  verifyMpSignature,
} from "@/lib/payments/mp-webhook";
import { logAudit } from "@/server/audit";
import { reportError } from "@/lib/observability";

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
    paymentId?: string | null;
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
        paymentId: fields.paymentId ?? null,
        tenantId: fields.tenantId ?? null,
        signatureValid: fields.signatureValid,
        externalId: fields.externalId ?? null,
        processedAt: new Date(),
      },
    });
  } catch (err) {
    console.error(
      `[mp-webhook] failed to update WebhookEvent ${eventId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "";
  const signatureHeader = request.headers.get("x-signature");
  const requestIdHeader = request.headers.get("x-request-id");
  const headersSnapshot = snapshotHeaders(request);

  let body: MpNotification = {};
  let parseError: string | null = null;
  try {
    body = (await request.json()) as MpNotification;
  } catch (err) {
    parseError = err instanceof Error ? err.message : "invalid json";
  }

  // Caja negra: persistir SIEMPRE.
  let eventId = "";
  try {
    const event = await rawDb.webhookEvent.create({
      data: {
        source: "mercadopago",
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
    reportError("mp-webhook/persist-event", err);
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

  // Validar HMAC. En prod sin secret → 503. En dev sin secret → warn + skip.
  let signatureValid: boolean | null = null;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET ausente en producción — rechazando.",
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
      "[mp-webhook] MERCADOPAGO_WEBHOOK_SECRET no configurado — skipping signature check (DEV ONLY).",
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
      console.warn(`[mp-webhook] signature invalid: ${sig.reason}`);
      await markEventProcessed(eventId, {
        processingStatus: "failed",
        errorMsg: `signature invalid: ${sig.reason ?? "unknown"}`,
        signatureValid: false,
        externalId: dataId,
      });
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
  }

  const topic = body.type ?? body.action ?? "";
  if (!topic.includes("payment")) {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: `non-payment topic: ${topic || "(empty)"}`,
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json({ ok: true, skipped: "non-payment topic" });
  }

  // Fetch payment details from MP API
  let mpPayment: Awaited<
    ReturnType<ReturnType<typeof getPaymentClient>["get"]>
  >;
  try {
    mpPayment = await getPaymentClient().get({ id: dataId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    reportError("mp-webhook/fetch-payment", err, { dataId });
    await markEventProcessed(eventId, {
      processingStatus: "failed",
      errorMsg: `mp fetch failed: ${msg}`,
      signatureValid,
      externalId: dataId,
    });
    return NextResponse.json({ error: "mp fetch failed" }, { status: 502 });
  }

  const externalRef = mpPayment.external_reference as string | undefined;
  const mpPaymentId = String(mpPayment.id ?? dataId);
  const mpStatus = (mpPayment.status ?? "").toString();
  const mpStatusDetail = (mpPayment.status_detail ?? "").toString();
  const mpPaymentType = (mpPayment.payment_type_id ?? "").toString();
  const mpPayerEmail = (mpPayment.payer?.email ?? "").toString();

  if (!externalRef) {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: "no external_reference",
      signatureValid,
      externalId: mpPaymentId,
    });
    return NextResponse.json({ ok: true, skipped: "no external_reference" });
  }

  const localStatus = mapMpStatusToLocal(mpStatus);

  const payment = await rawDb.payment.findUnique({
    where: { id: externalRef },
    include: {
      membership: {
        include: {
          athlete: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!payment) {
    console.warn(
      `[mp-webhook] payment not found for external_reference=${externalRef}`,
    );
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: `payment not found for external_reference=${externalRef}`,
      signatureValid,
      externalId: mpPaymentId,
    });
    return NextResponse.json({ ok: true, skipped: "payment not found" });
  }

  // Idempotencia: ya PAID y webhook no es REFUNDED → no tocar
  if (payment.status === "PAID" && localStatus !== "REFUNDED") {
    await markEventProcessed(eventId, {
      processingStatus: "ignored",
      errorMsg: "idempotent: payment already PAID",
      signatureValid,
      externalId: mpPaymentId,
      paymentId: payment.id,
      tenantId: payment.tenantId,
    });
    return NextResponse.json({ ok: true, idempotent: true });
  }

  const previousStatus = payment.status;
  const statusChanged = previousStatus !== localStatus;

  try {
    await rawDb.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: localStatus,
          externalId: mpPaymentId,
          mpStatus: mpStatus || null,
          mpStatusDetail: mpStatusDetail || null,
          mpPaymentType: mpPaymentType || null,
          mpPayerEmail: mpPayerEmail || null,
          paidAt: localStatus === "PAID" ? new Date() : payment.paidAt,
        },
      });

      // Activar membership si pago exitoso y todavía está PENDING
      if (localStatus === "PAID" && payment.membershipId) {
        await tx.membership.update({
          where: { id: payment.membershipId },
          data: { status: "ACTIVE" },
        });
      }
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    reportError("mp-webhook/db-transaction", err, { paymentId: payment.id });
    await markEventProcessed(eventId, {
      processingStatus: "failed",
      errorMsg: `db transaction failed: ${msg}`,
      signatureValid,
      externalId: mpPaymentId,
      paymentId: payment.id,
      tenantId: payment.tenantId,
    });
    return NextResponse.json(
      { error: "db transaction failed" },
      { status: 500 },
    );
  }

  // Audit (fuera de transacción — best-effort)
  if (statusChanged) {
    if (localStatus === "PAID") {
      await logAudit({
        tenantId: payment.tenantId,
        actorId: null,
        action: "PAYMENT_CONFIRMED",
        targetType: "Payment",
        targetId: payment.id,
        metadata: {
          mpPaymentId,
          mpStatus,
          mpStatusDetail,
          mpPaymentType,
          previousStatus,
          webhookEventId: eventId,
        },
      });
    } else if (localStatus === "FAILED") {
      await logAudit({
        tenantId: payment.tenantId,
        actorId: null,
        action: "PAYMENT_FAILED",
        targetType: "Payment",
        targetId: payment.id,
        metadata: {
          mpPaymentId,
          mpStatus,
          mpStatusDetail,
          previousStatus,
          webhookEventId: eventId,
        },
      });
    }
  }

  await markEventProcessed(eventId, {
    processingStatus: "processed",
    signatureValid,
    externalId: mpPaymentId,
    paymentId: payment.id,
    tenantId: payment.tenantId,
  });

  return NextResponse.json({
    ok: true,
    paymentId: payment.id,
    from: previousStatus,
    to: localStatus,
    changed: statusChanged,
    webhookEventId: eventId || null,
  });
}

// MP hace GET para validar la URL al configurar el webhook.
export async function GET() {
  return NextResponse.json({ ok: true, service: "kronos-mp-webhook" });
}
