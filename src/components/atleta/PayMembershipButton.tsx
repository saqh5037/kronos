"use client";

import { useState } from "react";

export default function PayMembershipButton({
  paymentId,
  amount,
  currency,
}: {
  paymentId: string;
  amount: number;
  currency: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}/mp-checkout`, {
        method: "POST",
      });
      const data = (await res.json()) as
        | { ok: true; initPoint: string; sandboxInitPoint: string }
        | { ok: false; error: string };

      if (!data.ok) {
        setError(data.error || "No se pudo iniciar el pago");
        setLoading(false);
        return;
      }

      const url =
        process.env.NODE_ENV === "production"
          ? data.initPoint
          : data.sandboxInitPoint;
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error de red");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="k-btn-grad w-full text-sm font-display font-bold disabled:opacity-50"
      >
        {loading
          ? "Redirigiendo…"
          : `Pagar ${amount.toLocaleString()} ${currency}`}
      </button>
      {error && (
        <p
          className="mt-2 text-xs"
          style={{ color: "var(--k-danger)" }}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
