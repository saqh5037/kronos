"use client";

/**
 * Payment result screen.
 *
 * Audit 2026-09-15 called this "the most anxious screen in the app":
 * "'Procesando pago… Esperamos confirmación de Mercado Pago.' with an infinite
 * spinner: no amount, no order ID, no 'te avisamos por correo', no timeout, no
 * retry."
 *
 * All of that now exists, and the decision of what to render lives in
 * `./state` so it can be tested without a browser.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import { formatMXN } from "@/lib/format";
import { paymentGatewayLabel } from "@/lib/labels";
import type { PaymentGateway } from "@prisma/client";
import {
  PAYMENT_POLL_INTERVAL_MS,
  paymentResultView,
  secondsLeft,
  shouldKeepPolling,
  type GatewayStatus,
} from "./state";

type PaymentStatusResponse = {
  ok: boolean;
  payment?: {
    id: string;
    status: GatewayStatus;
    paidAt: string | null;
    amount: number;
    currency: string;
    gateway: string;
    mpStatus: string | null;
    mpStatusDetail: string | null;
  };
  error?: string;
};

export default function PaymentResultClient({
  paymentId,
  initialStatus,
}: {
  paymentId: string;
  initialStatus: string | null;
}) {
  const [payment, setPayment] = useState<
    PaymentStatusResponse["payment"] | null
  >(null);
  const [elapsed, setElapsed] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function tick() {
      if (cancelled) return;
      let status: GatewayStatus | null = null;
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`);
        const data = (await res.json()) as PaymentStatusResponse;
        if (cancelled) return;
        if (data.ok && data.payment) {
          setPayment(data.payment);
          status = data.payment.status;
        }
      } catch {
        // Network blip: keep polling until the timeout decides.
      }

      const elapsedMs = Date.now() - start;
      if (cancelled) return;
      setElapsed(elapsedMs);

      if (shouldKeepPolling({ status, initialStatus, elapsedMs })) {
        setTimeout(tick, PAYMENT_POLL_INTERVAL_MS);
      }
    }

    setElapsed(0);
    tick();
    return () => {
      cancelled = true;
    };
    // `attempt` re-arms the poll when the athlete taps "Reintentar".
  }, [paymentId, initialStatus, attempt]);

  const view = paymentResultView({
    status: payment?.status ?? null,
    initialStatus,
    elapsedMs: elapsed,
  });

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const amountLabel = payment
    ? payment.currency.toUpperCase() === "MXN"
      ? formatMXN(payment.amount)
      : `${payment.amount.toLocaleString("es-MX")} ${payment.currency}`
    : null;
  const methodLabel = payment
    ? (paymentGatewayLabel[payment.gateway as PaymentGateway] ??
      payment.gateway)
    : null;

  return (
    <div style={{ padding: "64px 16px 96px" }}>
      <div
        style={{
          padding: 24,
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
          borderRadius: 16,
          textAlign: "center",
        }}
      >
        <StatusIcon state={view.state} />

        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            color:
              view.state === "paid"
                ? "var(--k-accent)"
                : view.state === "failed"
                  ? "var(--k-danger)"
                  : "var(--k-t1)",
          }}
        >
          {view.title}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "var(--k-t2)",
            fontFamily: "var(--k-font-body)",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {view.body}
        </p>

        {view.showSpinner && (
          <p
            className="k-mono"
            style={{
              marginTop: 10,
              fontSize: 10,
              letterSpacing: "0.14em",
              color: "var(--k-t3)",
              textTransform: "uppercase",
            }}
          >
            Esperamos {secondsLeft(elapsed)} s más
          </p>
        )}

        {/* Amount, order id and method: what the athlete needs to recognise
            the charge on their statement or quote it to support. */}
        {payment && (
          <dl
            style={{
              marginTop: 20,
              display: "grid",
              gap: 6,
              textAlign: "left",
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
            }}
          >
            {amountLabel && <DetailRow label="Monto" value={amountLabel} />}
            {methodLabel && <DetailRow label="Método" value={methodLabel} />}
            <DetailRow label="Referencia" value={payment.id} mono />
          </dl>
        )}

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {view.showRetry && (
            <button
              type="button"
              onClick={retry}
              className="k-tap"
              style={{
                minHeight: 44,
                padding: "13px 16px",
                borderRadius: 12,
                background: "var(--k-accent)",
                color: "var(--k-accent-on)",
                border: "none",
                fontFamily: "var(--k-font-display)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "var(--k-accent-glow)",
              }}
            >
              Reintentar
            </button>
          )}
          <Link
            href="/atleta/pagos"
            style={{
              display: "block",
              minHeight: 44,
              padding: "13px 16px",
              borderRadius: 12,
              background: view.showRetry ? "transparent" : "var(--k-accent)",
              color: view.showRetry ? "var(--k-t1)" : "var(--k-accent-on)",
              border: view.showRetry ? "1px solid var(--k-line-2)" : "none",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Volver a pagos
          </Link>
          <Link
            href="/atleta"
            style={{
              display: "block",
              minHeight: 44,
              padding: "11px 16px",
              borderRadius: 12,
              background: "transparent",
              color: "var(--k-t2)",
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "1px solid var(--k-line-2)",
            }}
          >
            Ir al inicio
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function StatusIcon({
  state,
}: {
  state: ReturnType<typeof paymentResultView>["state"];
}) {
  if (state === "processing") {
    return (
      <div
        style={{
          margin: "0 auto 16px",
          width: 48,
          height: 48,
          borderRadius: 999,
          border: "4px solid var(--k-line)",
          borderTopColor: "var(--k-accent)",
          animation: "spin 0.9s linear infinite",
        }}
      />
    );
  }

  const config =
    state === "paid"
      ? { Icon: CircleCheck, color: "var(--k-accent)" }
      : state === "failed"
        ? { Icon: CircleX, color: "var(--k-danger)" }
        : { Icon: Clock, color: "var(--k-t2)" };

  return (
    <div
      style={{
        margin: "0 auto 16px",
        width: 56,
        height: 56,
        borderRadius: 999,
        display: "grid",
        placeItems: "center",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
        color: config.color,
      }}
    >
      <config.Icon size={28} strokeWidth={2} aria-hidden />
    </div>
  );
}

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 10,
      }}
    >
      <dt
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--k-t3)",
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: mono ? "var(--k-font-display)" : "var(--k-font-body)",
          fontSize: mono ? 11 : 13,
          fontWeight: 600,
          color: "var(--k-t1)",
          wordBreak: "break-all",
          textAlign: "right",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
