"use client";

import { useState, useTransition } from "react";
import { submitScore } from "@/server/actions/scores";
import { scalings } from "@/lib/validations/score";
import { defaultUnit, timeStringToSeconds } from "@/lib/validations/score";
import type { ScoreType } from "@/lib/validations/wod";
import { kToast } from "@/lib/toast";
import { fireAchievementToast } from "@/components/atleta/AchievementToast";
import { JargonTip } from "@/components/kronos/JargonTip";

const ERROR_RED = "#ff5e5e";

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--k-font-display)",
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--k-t3)",
};

const inputStyle: React.CSSProperties = {
  background: "var(--k-elevated)",
  border: "1px solid var(--k-line)",
  borderRadius: 10,
  color: "var(--k-t1)",
  fontFamily: "var(--k-font-display)",
  fontSize: 16,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  padding: "10px 12px",
  outline: "none",
  width: "100%",
};

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
        // Si hay logro desbloqueado, AchievementToast es la única celebración
        // (premium, top-center, +XP, confetti). El kToast genérico se suprime
        // para evitar overlap visual en mobile.
        if (res.unlockedBadges?.length) {
          fireAchievementToast(res.unlockedBadges);
          setFeedback(
            res.prAchieved ? "NUEVO PR REGISTRADO" : "SCORE GUARDADO",
          );
        } else if (res.prAchieved) {
          kToast.success("🏆 ¡Nuevo PR registrado!", {
            description: "Tu mejor marca personal ha sido actualizada.",
            duration: 5000,
          });
          setFeedback("NUEVO PR REGISTRADO");
        } else {
          kToast.success("Score guardado");
          setFeedback("SCORE GUARDADO");
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
    <div
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--k-accent)",
        }}
      >
        Subir mi score
      </span>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-[2fr_1fr]">
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Resultado · {scoreType}</span>
            <input
              name="value"
              placeholder={placeholder}
              required
              autoComplete="off"
              inputMode={scoreType === "TIME" ? "numeric" : "decimal"}
              pattern={scoreType === "TIME" ? "[0-9:]*" : "[0-9.,]*"}
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--k-accent)";
                e.currentTarget.style.boxShadow = "var(--k-accent-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--k-line)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={labelStyle}>Unidad</span>
            <input
              name="unit"
              defaultValue={defaultUnit(scoreType)}
              autoComplete="off"
              inputMode="text"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--k-accent)";
                e.currentTarget.style.boxShadow = "var(--k-accent-glow)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--k-line)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </label>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ ...labelStyle, display: "inline-flex", gap: 6 }}>
            Escalado
            <JargonTip term="RX" />
            <JargonTip term="SCALED" />
            <JargonTip term="RXPLUS" />
          </span>
          <select
            name="scaling"
            defaultValue="RX"
            style={{
              ...inputStyle,
              fontFamily: "var(--k-font-body)",
              fontWeight: 500,
              fontSize: 14,
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a8a94' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: 32,
            }}
          >
            {scalings.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={labelStyle}>Notas (opcional)</span>
          <textarea
            name="notes"
            placeholder="Cómo se sintió, qué falta…"
            rows={2}
            maxLength={500}
            style={{
              ...inputStyle,
              fontFamily: "var(--k-font-body)",
              fontWeight: 400,
              fontSize: 13,
              resize: "none",
              lineHeight: 1.4,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--k-accent)";
              e.currentTarget.style.boxShadow = "var(--k-accent-glow)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--k-line)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </label>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: ERROR_RED,
              margin: 0,
            }}
          >
            {error}
          </p>
        )}
        {feedback && (
          <p
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--k-accent)",
              margin: 0,
            }}
          >
            {feedback}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            background: isPending ? "var(--k-elevated)" : "var(--k-accent)",
            color: isPending ? "var(--k-t2)" : "var(--k-accent-on)",
            border: "none",
            borderRadius: 12,
            padding: "13px 16px",
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            cursor: isPending ? "wait" : "pointer",
            transition: "background 120ms ease, box-shadow 120ms ease",
            boxShadow: isPending ? "none" : "var(--k-accent-glow)",
          }}
        >
          {isPending ? "Guardando…" : "Guardar score"}
        </button>
      </form>
    </div>
  );
}
