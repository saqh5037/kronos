"use client";

import { useState, useTransition } from "react";
import { createClass } from "@/server/actions/classes";

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };

export default function ClassForm({
  coaches,
  wods,
  defaultDate,
}: {
  coaches: Coach[];
  wods: WOD[];
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const date = fd.get("date") as string;
    const time = fd.get("time") as string;
    const startsAt = new Date(`${date}T${time}`).toISOString();

    const recFreq = fd.get("recFreq") as string;
    const recCount = fd.get("recCount") as string;

    const data = {
      startsAt,
      durationMin: fd.get("durationMin"),
      capacity: fd.get("capacity"),
      coachId: fd.get("coachId"),
      wodId: fd.get("wodId"),
      recurrence:
        recFreq && recFreq !== "NONE"
          ? { freq: recFreq, count: recCount || 8 }
          : { freq: "NONE" },
    };

    startTransition(async () => {
      try {
        await createClass(data);
        form.reset();
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear clase");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nueva clase
      </button>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const initialDate = defaultDate ?? today;

  return (
    <form
      onSubmit={handleSubmit}
      className="k-card p-4 flex flex-col gap-3 w-full max-w-md"
    >
      <p className="k-eyebrow">Nueva clase</p>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Fecha</span>
          <input
            name="date"
            type="date"
            defaultValue={initialDate}
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Hora</span>
          <input
            name="time"
            type="time"
            defaultValue="07:00"
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Duración (min)</span>
          <input
            name="durationMin"
            type="number"
            min="15"
            max="240"
            defaultValue="60"
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Capacidad</span>
          <input
            name="capacity"
            type="number"
            min="1"
            max="50"
            defaultValue="16"
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>Coach</span>
        <select
          name="coachId"
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <option value="">— Sin asignar —</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name ?? c.email}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>WOD</span>
        <select
          name="wodId"
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <option value="">— Por definir —</option>
          {wods.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} · {w.type}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Recurrencia</span>
          <select
            name="recFreq"
            defaultValue="NONE"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <option value="NONE">Una sola vez</option>
            <option value="DAILY">Diaria</option>
            <option value="WEEKLY">Semanal</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Repeticiones</span>
          <input
            name="recCount"
            type="number"
            min="1"
            max="52"
            defaultValue="8"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>

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
          {isPending ? "Creando…" : "Crear"}
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
