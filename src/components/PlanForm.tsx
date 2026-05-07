"use client";

import { useState, useTransition } from "react";
import { createPlan } from "@/server/actions/plans";
import { planTypes } from "@/lib/validations/membership";

export default function PlanForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = Object.fromEntries(fd);
    startTransition(async () => {
      try {
        await createPlan(data);
        form.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear plan");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nuevo plan
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="k-card p-4 flex flex-col gap-3 w-full max-w-md"
    >
      <p className="k-eyebrow">Nuevo plan</p>
      <input
        name="name"
        placeholder="Nombre (ej. Mensual ilimitado)"
        required
        maxLength={80}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Tipo</span>
          <select
            name="type"
            defaultValue="MONTHLY"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {planTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Precio</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Clases/mes</span>
          <input
            name="classesPerMonth"
            type="number"
            min="0"
            placeholder="0 = sin cap"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Duración (días)</span>
          <input
            name="durationDays"
            type="number"
            min="0"
            placeholder="auto si vacío"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>
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
          {isPending ? "Guardando…" : "Crear plan"}
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
