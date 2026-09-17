"use client";

/**
 * AthleteScoreForm — the athlete-facing score form on /atleta/wod.
 *
 * Replaces the shared `@/components/ScoreForm` on this route. Audit
 * 2026-09-15 (P1 forms, top-10 issue #2) listed what the old form got wrong:
 *
 *  - "ej. 5:30" placeholder on a 60-minute cap, and a free "UNIDAD" text field
 *    prefilled with "s" next to it → the input is now type-aware (mm:ss mask
 *    for TIME, kg stepper for WEIGHT, reps counter for REPS, rounds+reps pair
 *    for ROUNDS_REPS) and the unit is derived, never typed.
 *  - No way to record a time cap → "Llegué al cap" toggle turns the input into
 *    "reps completadas" for a capped TIME WOD.
 *  - Three identical "?" pills next to ESCALADO explaining nothing → one
 *    segmented RX / Escalado / RX+ control with a single info sheet.
 *  - No "tu último Murph" autofill → the last score is shown and one tap
 *    fills it in.
 *  - The form started ~830 px down with no sticky CTA → the submit button is
 *    sticky at the bottom on mobile, with safe-area padding.
 *
 * Parsing lives in `@/lib/scores/input` (pure, tested); this component only
 * wires it to inputs.
 */

import { useMemo, useState, useTransition } from "react";
import { ChevronDown, Info, Minus, Plus, X } from "lucide-react";
import { submitScore } from "@/server/actions/scores";
import { scalings, defaultUnit } from "@/lib/validations/score";
import type { Scaling } from "@/lib/validations/score";
import type { ScoreType } from "@/lib/validations/wod";
import { scalingLabel, scoreTypeLabel } from "@/lib/labels";
import {
  maskTimeInput,
  parseTimeToSeconds,
  formatSecondsAsTime,
  parseRoundsReps,
  clampWeight,
  stepWeight,
  stepReps,
  WEIGHT_STEP_KG,
} from "@/lib/scores/input";
import { formatScore } from "@/lib/scores";
import { kToast } from "@/lib/toast";
import { fireAchievementToast } from "@/components/atleta/AchievementToast";

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
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: "-0.01em",
  padding: "12px 14px",
  outline: "none",
  width: "100%",
  textAlign: "center",
};

const stepperButtonStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 12,
  background: "var(--k-elevated)",
  border: "1px solid var(--k-line)",
  color: "var(--k-t1)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

/** One sheet for all three scaling options — replaces three identical "?" pills. */
const SCALING_HELP: Record<Scaling, string> = {
  RX: "Hiciste el WOD tal como está escrito: mismos pesos, mismas alturas, mismos movimientos.",
  SCALED:
    "Ajustaste algo para poder completarlo: menos peso, una variante más sencilla o menos repeticiones.",
  RXPLUS:
    "Subiste la exigencia por encima de RX: más peso o una variante más difícil.",
};

export type LastScore = {
  value: number;
  unit: string;
  scaling: string;
  createdAt: Date;
} | null;

export default function AthleteScoreForm({
  wodId,
  wodName,
  scoreType,
  classId,
  timeCap,
  lastScore,
}: {
  wodId: string;
  wodName: string;
  scoreType: ScoreType;
  classId?: string;
  /** Minutes, when the WOD has a cap. Enables the "llegué al cap" toggle. */
  timeCap?: number | null;
  lastScore?: LastScore;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const [scaling, setScaling] = useState<Scaling>("RX");
  const [timeText, setTimeText] = useState("");
  const [cappedOut, setCappedOut] = useState(false);
  const [weight, setWeight] = useState(0);
  const [reps, setReps] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [partialReps, setPartialReps] = useState(0);
  const [notes, setNotes] = useState("");

  const hasCap = scoreType === "TIME" && typeof timeCap === "number" && timeCap > 0;
  // A capped TIME WOD that was not finished is scored in reps completed.
  const effectiveType: ScoreType =
    hasCap && cappedOut ? "REPS" : scoreType;

  const lastScoreLabel = useMemo(() => {
    if (!lastScore) return null;
    const scalingName =
      scalingLabel[lastScore.scaling as Scaling] ?? lastScore.scaling;
    return `${formatScore(lastScore.value, scoreType)} (${scalingName})`;
  }, [lastScore, scoreType]);

  function applyLastScore() {
    if (!lastScore) return;
    setScaling(
      (scalings as readonly string[]).includes(lastScore.scaling)
        ? (lastScore.scaling as Scaling)
        : "RX",
    );
    if (scoreType === "TIME") {
      setTimeText(formatSecondsAsTime(lastScore.value));
      setCappedOut(false);
    } else if (scoreType === "WEIGHT") {
      setWeight(clampWeight(lastScore.value));
    } else if (scoreType === "REPS") {
      setReps(Math.round(lastScore.value));
    } else {
      const whole = Math.floor(lastScore.value);
      setRounds(whole);
      setPartialReps(Math.round((lastScore.value - whole) * 100));
    }
  }

  /** Returns the stored value, or an error message. */
  function resolveValue(): { value: number } | { error: string } {
    if (effectiveType === "TIME") {
      const seconds = parseTimeToSeconds(timeText);
      if (seconds === null || seconds <= 0) {
        return { error: "Escribe tu tiempo como mm:ss (ejemplo 12:30)." };
      }
      return { value: seconds };
    }
    if (effectiveType === "WEIGHT") {
      if (weight <= 0) return { error: "Indica el peso que levantaste." };
      return { value: clampWeight(weight) };
    }
    if (effectiveType === "REPS") {
      if (reps <= 0) return { error: "Indica cuántas repeticiones completaste." };
      return { value: Math.round(reps) };
    }
    const packed = parseRoundsReps(rounds, partialReps);
    if (packed === null || packed <= 0) {
      return { error: "Indica las rondas y las repeticiones parciales (0-99)." };
    }
    return { value: packed };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    const resolved = resolveValue();
    if ("error" in resolved) {
      setError(resolved.error);
      return;
    }

    const data = {
      wodId,
      classId: classId ?? null,
      value: resolved.value,
      unit: defaultUnit(effectiveType),
      scaling,
      notes: notes.trim() || undefined,
    };

    startTransition(async () => {
      try {
        const res = await submitScore(data);
        setTimeText("");
        setWeight(0);
        setReps(0);
        setRounds(0);
        setPartialReps(0);
        setNotes("");
        setCappedOut(false);
        if (res.unlockedBadges?.length) {
          fireAchievementToast(res.unlockedBadges);
          setFeedback(
            res.prAchieved ? "NUEVO PR REGISTRADO" : "RESULTADO GUARDADO",
          );
        } else if (res.prAchieved) {
          kToast.success("Nuevo PR registrado", {
            description: "Tu mejor marca personal quedó actualizada.",
            duration: 5000,
          });
          setFeedback("NUEVO PR REGISTRADO");
        } else {
          kToast.success("Resultado guardado");
          setFeedback("RESULTADO GUARDADO");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error al guardar";
        kToast.error(msg);
        setError(msg);
      }
    });
  }

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
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--k-accent)",
        }}
      >
        Registrar mi resultado
      </span>

      {lastScoreLabel && (
        <button
          type="button"
          onClick={applyLastScore}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            textAlign: "left",
            padding: "10px 12px",
            borderRadius: 10,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            color: "var(--k-t2)",
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          <span>
            Tu último {wodName}:{" "}
            <strong style={{ color: "var(--k-t1)" }}>{lastScoreLabel}</strong>
          </span>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--k-accent)",
              flexShrink: 0,
            }}
          >
            Usar
          </span>
        </button>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* ── Type-aware value input ───────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={labelStyle}>
            {scoreTypeLabel[effectiveType]}
            {hasCap && !cappedOut ? ` · cap ${timeCap}'` : ""}
          </span>

          {effectiveType === "TIME" && (
            <input
              name="value"
              value={timeText}
              onChange={(e) => setTimeText(maskTimeInput(e.target.value))}
              placeholder="mm:ss"
              inputMode="numeric"
              autoComplete="off"
              aria-label="Tiempo en minutos y segundos"
              style={inputStyle}
            />
          )}

          {effectiveType === "WEIGHT" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                aria-label={`Quitar ${WEIGHT_STEP_KG} kilos`}
                onClick={() => setWeight((w) => stepWeight(w, -1))}
                style={stepperButtonStyle}
              >
                <Minus width={18} height={18} aria-hidden />
              </button>
              <input
                value={weight === 0 ? "" : String(weight)}
                onChange={(e) =>
                  setWeight(clampWeight(Number(e.target.value.replace(",", "."))))
                }
                placeholder="0"
                inputMode="decimal"
                aria-label="Peso en kilos"
                style={inputStyle}
              />
              <button
                type="button"
                aria-label={`Agregar ${WEIGHT_STEP_KG} kilos`}
                onClick={() => setWeight((w) => stepWeight(w, 1))}
                style={stepperButtonStyle}
              >
                <Plus width={18} height={18} aria-hidden />
              </button>
            </div>
          )}

          {effectiveType === "REPS" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                aria-label="Quitar una repetición"
                onClick={() => setReps((r) => stepReps(r, -1))}
                style={stepperButtonStyle}
              >
                <Minus width={18} height={18} aria-hidden />
              </button>
              <input
                value={reps === 0 ? "" : String(reps)}
                onChange={(e) =>
                  setReps(stepReps(Number(e.target.value) || 0, 0))
                }
                placeholder="0"
                inputMode="numeric"
                aria-label="Repeticiones completadas"
                style={inputStyle}
              />
              <button
                type="button"
                aria-label="Agregar una repetición"
                onClick={() => setReps((r) => stepReps(r, 1))}
                style={stepperButtonStyle}
              >
                <Plus width={18} height={18} aria-hidden />
              </button>
            </div>
          )}

          {effectiveType === "ROUNDS_REPS" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <label style={{ flex: 1 }}>
                <span style={{ ...labelStyle, display: "block", marginBottom: 6 }}>
                  Rondas
                </span>
                <input
                  value={rounds === 0 ? "" : String(rounds)}
                  onChange={(e) =>
                    setRounds(stepReps(Number(e.target.value) || 0, 0))
                  }
                  placeholder="0"
                  inputMode="numeric"
                  aria-label="Rondas completas"
                  style={inputStyle}
                />
              </label>
              <span
                aria-hidden
                style={{
                  fontFamily: "var(--k-font-display)",
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--k-t3)",
                  marginTop: 18,
                }}
              >
                +
              </span>
              <label style={{ flex: 1 }}>
                <span style={{ ...labelStyle, display: "block", marginBottom: 6 }}>
                  Reps
                </span>
                <input
                  value={partialReps === 0 ? "" : String(partialReps)}
                  onChange={(e) =>
                    setPartialReps(
                      Math.min(99, stepReps(Number(e.target.value) || 0, 0)),
                    )
                  }
                  placeholder="0"
                  inputMode="numeric"
                  aria-label="Repeticiones de la ronda incompleta"
                  style={inputStyle}
                />
              </label>
            </div>
          )}

          {hasCap && (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                background: cappedOut
                  ? "var(--k-accent-soft)"
                  : "var(--k-elevated)",
                border: `1px solid ${cappedOut ? "var(--k-accent-line)" : "var(--k-line)"}`,
                cursor: "pointer",
                minHeight: 44,
              }}
            >
              <input
                type="checkbox"
                checked={cappedOut}
                onChange={(e) => setCappedOut(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--k-accent)" }}
              />
              <span
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: cappedOut ? "var(--k-t1)" : "var(--k-t2)",
                }}
              >
                Llegué al cap de {timeCap}&apos; — registro reps completadas
              </span>
            </label>
          )}
        </div>

        {/* ── Scaling segmented control + ONE info sheet ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={labelStyle}>Escala</span>
            <button
              type="button"
              onClick={() => setShowHelp((v) => !v)}
              aria-expanded={showHelp}
              aria-label="Qué significa cada escala"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                border: "none",
                color: "var(--k-t2)",
                cursor: "pointer",
                fontFamily: "var(--k-font-display)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                padding: "6px 2px",
                minHeight: 32,
              }}
            >
              {showHelp ? (
                <X width={13} height={13} aria-hidden />
              ) : (
                <Info width={13} height={13} aria-hidden />
              )}
              Qué significa
            </button>
          </div>

          <div
            role="radiogroup"
            aria-label="Escala"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 4,
              padding: 4,
              borderRadius: 12,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
            }}
          >
            {scalings.map((s) => {
              const active = scaling === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setScaling(s)}
                  style={{
                    minHeight: 40,
                    borderRadius: 9,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "var(--k-font-display)",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    background: active ? "var(--k-accent)" : "transparent",
                    color: active ? "var(--k-accent-on)" : "var(--k-t2)",
                  }}
                >
                  {scalingLabel[s]}
                </button>
              );
            })}
          </div>

          {showHelp && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {scalings.map((s) => (
                <p
                  key={s}
                  style={{
                    margin: 0,
                    fontFamily: "var(--k-font-body)",
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: "var(--k-t2)",
                  }}
                >
                  <strong style={{ color: "var(--k-t1)" }}>
                    {scalingLabel[s]}
                  </strong>{" "}
                  — {SCALING_HELP[s]}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        <details>
          <summary
            style={{
              ...labelStyle,
              cursor: "pointer",
              listStyle: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              minHeight: 32,
            }}
          >
            <ChevronDown width={13} height={13} aria-hidden />
            Nota (opcional)
          </summary>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cómo se sintió, qué ajustaste…"
            rows={2}
            maxLength={500}
            style={{
              ...inputStyle,
              marginTop: 8,
              fontFamily: "var(--k-font-body)",
              fontWeight: 400,
              fontSize: 13,
              textAlign: "left",
              resize: "none",
              lineHeight: 1.4,
            }}
          />
        </details>

        {error && (
          <p
            role="alert"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "var(--k-danger)",
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

        {/*
          Sticky on mobile so the primary action is always reachable — the form
          starts ~830 px down the WOD page (audit 2026-09-15, P1 hierarchy).
          Static from `sm` up, where the whole form fits on screen.
        */}
        <div
          style={{
            position: "sticky",
            bottom: 0,
            marginLeft: -16,
            marginRight: -16,
            marginBottom: -16,
            padding: "12px 16px",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
            background: "var(--k-surface)",
            borderTop: "1px solid var(--k-line)",
            zIndex: 5,
          }}
        >
          <button
            type="submit"
            disabled={isPending}
            style={{
              width: "100%",
              background: isPending ? "var(--k-elevated)" : "var(--k-accent)",
              color: isPending ? "var(--k-t2)" : "var(--k-accent-on)",
              border: "none",
              borderRadius: 12,
              minHeight: 48,
              padding: "13px 16px",
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              cursor: isPending ? "wait" : "pointer",
              transition: "background 120ms ease",
            }}
          >
            {isPending ? "Guardando…" : "Registrar resultado"}
          </button>
        </div>
      </form>
    </div>
  );
}
