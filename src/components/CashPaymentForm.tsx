"use client";

import { useState, useTransition } from "react";
import { registerCashPayment } from "@/server/actions/payments";

type MembershipOption = {
  id: string;
  athleteName: string;
  planName: string;
  amountPaid: number;
};

export default function CashPaymentForm({
  memberships,
}: {
  memberships: MembershipOption[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      membershipId: fd.get("membershipId"),
      amount: fd.get("amount"),
      currency: fd.get("currency") || "MXN",
      paidAt: fd.get("paidAt") || undefined,
      notes: fd.get("notes") || undefined,
    };
    startTransition(async () => {
      try {
        await registerCashPayment(data);
        form.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-ghost px-3 py-1.5 rounded-md text-xs"
      >
        + Registrar cobro en efectivo
      </button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="k-card p-4 flex flex-col gap-3 w-full max-w-md"
    >
      <p className="k-eyebrow">Cobro en efectivo</p>
      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--k-t2)" }}>Membership</span>
        <select
          name="membershipId"
          required
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <option value="">— Seleccionar —</option>
          {memberships.map((m) => (
            <option key={m.id} value={m.id}>
              {m.athleteName} · {m.planName}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Monto</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent font-mono"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Fecha de pago</span>
          <input
            name="paidAt"
            type="date"
            defaultValue={today}
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>
      <textarea
        name="notes"
        placeholder="Notas (opcional)"
        rows={2}
        maxLength={300}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
        style={{ borderColor: "var(--line)" }}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="k-btn-grad flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isPending ? "Registrando…" : "Registrar pago"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="k-btn-ghost flex-1 py-2 rounded-lg text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
