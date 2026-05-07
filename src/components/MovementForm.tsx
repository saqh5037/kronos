"use client";

import { useState, useTransition } from "react";
import { createMovement } from "@/server/actions/movements";

export default function MovementForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const equipmentRaw = (fd.get("equipment") as string) ?? "";
    const equipment = equipmentRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const data = {
      name: fd.get("name"),
      videoUrl: fd.get("videoUrl"),
      standardDescription: fd.get("standardDescription"),
      equipment,
    };

    startTransition(async () => {
      try {
        await createMovement(data);
        form.reset();
        setOpen(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al crear movimiento",
        );
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-ghost px-3 py-1.5 rounded-md text-xs"
      >
        + Nuevo movimiento
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="k-card p-3 flex flex-col gap-2 w-full max-w-md"
    >
      <p className="k-eyebrow">Nuevo movimiento</p>
      <input
        name="name"
        placeholder="Nombre (ej. Thruster)"
        required
        maxLength={80}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <input
        name="videoUrl"
        type="url"
        placeholder="URL del video (opcional)"
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <input
        name="equipment"
        placeholder="Equipo (separado por comas: Barbell, Plates)"
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <textarea
        name="standardDescription"
        placeholder="Descripción estándar (opcional)"
        rows={2}
        maxLength={1000}
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
          className="k-btn-grad flex-1 py-1.5 rounded-md text-xs disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="k-btn-ghost flex-1 py-1.5 rounded-md text-xs"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
