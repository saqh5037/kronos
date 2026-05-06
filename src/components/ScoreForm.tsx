"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { submitScore } from "@/server/actions/scores";
import { scalings } from "@/lib/validations/score";
import { defaultUnit, timeStringToSeconds } from "@/lib/validations/score";
import type { ScoreType } from "@/lib/validations/wod";
import KCard from "@/components/kronos/KCard";
import { kToast } from "@/lib/toast";

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
        if (res.prAchieved) {
          kToast.success("🏆 ¡Nuevo PR registrado!", {
            description: "Tu mejor marca personal ha sido actualizada.",
            duration: 5000,
          });
          setFeedback("🏆 ¡Nuevo PR registrado!");
        } else {
          kToast.success("Score guardado");
          setFeedback("Score guardado");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al guardar";
        kToast.error(msg);
        setError(msg);
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
    <KCard variant="featured">
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
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
              className="px-3 py-2.5 rounded-lg text-sm border bg-transparent font-mono font-bold tracking-tight"
              style={{
                borderColor: "var(--line)",
                fontSize: 16,
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            <span style={{ color: "var(--text-2)" }}>Unidad</span>
            <input
              name="unit"
              defaultValue={defaultUnit(scoreType)}
              className="px-3 py-2.5 rounded-lg text-sm border bg-transparent font-mono"
              style={{ borderColor: "var(--line)" }}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--text-2)" }}>Escalado</span>
          <select
            name="scaling"
            defaultValue="RX"
            className="px-3 py-2.5 rounded-lg text-sm border bg-transparent"
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
          className="px-3 py-2.5 rounded-lg text-sm border bg-transparent resize-none"
          style={{ borderColor: "var(--line)" }}
        />

        {error && (
          <motion.p
            className="text-xs font-medium"
            style={{ color: "var(--pr)" }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
        {feedback && (
          <motion.p
            className="text-xs font-bold"
            style={{ color: "var(--recovery)" }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {feedback}
          </motion.p>
        )}

        <motion.button
          type="submit"
          disabled={isPending}
          className="k-btn-grad py-3 rounded-xl text-sm font-bold disabled:opacity-50"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPending ? "Guardando…" : "Guardar score"}
        </motion.button>
      </form>
    </KCard>
  );
}
