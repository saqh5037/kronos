"use client";

import { useState, useTransition } from "react";
import { assignMembership } from "@/server/actions/memberships";

type AthleteOption = { id: string; firstName: string; lastName: string };
type PlanOption = { id: string; name: string; type: string; price: number };

export default function MembershipAssignForm({
  athletes,
  plans,
}: {
  athletes: AthleteOption[];
  plans: PlanOption[];
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
      athleteId: fd.get("athleteId"),
      planId: fd.get("planId"),
      startDate: fd.get("startDate"),
      autoRenew: fd.get("autoRenew") === "on",
    };
    startTransition(async () => {
      try {
        await assignMembership(data);
        form.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al asignar");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Asignar membership
      </button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border flex flex-col gap-3 w-full max-w-md"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow">Asignar membership</p>
      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>Atleta</span>
        <select
          name="athleteId"
          required
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <option value="">— Seleccionar —</option>
          {athletes.map((a) => (
            <option key={a.id} value={a.id}>
              {a.firstName} {a.lastName}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>Plan</span>
        <select
          name="planId"
          required
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <option value="">— Seleccionar —</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} · {p.type} · ${p.price}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>Fecha de inicio</span>
        <input
          name="startDate"
          type="date"
          defaultValue={today}
          required
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)" }}
        />
      </label>
      <label className="flex items-center gap-2 text-xs">
        <input
          name="autoRenew"
          type="checkbox"
          defaultChecked
          style={{ accentColor: "var(--recovery)" }}
        />
        <span style={{ color: "var(--text-2)" }}>Renovación automática</span>
      </label>
      {error && (
        <p className="text-xs" style={{ color: "var(--pr)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="k-btn-grad flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isPending ? "Asignando…" : "Asignar"}
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
