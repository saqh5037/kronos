"use client";

import { useState, useTransition } from "react";
import { submitScore } from "@/server/actions/scores";
import { scalings } from "@/lib/validations/score";
import { defaultUnit, timeStringToSeconds } from "@/lib/validations/score";
import type { ScoreType } from "@/lib/validations/wod";

export default function ScoreForm({
  wodId,
  scoreType,
  classId,
}: {
  wodId: string;
  scoreType: ScoreType;
  classId?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const rawValue = (fd.get("value") as string) ?? "";
    let parsedValue: number;
    if (scoreType === "TIME") {
      parsedValue = timeStringToSeconds(rawValue);
    } else if (scoreType === "ROUNDS_REPS") {
      // Allow "5+12" or "5.12"
      if (rawValue.includes("+")) {
        const [r, p] = rawValue.split("+");
        const repsPart = Math.min(99, Number(p));
        parsedValue = Number(r) + repsPart / 100;
      } else {
        parsedValue = Number(rawValue);
      }
    } else {
      parsedValue = Number(rawValue);
    }

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setError("Valor inválido");
      return;
    }

    const data = {
      wodId,
      classId: classId ?? null,
      value: parsedValue,
      unit: fd.get("unit") || defaultUnit(scoreType),
      scaling: fd.get("scaling") || "RX",
      notes: fd.get("notes") || undefined,
    };

    startTransition(async () => {
      try {
        const res = await submitScore(data);
        form.reset();
        setFeedback(
          res.prAchieved ? "🏆 ¡Nuevo PR registrado!" : "Score guardado",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const placeholder =
    scoreType === "TIME"
      ? "ej. 5:30"
      : scoreType === "ROUNDS_REPS"
        ? "ej. 5+12"
        : scoreType === "WEIGHT"
          ? "ej. 102.5"
          : "ej. 120";

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border flex flex-col gap-3"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="k-eyebrow">Subir mi score</p>

      <div className="grid grid-cols-3 gap-2">
        <label className="col-span-2 flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>
            Resultado ({scoreType})
          </span>
          <input
            name="value"
            placeholder={placeholder}
            required
            className="px-3 py-2 rounded-lg text-sm border bg-transparent font-mono"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Unidad</span>
          <input
            name="unit"
            defaultValue={defaultUnit(scoreType)}
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-xs">
        <span style={{ color: "var(--text-2)" }}>Escalado</span>
        <select
          name="scaling"
          defaultValue="RX"
          className="px-3 py-2 rounded-lg text-sm border bg-transparent"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          {scalings.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <textarea
        name="notes"
        placeholder="Notas (opcional)"
        rows={2}
        maxLength={500}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
        style={{ borderColor: "var(--line)" }}
      />

      {error && (
        <p className="text-xs" style={{ color: "var(--pr)" }}>
          {error}
        </p>
      )}
      {feedback && (
        <p className="text-xs" style={{ color: "var(--recovery)" }}>
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="k-btn-grad py-2 rounded-lg text-sm disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar score"}
      </button>
    </form>
  );
}
