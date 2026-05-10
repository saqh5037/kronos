"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kToast } from "@/lib/toast";
import {
  createMyQuickWod,
  type QuickWodPR,
} from "@/server/actions/atleta-quick-wod";
import { fireAchievementToast } from "@/components/atleta/AchievementToast";
import { formatScore } from "@/lib/scores";

type WodType = "FORTIME" | "AMRAP" | "EMOM" | "TABATA" | "STRENGTH" | "CUSTOM";
type ScoreType = "TIME" | "REPS" | "WEIGHT" | "ROUNDS_REPS";
type Scaling = "RX" | "SCALED" | "RXPLUS";

const WOD_TYPES: { value: WodType; label: string }[] = [
  { value: "FORTIME", label: "For Time" },
  { value: "AMRAP", label: "AMRAP" },
  { value: "EMOM", label: "EMOM" },
  { value: "STRENGTH", label: "Fuerza" },
  { value: "CUSTOM", label: "Custom" },
];

const SCORE_TYPES: { value: ScoreType; label: string }[] = [
  { value: "TIME", label: "Tiempo" },
  { value: "REPS", label: "Reps" },
  { value: "WEIGHT", label: "Peso" },
  { value: "ROUNDS_REPS", label: "Rounds + Reps" },
];

const SCALINGS: { value: Scaling; label: string }[] = [
  { value: "RX", label: "Rx" },
  { value: "SCALED", label: "Scaled" },
  { value: "RXPLUS", label: "Rx+" },
];

/**
 * Parser "MM:SS" → segundos. Acepta "5:30", "12:05", "0:45" o número plano "330".
 */
function parseTimeMmSs(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
  const m = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (!m) return null;
  const min = parseInt(m[1], 10);
  const sec = parseInt(m[2], 10);
  if (sec >= 60) return null;
  return min * 60 + sec;
}

export default function QuickWodForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [wodType, setWodType] = useState<WodType>("FORTIME");
  const [scoreType, setScoreType] = useState<ScoreType>("TIME");
  const [scaling, setScaling] = useState<Scaling>("RX");
  const [timeCapInput, setTimeCapInput] = useState(""); // "MM" o "MM:SS"
  const [scoreInput, setScoreInput] = useState(""); // dinámico
  const [scoreReps, setScoreReps] = useState(""); // solo ROUNDS_REPS
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Validación cliente del score parseando según scoreType
    let scoreValue: number;
    let scoreRepsValue: number | null = null;
    if (scoreType === "TIME") {
      const secs = parseTimeMmSs(scoreInput);
      if (secs == null || secs <= 0) {
        setErrors({
          scoreInput: "Tiempo inválido. Usá formato MM:SS o segundos.",
        });
        return;
      }
      scoreValue = secs;
    } else if (scoreType === "ROUNDS_REPS") {
      const rounds = Number(scoreInput);
      const reps = Number(scoreReps || "0");
      if (!Number.isFinite(rounds) || rounds < 0) {
        setErrors({ scoreInput: "Rounds inválido" });
        return;
      }
      if (!Number.isFinite(reps) || reps < 0) {
        setErrors({ scoreReps: "Reps inválido" });
        return;
      }
      scoreValue = rounds;
      scoreRepsValue = reps;
    } else {
      const n = Number(scoreInput);
      if (!Number.isFinite(n) || n < 0) {
        setErrors({ scoreInput: "Valor inválido" });
        return;
      }
      scoreValue = n;
    }

    // Time cap opcional (MM o MM:SS)
    let timeCapSeconds: number | null = null;
    if (timeCapInput.trim()) {
      const tc = parseTimeMmSs(timeCapInput);
      if (tc == null || tc < 0) {
        setErrors({ timeCapInput: "Time cap inválido" });
        return;
      }
      timeCapSeconds = tc;
    }

    startTransition(async () => {
      const result = await createMyQuickWod({
        name,
        type: wodType,
        scoreType,
        timeCapSeconds,
        scoreValue,
        scoreReps: scoreRepsValue,
        scaling,
        notes: notes.trim() || null,
      });
      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        kToast.error(result.message);
        return;
      }
      if (result.pr.isPR) {
        firePRToast(result.pr, result.scoreId);
      } else {
        kToast.success("¡Loggeado!");
      }
      router.push("/atleta");
      router.refresh();
    });
  }

  function firePRToast(pr: QuickWodPR, scoreId: string) {
    const newFormatted = formatScore(pr.newValue, pr.scoreType);
    if (pr.isFirst) {
      fireAchievementToast([
        {
          badgeId: `wod-first-${scoreId}`,
          code: "WOD_FIRST",
          name: `Primer score en ${pr.wodName}`,
          description: `${newFormatted} — tu marca a vencer.`,
          xp: 0,
          eyebrow: "PRIMER REGISTRO",
        },
      ]);
      return;
    }
    const prevFormatted = formatScore(pr.previousBest ?? 0, pr.scoreType);
    fireAchievementToast([
      {
        badgeId: `wod-pr-${scoreId}`,
        code: "WOD_PR",
        name: `¡Nuevo PR en ${pr.wodName}!`,
        description: `${newFormatted} · antes ${prevFormatted}.`,
        xp: 0,
      },
    ]);
  }

  const scoreLabel =
    scoreType === "TIME"
      ? "Tu tiempo (MM:SS o segundos)"
      : scoreType === "REPS"
        ? "Total de reps"
        : scoreType === "WEIGHT"
          ? "Peso (kg)"
          : "Rounds completados";
  const scorePlaceholder =
    scoreType === "TIME"
      ? "5:30"
      : scoreType === "REPS"
        ? "120"
        : scoreType === "WEIGHT"
          ? "100"
          : "5";

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <Field
        label="Nombre del WOD"
        value={name}
        onChange={setName}
        placeholder="Fran, Murph, Helen..."
        required
        error={errors.name}
      />

      <SegmentedField
        label="Tipo"
        value={wodType}
        onChange={(v) => setWodType(v as WodType)}
        options={WOD_TYPES}
      />

      <SegmentedField
        label="Cómo se mide"
        value={scoreType}
        onChange={(v) => setScoreType(v as ScoreType)}
        options={SCORE_TYPES}
      />

      {(wodType === "FORTIME" || wodType === "AMRAP" || wodType === "EMOM") && (
        <Field
          label="Time cap (opcional, MM:SS)"
          value={timeCapInput}
          onChange={setTimeCapInput}
          placeholder="20:00"
          error={errors.timeCapInput}
        />
      )}

      <div
        style={{
          marginTop: 8,
          padding: 16,
          borderRadius: 16,
          background: "var(--k-accent-soft)",
          border: "1px solid var(--k-accent-line)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-accent)",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Tu resultado
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Field
              label={scoreLabel}
              value={scoreInput}
              onChange={setScoreInput}
              placeholder={scorePlaceholder}
              required
              error={errors.scoreInput}
              type={scoreType === "TIME" ? "text" : "number"}
            />
          </div>
          {scoreType === "ROUNDS_REPS" && (
            <div style={{ flex: 1 }}>
              <Field
                label="+ Reps extra"
                value={scoreReps}
                onChange={setScoreReps}
                placeholder="12"
                type="number"
                error={errors.scoreReps}
              />
            </div>
          )}
        </div>
        <div style={{ marginTop: 12 }}>
          <SegmentedField
            label="Escalado"
            value={scaling}
            onChange={(v) => setScaling(v as Scaling)}
            options={SCALINGS}
          />
        </div>
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cómo te sentiste, ajustes que hiciste..."
          rows={3}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line-2)",
            borderRadius: 12,
            color: "var(--k-t1)",
            fontSize: 13,
            fontFamily: "var(--k-font-body)",
            resize: "vertical",
            outline: "none",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad"
        style={{
          padding: "16px 24px",
          borderRadius: 16,
          fontWeight: 700,
          fontSize: 14,
          marginTop: 8,
          opacity: pending ? 0.5 : 1,
          cursor: pending ? "wait" : "pointer",
        }}
      >
        {pending ? "Guardando…" : "Guardar WOD + score"}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  type?: "text" | "number";
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}{" "}
        {required ? <span style={{ color: "var(--k-accent)" }}>*</span> : null}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={type === "number" ? "decimal" : undefined}
        style={{
          width: "100%",
          padding: "12px 14px",
          background: "var(--k-elevated)",
          border: `1px solid ${error ? "var(--k-danger, #ff5a5a)" : "var(--k-line-2)"}`,
          borderRadius: 12,
          color: "var(--k-t1)",
          fontSize: 14,
          fontFamily: "var(--k-font-body)",
          outline: "none",
        }}
      />
      {error ? (
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 11,
            color: "var(--k-danger, #ff5a5a)",
          }}
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

type SegmentedProps<T extends string> = {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
};

function SegmentedField<T extends string>({
  label,
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          padding: 4,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line-2)",
          borderRadius: 12,
        }}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              style={{
                flex: "1 1 auto",
                padding: "10px 12px",
                borderRadius: 8,
                border: "none",
                background: active ? "var(--k-accent)" : "transparent",
                color: active ? "var(--k-accent-on)" : "var(--k-t2)",
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "background 120ms",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
