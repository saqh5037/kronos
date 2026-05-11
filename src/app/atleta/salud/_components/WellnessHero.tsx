"use client";

import type { LatestByType } from "@/server/actions/body-metrics";
import { calcBMI, formatMeasurement } from "@/lib/wellness/calculations";

type Props = {
  latest: LatestByType[];
};

function findLatest(
  latest: LatestByType[],
  type: LatestByType["type"],
): LatestByType | null {
  return latest.find((l) => l.type === type) ?? null;
}

function formatDelta(latest: LatestByType): string | null {
  if (!latest.previous) return null;
  const delta = latest.latest.value - latest.previous.value;
  const rounded = Math.round(delta * 10) / 10;
  if (rounded === 0) return null;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toFixed(Math.abs(rounded) < 1 ? 2 : 1)} ${latest.latest.unit}`;
}

export function WellnessHero({ latest }: Props) {
  const weight = findLatest(latest, "WEIGHT");
  const height = findLatest(latest, "HEIGHT");
  const bodyFat = findLatest(latest, "BODY_FAT");

  const bmi =
    weight && height ? calcBMI(weight.latest.value, height.latest.value) : null;
  const delta = weight ? formatDelta(weight) : null;
  const deltaColor =
    weight && weight.trend === "down"
      ? "var(--k-accent)"
      : weight && weight.trend === "up"
        ? "var(--k-warning)"
        : "var(--k-t3)";

  return (
    <div
      style={{
        margin: "12px 16px 18px",
        padding: "22px 22px 24px",
        borderRadius: 18,
        border: "1px solid var(--k-accent-line)",
        background:
          "radial-gradient(ellipse at 80% 0%, rgba(200,255,45,0.06), transparent 60%), var(--k-elevated)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.18em",
          color: "var(--k-accent)",
          textTransform: "uppercase",
        }}
      >
        Tu cuerpo hoy
      </div>

      {weight ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 48,
              fontWeight: 700,
              color: "var(--k-t1)",
              letterSpacing: "-0.03em",
              lineHeight: 1,
              fontFeatureSettings: '"tnum" 1',
            }}
          >
            {Math.round(weight.latest.value * 10) / 10}
          </span>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--k-t2)",
              letterSpacing: "0.04em",
            }}
          >
            {weight.latest.unit}
          </span>
          {delta && (
            <span
              style={{
                marginLeft: 6,
                fontFamily: "var(--k-font-display)",
                fontSize: 12,
                fontWeight: 700,
                color: deltaColor,
              }}
            >
              {delta}
            </span>
          )}
        </div>
      ) : (
        <div
          style={{
            marginTop: 8,
            fontFamily: "var(--k-font-body)",
            fontSize: 14,
            color: "var(--k-t2)",
          }}
        >
          Registra tu peso para arrancar.
        </div>
      )}

      {(bmi !== null || bodyFat) && (
        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {bmi !== null && (
            <HeroStat label="IMC" value={formatMeasurement(bmi, "")} />
          )}
          {bodyFat && (
            <HeroStat
              label="% Grasa"
              value={formatMeasurement(
                bodyFat.latest.value,
                bodyFat.latest.unit,
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        background: "var(--k-bg)",
        border: "1px solid var(--k-line)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.16em",
          color: "var(--k-t3)",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: "var(--k-font-display)",
          fontSize: 20,
          fontWeight: 700,
          color: "var(--k-t1)",
          letterSpacing: "-0.01em",
          fontFeatureSettings: '"tnum" 1',
        }}
      >
        {value}
      </div>
    </div>
  );
}
