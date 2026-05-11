import Link from "next/link";
import type { LatestByType } from "@/server/actions/body-metrics";

type Props = {
  latest: LatestByType[];
};

function findLatest(
  list: LatestByType[],
  type: LatestByType["type"],
): LatestByType | null {
  return list.find((l) => l.type === type) ?? null;
}

export function WellnessHomeCard({ latest }: Props) {
  const weight = findLatest(latest, "WEIGHT");

  if (!weight) {
    return (
      <Link
        href="/atleta/salud"
        className="block mx-3.5 mt-4"
        style={{
          padding: "16px 18px",
          border: "1px dashed var(--k-accent-line)",
          borderRadius: 16,
          textDecoration: "none",
          background:
            "linear-gradient(135deg, rgba(200,255,45,0.04), rgba(200,255,45,0))",
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
          Salud · tracking
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--k-font-display)",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--k-t1)",
            letterSpacing: "-0.01em",
          }}
        >
          Empezá a llevar tu peso
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--k-font-body)",
            fontSize: 12,
            color: "var(--k-t2)",
            lineHeight: 1.4,
          }}
        >
          Registrá una medición esta semana y ve cómo evolucionás.
        </div>
      </Link>
    );
  }

  const delta =
    weight.previous !== null
      ? Math.round((weight.latest.value - weight.previous.value) * 10) / 10
      : null;
  const deltaText =
    delta === null || delta === 0
      ? null
      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} ${weight.latest.unit}`;
  const deltaColor =
    weight.trend === "down"
      ? "var(--k-accent)"
      : weight.trend === "up"
        ? "var(--k-warning)"
        : "var(--k-t3)";

  return (
    <Link
      href="/atleta/salud"
      className="block mx-3.5 mt-4"
      style={{
        padding: "16px 18px",
        border: "1px solid var(--k-accent-line)",
        borderRadius: 16,
        textDecoration: "none",
        background:
          "radial-gradient(ellipse at 80% 0%, rgba(200,255,45,0.06), transparent 60%), var(--k-elevated)",
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
        Tu salud
      </div>
      <div
        style={{
          marginTop: 6,
          display: "flex",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 30,
            fontWeight: 700,
            color: "var(--k-t1)",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {Math.round(weight.latest.value * 10) / 10}
        </span>
        <span
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--k-t2)",
          }}
        >
          {weight.latest.unit}
        </span>
        {deltaText && (
          <span
            style={{
              marginLeft: 6,
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              color: deltaColor,
            }}
          >
            {deltaText}
          </span>
        )}
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "var(--k-accent)",
            textTransform: "uppercase",
          }}
        >
          Ver salud →
        </span>
      </div>
    </Link>
  );
}
