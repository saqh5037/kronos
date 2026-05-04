"use client";

import { useState, useTransition } from "react";
import { createWOD } from "@/server/actions/wods";
import { wodTypes, scoreTypes } from "@/lib/validations/wod";

type Movement = {
  id: string;
  name: string;
  equipment: string[];
};

type LineItem = {
  movementId: string;
  reps: string;
  weight: string;
  notes: string;
};

const emptyLine: LineItem = {
  movementId: "",
  reps: "",
  weight: "",
  notes: "",
};

export default function WODForm({ movements }: { movements: Movement[] }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<LineItem[]>([{ ...emptyLine }]);
  const [isPending, startTransition] = useTransition();

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    const movementsPayload = lines
      .filter((l) => l.movementId)
      .map((l, i) => ({
        movementId: l.movementId,
        reps: l.reps ? Number(l.reps) : undefined,
        weight: l.weight ? Number(l.weight) : undefined,
        notes: l.notes || undefined,
        order: i,
      }));

    const data = {
      name: fd.get("name"),
      type: fd.get("type"),
      scoreType: fd.get("scoreType"),
      description: fd.get("description"),
      timeCap: fd.get("timeCap"),
      movements: movementsPayload,
    };

    startTransition(async () => {
      try {
        await createWOD(data);
        e.currentTarget?.reset();
        setLines([{ ...emptyLine }]);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear WOD");
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nuevo WOD
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border flex flex-col gap-3 w-full max-w-2xl"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow">Nuevo WOD</p>

      <input
        name="name"
        placeholder="Nombre del WOD (ej. Fran)"
        required
        maxLength={120}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />

      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Tipo</span>
          <select
            name="type"
            defaultValue="FORTIME"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {wodTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Score</span>
          <select
            name="scoreType"
            defaultValue="TIME"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {scoreTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Time cap (min)</span>
          <input
            name="timeCap"
            type="number"
            min="0"
            max="180"
            placeholder="0 = sin cap"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>

      <textarea
        name="description"
        placeholder="Descripción / instrucciones (opcional)"
        rows={2}
        maxLength={2000}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
        style={{ borderColor: "var(--line)" }}
      />

      <div
        className="border-t pt-3 mt-1 flex flex-col gap-2"
        style={{ borderColor: "var(--line)" }}
      >
        <p className="k-eyebrow">Movimientos</p>

        {lines.map((line, idx) => (
          <div
            key={idx}
            className="grid grid-cols-12 gap-1 items-center"
            style={{ fontSize: "12px" }}
          >
            <select
              value={line.movementId}
              onChange={(e) => updateLine(idx, { movementId: e.target.value })}
              className="col-span-5 px-2 py-1.5 rounded-md border bg-transparent text-xs"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <option value="">— Movimiento —</option>
              {movements.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              value={line.reps}
              onChange={(e) => updateLine(idx, { reps: e.target.value })}
              placeholder="Reps"
              type="number"
              min="0"
              className="col-span-2 px-2 py-1.5 rounded-md border bg-transparent text-xs"
              style={{ borderColor: "var(--line)" }}
            />
            <input
              value={line.weight}
              onChange={(e) => updateLine(idx, { weight: e.target.value })}
              placeholder="Peso"
              type="number"
              min="0"
              step="0.5"
              className="col-span-2 px-2 py-1.5 rounded-md border bg-transparent text-xs"
              style={{ borderColor: "var(--line)" }}
            />
            <input
              value={line.notes}
              onChange={(e) => updateLine(idx, { notes: e.target.value })}
              placeholder="Notas"
              className="col-span-2 px-2 py-1.5 rounded-md border bg-transparent text-xs"
              style={{ borderColor: "var(--line)" }}
            />
            <button
              type="button"
              onClick={() => removeLine(idx)}
              disabled={lines.length === 1}
              className="col-span-1 text-xs disabled:opacity-30"
              style={{ color: "var(--pr)" }}
              aria-label="Quitar movimiento"
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLine}
          className="k-btn-ghost text-xs px-3 py-1.5 rounded-md self-start"
        >
          + Agregar movimiento
        </button>

        {movements.length === 0 && (
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            No hay movimientos en la biblioteca. Crea uno primero abajo.
          </p>
        )}
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
          {isPending ? "Guardando…" : "Guardar WOD"}
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
