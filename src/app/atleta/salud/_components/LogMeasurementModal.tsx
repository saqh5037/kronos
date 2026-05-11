"use client";

import { useState, useTransition, useEffect } from "react";
import {
  bodyMetricTypes,
  BODY_METRIC_LABEL,
  type BodyMetricType,
} from "@/lib/validations/body-metric";
import { defaultUnitFor } from "@/lib/wellness/calculations";
import { createBodyMetric } from "@/server/actions/body-metrics";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /**
   * Optional override: when provided, this function persists instead of the
   * default atleta-self action. Used by the admin/coach flow (slice 3).
   */
  saveAction?: (payload: BodyMetricFormPayload) => Promise<unknown>;
  /** Restrict the type picker to a single type (used by admin sub-flows). */
  fixedType?: BodyMetricType;
};

export type BodyMetricFormPayload = {
  type: BodyMetricType;
  value: number;
  unit: string;
  label: string | null;
  measuredAt: Date;
  notes: string | null;
};

const SELECTABLE_TYPES: BodyMetricType[] = bodyMetricTypes.filter(
  (t) => t !== "BMI",
);

function isoToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function LogMeasurementModal({
  open,
  onClose,
  onSaved,
  saveAction,
  fixedType,
}: Props) {
  const [type, setType] = useState<BodyMetricType>(fixedType ?? "WEIGHT");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(
    defaultUnitFor(fixedType ?? "WEIGHT"),
  );
  const [label, setLabel] = useState("");
  // Hydration-safe: server renders blank, client populates after mount.
  const [measuredAt, setMeasuredAt] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (open && !measuredAt) {
      setMeasuredAt(isoToday());
    }
  }, [open, measuredAt]);

  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleTypeChange(next: BodyMetricType) {
    setType(next);
    setUnit(defaultUnitFor(next));
    if (next !== "CUSTOM") setLabel("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericValue = Number(value);
    if (!numericValue || numericValue <= 0 || numericValue >= 1000) {
      setError("Valor inválido (entre 0 y 1000).");
      return;
    }
    if (type === "CUSTOM" && !label.trim()) {
      setError("Indica el nombre de la métrica.");
      return;
    }
    const finalUnit = unit.trim() || defaultUnitFor(type);
    if (!finalUnit) {
      setError("Indica la unidad.");
      return;
    }
    startTransition(async () => {
      try {
        const payload: BodyMetricFormPayload = {
          type,
          value: numericValue,
          unit: finalUnit,
          label: type === "CUSTOM" ? label.trim() : null,
          measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
          notes: notes.trim() || null,
        };
        if (saveAction) {
          await saveAction(payload);
        } else {
          await createBodyMetric(payload);
        }
        // Reset light state; parent reloads via onSaved.
        setValue("");
        setLabel("");
        setNotes("");
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
      aria-labelledby="log-measurement-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: 0,
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
            id="log-measurement-title"
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "var(--k-t1)",
              textTransform: "uppercase",
            }}
          >
            Nueva medición
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

        {!fixedType && (
          <label style={labelStyle}>
            Tipo
            <select
              value={type}
              onChange={(e) =>
                handleTypeChange(e.target.value as BodyMetricType)
              }
              style={inputStyle}
            >
              {SELECTABLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BODY_METRIC_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        )}

        {type === "CUSTOM" && (
          <label style={labelStyle}>
            Nombre
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej: Pantorrilla"
              maxLength={40}
              style={inputStyle}
            />
          </label>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <label style={{ ...labelStyle, flex: 1 }}>
            Valor
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="0"
              autoFocus
              style={inputStyle}
            />
          </label>
          <label style={{ ...labelStyle, width: 96 }}>
            Unidad
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              maxLength={10}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Fecha
          <input
            type="date"
            value={measuredAt}
            onChange={(e) => setMeasuredAt(e.target.value)}
            max={isoToday()}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Notas (opcional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: ayuno 8h, ropa ligera"
            maxLength={500}
            rows={2}
            style={{
              ...inputStyle,
              fontFamily: "var(--k-font-body)",
              resize: "vertical",
            }}
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
            {isPending ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="k-tap"
            style={{
              padding: "12px 16px",
              background: "transparent",
              color: "var(--k-t2)",
              border: "1px solid var(--k-line)",
              borderRadius: 10,
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
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
  letterSpacing: "0",
  textTransform: "none",
  outline: "none",
};
