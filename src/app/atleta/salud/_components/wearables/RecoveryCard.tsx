import { HeartPulse } from "lucide-react";
import type {
  RecoverySnapshot,
  RecoveryTrendPoint,
} from "@/server/actions/wearables";
import { formatPercentDelta } from "@/lib/format";
import { intensity } from "@/components/charts/tokens";
import { SectionEmpty, SectionHeader } from "./section-empty";

type Props = {
  latest: RecoverySnapshot | null;
  trend: RecoveryTrendPoint[];
};

/** "15/09" from a `YYYY-MM-DD` day key — no `Date` parsing needed. */
function shortDay(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${d}/${m}`;
}

export function RecoveryCard({ latest, trend }: Props) {
  const hasData = latest !== null || trend.length > 0;

  const trailing = trend
    .slice(0, -1)
    .slice(-7)
    .filter((p) => p.score != null);
  const trailingAvg =
    trailing.length > 0
      ? trailing.reduce((sum, p) => sum + (p.score ?? 0), 0) / trailing.length
      : null;
  const delta =
    latest?.score != null && trailingAvg !== null
      ? latest.score - trailingAvg
      : null;

  return (
    <section className="k-card overflow-hidden" style={{ padding: 16 }}>
      <SectionHeader label="Recuperación" />

      {!hasData ? (
        <SectionEmpty
          icon={HeartPulse}
          message="Aún no hay datos de recuperación. Se ven en cuanto sincronices tu Whoop."
        />
      ) : (
        <>
          <div className="flex items-baseline gap-2" style={{ marginTop: 10 }}>
            <span
              className="font-display font-bold"
              style={{
                fontSize: 40,
                color: "var(--k-t1)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {latest?.score ?? "—"}
              {latest?.score != null && (
                <span style={{ fontSize: 18, marginLeft: 2 }}>%</span>
              )}
            </span>
            {delta !== null && (
              <span
                className="font-display font-bold"
                style={{
                  fontSize: 12,
                  color: delta >= 0 ? "var(--k-accent)" : "var(--k-t2)",
                }}
              >
                {formatPercentDelta(delta, 0)}
                <span
                  className="font-body font-normal"
                  style={{ marginLeft: 4, color: "var(--k-t3)" }}
                >
                  vs. últimos 7 días
                </span>
              </span>
            )}
          </div>

          <div className="flex gap-4" style={{ marginTop: 12 }}>
            <Stat
              label="FC en reposo"
              value={latest?.restingHr ?? null}
              unit="lpm"
            />
            <Stat
              label="VFC (HRV)"
              value={
                latest?.hrvRmssd != null ? Math.round(latest.hrvRmssd) : null
              }
              unit="ms"
            />
          </div>

          {trend.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                className="flex items-end"
                style={{ gap: 2, height: 36 }}
                role="img"
                aria-label="Recuperación de los últimos 30 días, opacidad según el porcentaje"
              >
                {trend.map((p) => (
                  <div
                    key={p.dayKey}
                    title={`${shortDay(p.dayKey)}: ${p.score ?? "sin dato"}`}
                    style={{
                      flex: 1,
                      height: "100%",
                      borderRadius: 2,
                      background:
                        p.score != null
                          ? intensity(p.score / 100)
                          : "var(--k-line)",
                    }}
                  />
                ))}
              </div>
              <div
                className="flex justify-between font-body"
                style={{ marginTop: 6, fontSize: 10, color: "var(--k-t3)" }}
              >
                <span>{shortDay(trend[0].dayKey)}</span>
                <span>{shortDay(trend[trend.length - 1].dayKey)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <div>
      <div className="k-eyebrow" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div
        className="font-display font-bold"
        style={{ marginTop: 2, fontSize: 16, color: "var(--k-t1)" }}
      >
        {value != null ? `${value} ${unit}` : "—"}
      </div>
    </div>
  );
}
