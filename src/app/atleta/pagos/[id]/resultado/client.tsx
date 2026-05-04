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

  // Decide visual state
  let title = "Procesando pago…";
  let subtitle = "Esperamos confirmación de Mercado Pago.";
  let color = "var(--strain)";

  if (finalStatus === "PAID") {
    title = "¡Pago confirmado!";
    subtitle = "Tu membresía está activa.";
    color = "var(--recovery)";
  } else if (finalStatus === "FAILED" || initialStatus === "failure") {
    title = "Pago rechazado";
    subtitle = payment?.mpStatusDetail
      ? `Detalle: ${payment.mpStatusDetail}`
      : "Intentá con otro método o tarjeta.";
    color = "var(--pr)";
  } else if (!polling && finalStatus === "PENDING") {
    title = "Pago en proceso";
    subtitle =
      "Mercado Pago aún no confirmó. Te avisaremos por email cuando esté listo.";
    color = "var(--strain)";
  }

  return (
    <div className="px-3.5 pt-16 pb-24">
      <div className="k-card p-6 text-center">
        {showSpinner && (
          <div
            className="mx-auto mb-4 w-12 h-12 rounded-full border-4"
            style={{
              borderColor: "var(--bg-soft)",
              borderTopColor: "var(--strain)",
              animation: "spin 0.9s linear infinite",
            }}
          />
        )}

        {finalStatus === "PAID" && (
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "var(--recovery-soft)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--recovery)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {(finalStatus === "FAILED" || initialStatus === "failure") && (
          <div
            className="mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "var(--pr-soft)" }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--pr)"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </div>
        )}

        <h1 className="font-display font-bold text-2xl mb-2" style={{ color }}>
          {title}
        </h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          {subtitle}
        </p>

        {payment && (
          <div
            className="mt-5 mx-auto inline-block px-4 py-2 rounded-md font-mono text-xs"
            style={{
              background: "var(--bg-soft)",
              color: "var(--text-2)",
            }}
          >
            {payment.amount.toLocaleString()} {payment.currency} ·{" "}
            {payment.gateway}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/atleta/pagos"
            className="k-btn-grad text-sm font-display font-bold"
          >
            Volver a Mis pagos
          </Link>
          <Link href="/atleta" className="k-btn-ghost text-sm font-display">
            Ir al inicio
          </Link>
        </div>

        {showSpinner && elapsed > 10_000 && (
          <p className="mt-4 text-xs" style={{ color: "var(--text-3)" }}>
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
