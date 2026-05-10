"use client";

import { useState, useTransition } from "react";
import {
  createBodyMetric,
  deleteBodyMetric,
  type BodyMetricEntry,
} from "@/server/actions/body-metrics";
import type { BodyMetricType } from "@/lib/validations/body-metric";

type Props = {
  initial: BodyMetricEntry[];
  defaultUnit: "kg" | "lb";
};

const TYPE_LABEL: Record<BodyMetricType, string> = {
  WEIGHT: "Peso",
  BODY_FAT: "% Grasa",
  MUSCLE_MASS: "Masa muscular",
  BMI: "IMC",
  CUSTOM: "Personalizado",
};

const TYPE_DEFAULT_UNIT: Record<
  BodyMetricType,
  (defaultWeightUnit: "kg" | "lb") => string
> = {
  WEIGHT: (u) => u,
  BODY_FAT: () => "%",
  MUSCLE_MASS: (u) => u,
  BMI: () => "",
  CUSTOM: () => "",
};

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
}

function trendBetween(
  curr: number,
  prev: number | null,
): "up" | "down" | "flat" {
  if (prev === null || curr === prev) return "flat";
  return curr > prev ? "up" : "down";
}

export default function BodyMetricSection({ initial, defaultUnit }: Props) {
  const [entries, setEntries] = useState<BodyMetricEntry[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<BodyMetricType>("WEIGHT");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState<string>(defaultUnit);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setValue("");
    setLabel("");
    setUnit(TYPE_DEFAULT_UNIT[type](defaultUnit));
    setError(null);
  }

  function handleTypeChange(next: BodyMetricType) {
    setType(next);
    setUnit(TYPE_DEFAULT_UNIT[next](defaultUnit));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const numericValue = Number(value);
    if (!numericValue || numericValue <= 0 || numericValue >= 1000) {
      setError("Valor inválido");
      return;
    }
    if (type === "CUSTOM" && !label.trim()) {
      setError("Indica el nombre de la métrica");
      return;
    }
    if (!unit && type !== "BMI") {
      setError("Indica la unidad");
      return;
    }
    startTransition(async () => {
      try {
        const created = await createBodyMetric({
          type,
          value: numericValue,
          unit: unit || "—",
          label: type === "CUSTOM" ? label.trim() : null,
        });
        setEntries((prev) => [created, ...prev]);
        resetForm();
        setShowForm(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo guardar");
      }
    });
  }

  function handleDelete(id: string) {
    if (typeof window !== "undefined") {
      const ok = window.confirm("¿Borrar esta medición?");
      if (!ok) return;
    }
    startTransition(async () => {
      try {
        await deleteBodyMetric(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } catch {
        setError("No se pudo borrar");
      }
    });
  }

  const grouped = groupByType(entries);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {entries.length === 0 && !showForm && (
        <div
          style={{
            padding: 20,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-line)",
            borderRadius: 14,
            textAlign: "center",
            color: "var(--k-t2)",
            fontFamily: "var(--k-font-body)",
            fontSize: 13,
          }}
        >
          Aún no registras métricas. Empieza con tu peso para correlacionar
          composición con rendimiento.
        </div>
      )}

      {grouped.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {grouped.map((g) => (
            <MetricRow
              key={`${g.type}-${g.label ?? ""}`}
              group={g}
              onDelete={handleDelete}
              isPending={isPending}
            />
          ))}
        </div>
      )}

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

      {!showForm ? (
        <button
          type="button"
          className="k-tap"
          onClick={() => {
            setShowForm(true);
            resetForm();
          }}
          style={{
            padding: "10px 16px",
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            border: "none",
            borderRadius: 12,
            fontFamily: "var(--k-font-display)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "var(--k-accent-glow)",
            alignSelf: "flex-start",
          }}
        >
          + Registrar medición
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: 16,
            background: "var(--k-elevated)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <label style={fieldLabelStyle}>
            Tipo
            <select
              value={type}
              onChange={(e) =>
                handleTypeChange(e.target.value as BodyMetricType)
              }
              style={inputStyle}
            >
              {(Object.keys(TYPE_LABEL) as BodyMetricType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>

          {type === "CUSTOM" && (
            <label style={fieldLabelStyle}>
              Nombre
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Cintura"
                maxLength={40}
                style={inputStyle}
              />
            </label>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <label style={{ ...fieldLabelStyle, flex: 1 }}>
              Valor
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                style={inputStyle}
              />
            </label>
            <label style={{ ...fieldLabelStyle, width: 90 }}>
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

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="submit"
              disabled={isPending}
              className="k-tap"
              style={{
                flex: 1,
                padding: "10px 16px",
                background: "var(--k-accent)",
                color: "var(--k-accent-on)",
                border: "none",
                borderRadius: 10,
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: isPending ? "wait" : "pointer",
                opacity: isPending ? 0.6 : 1,
              }}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="k-tap"
              style={{
                padding: "10px 16px",
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
      )}
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 4,
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
  borderRadius: 8,
  color: "var(--k-t1)",
  fontFamily: "var(--k-font-body)",
  fontSize: 14,
  fontWeight: 500,
  letterSpacing: "0",
  textTransform: "none",
  outline: "none",
};

type MetricGroup = {
  type: BodyMetricType;
  label: string | null;
  current: BodyMetricEntry;
  previous: BodyMetricEntry | null;
};

function groupByType(entries: BodyMetricEntry[]): MetricGroup[] {
  const map = new Map<string, BodyMetricEntry[]>();
  for (const e of entries) {
    const key = `${e.type}:${e.label ?? ""}`;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }
  const groups: MetricGroup[] = [];
  for (const [, list] of map) {
    list.sort((a, b) => b.measuredAt.getTime() - a.measuredAt.getTime());
    const current = list[0]!;
    const previous = list[1] ?? null;
    groups.push({
      type: current.type,
      label: current.label,
      current,
      previous,
    });
  }
  groups.sort(
    (a, b) => b.current.measuredAt.getTime() - a.current.measuredAt.getTime(),
  );
  return groups;
}

function MetricRow({
  group,
  onDelete,
  isPending,
}: {
  group: MetricGroup;
  onDelete: (id: string) => void;
  isPending: boolean;
}) {
  const trend = trendBetween(
    group.current.value,
    group.previous?.value ?? null,
  );
  const trendArrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";
  const trendColor =
    trend === "flat"
      ? "var(--k-t3)"
      : group.type === "WEIGHT" || group.type === "BODY_FAT"
        ? trend === "down"
          ? "var(--k-accent)"
          : "var(--k-warning)"
        : trend === "up"
          ? "var(--k-accent)"
          : "var(--k-warning)";
  const delta =
    group.previous !== null
      ? Math.abs(group.current.value - group.previous.value).toFixed(1)
      : null;
  const labelText = group.label ?? TYPE_LABEL[group.type];

  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--k-t3)",
            textTransform: "uppercase",
          }}
        >
          {labelText}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 22,
              fontWeight: 700,
              color: "var(--k-t1)",
              letterSpacing: "-0.01em",
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {group.current.value}
          </span>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--k-t3)",
              letterSpacing: "0.04em",
            }}
          >
            {group.current.unit}
          </span>
          {delta !== null && (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                color: trendColor,
                marginLeft: 6,
              }}
            >
              {trendArrow} {delta}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t3)",
            marginTop: 1,
          }}
        >
          {formatDate(group.current.measuredAt)}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(group.current.id)}
        disabled={isPending}
        aria-label="Borrar última medición"
        className="k-tap"
        style={{
          background: "transparent",
          border: "1px solid var(--k-line)",
          color: "var(--k-t3)",
          padding: "6px 10px",
          borderRadius: 8,
          cursor: isPending ? "wait" : "pointer",
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        ✕
      </button>
    </div>
  );
}
