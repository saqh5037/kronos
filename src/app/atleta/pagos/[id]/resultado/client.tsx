"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentStatusResponse = {
  ok: boolean;
  payment?: {
    id: string;
    status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    paidAt: string | null;
    amount: number;
    currency: string;
    gateway: string;
    mpStatus: string | null;
    mpStatusDetail: string | null;
  };
  error?: string;
};

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 30_000;
const ERROR_RED = "#ff5e5e";

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
  const [polling, setPolling] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function tick() {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/payments/${paymentId}/status`);
        const data = (await res.json()) as PaymentStatusResponse;
        if (cancelled) return;
        if (data.ok && data.payment) {
          setPayment(data.payment);
          if (
            data.payment.status === "PAID" ||
            data.payment.status === "FAILED"
          ) {
            setPolling(false);
            return;
          }
        }
      } catch {
        // ignore — keep polling until timeout
      }
      setElapsed(Date.now() - start);
      if (Date.now() - start >= POLL_TIMEOUT_MS) {
        setPolling(false);
        return;
      }
      setTimeout(tick, POLL_INTERVAL_MS);
    }

    tick();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const finalStatus = payment?.status ?? null;
  const showSpinner =
    polling && finalStatus !== "PAID" && finalStatus !== "FAILED";

  const isPaid = finalStatus === "PAID";
  const isFailed = finalStatus === "FAILED" || initialStatus === "failure";

  let title = "Procesando pago…";
  let subtitle = "Esperamos confirmación de Mercado Pago.";
  let titleColor: string = "var(--k-t1)";

  if (isPaid) {
    title = "¡Pago confirmado!";
    subtitle = "Tu membresía está activa.";
    titleColor = "var(--k-accent)";
  } else if (isFailed) {
    title = "Pago rechazado";
    subtitle = payment?.mpStatusDetail
      ? `Detalle: ${payment.mpStatusDetail}`
      : "Intentá con otro método o tarjeta.";
    titleColor = ERROR_RED;
  } else if (!polling && finalStatus === "PENDING") {
    title = "Pago en proceso";
    subtitle =
      "Mercado Pago aún no confirmó. Te avisaremos por email cuando esté listo.";
    titleColor = "var(--k-t1)";
  }

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
        {showSpinner && (
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
        )}

        {isPaid && (
          <div
            style={{
              margin: "0 auto 16px",
              width: 56,
              height: 56,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--k-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {isFailed && (
          <div
            style={{
              margin: "0 auto 16px",
              width: 56,
              height: 56,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255, 94, 94, 0.12)",
              border: "1px solid rgba(255, 94, 94, 0.32)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke={ERROR_RED}
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
        )}

        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: "-0.02em",
            margin: "0 0 8px",
            color: titleColor,
          }}
        >
          {title}
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
          {subtitle}
        </p>

        {payment && (
          <div
            style={{
              marginTop: 20,
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 8,
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              color: "var(--k-t2)",
            }}
          >
            {payment.amount.toLocaleString()} {payment.currency} ·{" "}
            {payment.gateway}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <Link
            href="/atleta/pagos"
            style={{
              display: "block",
              padding: "13px 16px",
              borderRadius: 12,
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "none",
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            Volver a Mis pagos
          </Link>
          <Link
            href="/atleta"
            style={{
              display: "block",
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

        {showSpinner && elapsed > 10_000 && (
          <p
            style={{
              marginTop: 16,
              fontSize: 11,
              color: "var(--k-t3)",
              fontFamily: "var(--k-font-body)",
            }}
          >
            Esto está tardando un poco más de lo normal. Si pagaste, te
            avisaremos por email.
          </p>
        )}
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
