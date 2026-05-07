"use client";

import { useState, useTransition } from "react";
import { createAthlete } from "@/server/actions/athletes";

export default function AthleteForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    startTransition(async () => {
      await createAthlete(data);
      form.reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nuevo atleta
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="k-card p-4 flex flex-col gap-3 max-w-sm"
    >
      <p className="k-eyebrow">Nuevo atleta</p>
      <input
        name="firstName"
        placeholder="Nombre"
        required
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      <input
        name="lastName"
        placeholder="Apellido"
        required
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      <input
        name="phone"
        placeholder="Teléfono"
        type="tel"
        className="px-3 py-2 rounded-lg text-sm border focus:outline-none"
        style={{
          background: "var(--k-surface)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="k-btn-grad flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isPending ? "Guardando…" : "Guardar"}
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
