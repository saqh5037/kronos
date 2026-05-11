"use client";

import type { LatestByType } from "@/server/actions/body-metrics";
import { BODY_METRIC_LABEL } from "@/lib/validations/body-metric";

type Props = {
  latest: LatestByType[];
};

const HIDDEN_FROM_GRID = new Set(["WEIGHT", "BMI"]);
const TYPE_ORDER = [
  "BODY_FAT",
  "MUSCLE_MASS",
  "WAIST",
  "HIP",
  "CHEST",
  "ARM",
  "THIGH",
  "HEIGHT",
  "CUSTOM",
];

export function MeasurementsGrid({ latest }: Props) {
  const visible = latest
    .filter((m) => !HIDDEN_FROM_GRID.has(m.type))
    .sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));

  if (visible.length === 0) {
    return null;
  }

  return (
    <div style={{ margin: "0 16px 20px" }}>
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
        Mediciones
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 10,
        }}
      >
        {visible.map((m) => (
          <MeasurementCard key={`${m.type}:${m.label ?? ""}`} entry={m} />
        ))}
      </div>
    </div>
  );
}

function MeasurementCard({ entry }: { entry: LatestByType }) {
  const label = entry.label ?? BODY_METRIC_LABEL[entry.type];
  const delta = entry.previous
    ? Math.round((entry.latest.value - entry.previous.value) * 10) / 10
    : null;
  const arrow = entry.trend === "up" ? "↑" : entry.trend === "down" ? "↓" : "→";
  const arrowColor =
    entry.trend === "flat"
      ? "var(--k-t3)"
      : entry.type === "BODY_FAT" || entry.type === "WAIST"
        ? entry.trend === "down"
          ? "var(--k-accent)"
          : "var(--k-warning)"
        : entry.trend === "up"
          ? "var(--k-accent)"
          : "var(--k-warning)";

  return (
    <div
      style={{
        padding: "14px 14px 13px",
        background: "var(--k-elevated)",
        border: "1px solid var(--k-line)",
        borderRadius: 14,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 4,
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
          {Math.round(entry.latest.value * 10) / 10}
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
          {entry.latest.unit}
        </span>
      </div>
      {delta !== null && delta !== 0 && (
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            color: arrowColor,
          }}
        >
          {arrow} {Math.abs(delta).toFixed(1)} {entry.latest.unit}
        </div>
      )}
    </div>
  );
}
