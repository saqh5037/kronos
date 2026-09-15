"use client";

import { KronosLineChart } from "@/components/charts/kronos-chart";
import type { BodyMetricHistoryPoint } from "@/server/actions/body-metrics";

const fmtDay = (k: unknown) => {
  if (typeof k !== "string") return String(k ?? "");
  const [, m, d] = k.split("-");
  return `${d}/${m}`;
};

type Props = {
  data: BodyMetricHistoryPoint[];
  /** Optional target weight line, slice 2 fills this in. */
  targetValue?: number | null;
  unit?: string;
};

export function WeightChart({ data, targetValue, unit = "kg" }: Props) {
  if (data.length === 0) {
    return (
      <div
        style={{
          margin: "0 16px 18px",
          padding: "26px 16px",
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          borderRadius: 14,
          textAlign: "center",
          color: "var(--k-t3)",
          fontFamily: "var(--k-font-body)",
          fontSize: 13,
        }}
      >
        Aún no hay historial de peso. Tras 2 registros verás la evolución.
      </div>
    );
  }

  const referenceLines =
    typeof targetValue === "number"
      ? [
          {
            y: targetValue,
            color: "var(--k-accent)",
            label: `META ${targetValue} ${unit}`,
            dashed: true,
          },
        ]
      : undefined;

  return (
    <div style={{ margin: "0 16px 18px" }}>
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        Peso 90 días
      </div>
      <div
        style={{
          padding: 8,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          borderRadius: 14,
        }}
      >
        {/* One encoding per chart: the cinematic variant drew bars *and* a
            line over the same series, and the y-axis ticks landed on top of
            the bars (audit 2026-09-15). Bars off — the line is the series. */}
        <KronosLineChart
          data={data}
          xKey="date"
          yKey="value"
          variant="cinematic"
          bars={false}
          height={220}
          gradient
          formatY={(v) => `${Math.round(v * 10) / 10}`}
          formatX={fmtDay}
          referenceLines={referenceLines}
          ariaLabel="Evolución del peso en los últimos 90 días"
        />
      </div>
    </div>
  );
}
