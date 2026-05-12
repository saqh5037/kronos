"use client";

import { useState, useTransition, useEffect } from "react";
import { createGoal } from "@/server/actions/goals";
import type { LatestByType } from "@/server/actions/body-metrics";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  latest: LatestByType[];
};

function defaultDeadlineISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

export function GoalForm({ open, onClose, onSaved, latest }: Props) {
  const [unit, setUnit] = useState<"kg" | "%">("kg");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hydration-safe defaults populated client-side only.
  useEffect(() => {
    if (open && !deadline) setDeadline(defaultDeadlineISO());
    if (!open) setError(null);
  }, [open, deadline]);

  if (!open) return null;

  const currentLatest = latest.find((l) =>
    unit === "kg" ? l.type === "WEIGHT" : l.type === "BODY_FAT",
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = Number(target);
    if (!t || t <= 0 || t >= 1000) {
      setError("Valor inválido.");
      return;
    }
    if (!deadline) {
      setError("Indica una fecha límite.");
      return;
    }
    startTransition(async () => {
      try {
        await createGoal({
          metric: "BODY_COMPOSITION",
          targetValue: t,
          unit,
          deadline: new Date(deadline),
        });
        setTarget("");
        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar.");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-form-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "var(--k-surface)",
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          border: "1px solid var(--k-line)",
          borderBottom: "none",
          padding: "18px 18px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <h2
            id="goal-form-title"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--k-t1)",
              textTransform: "uppercase",
            }}
          >
            Nueva meta
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="k-tap"
            style={{
              background: "transparent",
              border: "1px solid var(--k-line)",
              color: "var(--k-t2)",
              width: 32,
              height: 32,
              borderRadius: 10,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        <fieldset
          style={{
            border: "none",
            padding: 0,
            display: "flex",
            gap: 8,
          }}
        >
          <legend
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--k-t3)",
              marginBottom: 6,
            }}
          >
            Qué quiero mover
          </legend>
          <UnitChip
            label="Peso (kg)"
            active={unit === "kg"}
            onClick={() => setUnit("kg")}
          />
          <UnitChip
            label="% Grasa"
            active={unit === "%"}
            onClick={() => setUnit("%")}
          />
        </fieldset>

        {currentLatest && (
          <div
            style={{
              padding: "8px 12px",
              background: "var(--k-bg)",
              border: "1px solid var(--k-line)",
              borderRadius: 10,
              fontFamily: "var(--k-font-body)",
              fontSize: 12,
              color: "var(--k-t2)",
            }}
          >
            Punto de partida:{" "}
            <span style={{ color: "var(--k-t1)", fontWeight: 600 }}>
              {currentLatest.latest.value} {currentLatest.latest.unit}
            </span>
          </div>
        )}

        <label style={labelStyle}>
          Objetivo
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={unit === "kg" ? "72.0" : "18.0"}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Fecha límite
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: 10,
              background: "var(--k-elevated)",
              border: "1px solid var(--k-danger)",
              borderRadius: 10,
              color: "var(--k-danger)",
              fontFamily: "var(--k-font-body)",
              fontSize: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button
            type="submit"
            disabled={isPending}
            className="k-tap"
            style={{
              flex: 1,
              padding: "12px 16px",
              background: "var(--k-accent)",
              color: "var(--k-accent-on)",
              border: "none",
              borderRadius: 10,
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              cursor: isPending ? "wait" : "pointer",
              opacity: isPending ? 0.6 : 1,
              boxShadow: "var(--k-accent-glow)",
            }}
          >
            {isPending ? "Guardando…" : "Crear meta"}
          </button>
        </div>
      </form>
    </div>
  );
}

function UnitChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="k-tap"
      aria-pressed={active}
      style={{
        padding: "8px 14px",
        background: active ? "var(--k-t1)" : "transparent",
        color: active ? "var(--k-bg)" : "var(--k-t2)",
        border: active ? "1px solid var(--k-t2)" : "1px solid var(--k-line)",
        borderRadius: 999,
        fontFamily: "var(--k-font-display)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

const labelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  fontFamily: "var(--k-font-display)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--k-t3)",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  background: "var(--k-bg)",
  border: "1px solid var(--k-line-2)",
  borderRadius: 10,
  color: "var(--k-t1)",
  fontFamily: "var(--k-font-display)",
  fontSize: 14,
  fontWeight: 600,
  outline: "none",
};
