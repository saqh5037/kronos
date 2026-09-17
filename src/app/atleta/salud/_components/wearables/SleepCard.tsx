import { Moon } from "lucide-react";
import type { SleepTrendPoint } from "@/server/actions/wearables";
import { CHART_PALETTE } from "@/components/charts/tokens";
import { SectionEmpty, SectionHeader } from "./section-empty";

type Props = {
  trend: SleepTrendPoint[];
};

function shortDay(dayKey: string): string {
  const [, m, d] = dayKey.split("-");
  return `${d}/${m}`;
}

function hours(ms: number | null): number | null {
  return ms != null ? ms / 3_600_000 : null;
}

const STAGE_TIERS = [
  { key: "deepMin" as const, label: "Profundo", color: CHART_PALETTE[0] },
  { key: "remMin" as const, label: "REM", color: CHART_PALETTE[1] },
  { key: "lightMin" as const, label: "Ligero", color: CHART_PALETTE[2] },
  { key: "awakeMin" as const, label: "Despierto", color: CHART_PALETTE[3] },
];

export function SleepCard({ trend }: Props) {
  const last = trend.at(-1) ?? null;
  const hasData = trend.length > 0;

  const asleepH = hours(last?.asleepMs ?? null);
  const needH = last?.needMin != null ? last.needMin / 60 : null;

  const maxAsleepMs = Math.max(1, ...trend.map((p) => p.asleepMs ?? 0));

  const stageTotal = last
    ? STAGE_TIERS.reduce((sum, t) => sum + (last.stages[t.key] ?? 0), 0)
    : 0;

  return (
    <section className="k-card overflow-hidden" style={{ padding: 16 }}>
      <SectionHeader label="Sueño" />

      {!hasData ? (
        <SectionEmpty
          icon={Moon}
          message="Aún no hay noches registradas. Duerme con tu Whoop puesto y sincroniza."
        />
      ) : (
        <>
          <div className="flex items-baseline gap-2" style={{ marginTop: 10 }}>
            <span
              className="font-display font-bold"
              style={{
                fontSize: 32,
                color: "var(--k-t1)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontFeatureSettings: '"tnum" 1',
              }}
            >
              {asleepH != null ? asleepH.toFixed(1) : "—"} h
            </span>
            {needH != null && (
              <span
                className="font-body"
                style={{ fontSize: 12, color: "var(--k-t3)" }}
              >
                de {needH.toFixed(1)} h necesarias
              </span>
            )}
          </div>
          {last?.efficiency != null && (
            <div
              className="font-body"
              style={{ marginTop: 4, fontSize: 12, color: "var(--k-t2)" }}
            >
              {Math.round(last.efficiency)}% de eficiencia
            </div>
          )}

          {trend.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                className="k-eyebrow"
                style={{ fontSize: 9, marginBottom: 6 }}
              >
                Últimas {trend.length} noches
              </div>
              <div className="flex items-end" style={{ gap: 2, height: 36 }}>
                {trend.map((p) => {
                  const ms = p.asleepMs ?? 0;
                  const pct = Math.max(4, (ms / maxAsleepMs) * 100);
                  return (
                    <div
                      key={p.dayKey}
                      title={`${shortDay(p.dayKey)}: ${
                        p.asleepMs != null
                          ? hours(p.asleepMs)!.toFixed(1)
                          : "sin dato"
                      } h`}
                      style={{
                        flex: 1,
                        height: `${pct}%`,
                        borderRadius: 2,
                        background:
                          p.asleepMs != null
                            ? "var(--k-accent)"
                            : "var(--k-line)",
                      }}
                    />
                  );
                })}
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

          {last && stageTotal > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                className="k-eyebrow"
                style={{ fontSize: 9, marginBottom: 6 }}
              >
                Fases de anoche
              </div>
              <div
                className="flex overflow-hidden"
                style={{ height: 14, borderRadius: 7 }}
              >
                {STAGE_TIERS.map((t) => {
                  const min = last.stages[t.key] ?? 0;
                  if (min <= 0) return null;
                  return (
                    <div
                      key={t.key}
                      style={{
                        width: `${(min / stageTotal) * 100}%`,
                        background: t.color,
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap" style={{ marginTop: 8, gap: 10 }}>
                {STAGE_TIERS.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center"
                    style={{ gap: 5 }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: t.color,
                      }}
                      aria-hidden
                    />
                    <span
                      className="font-body"
                      style={{ fontSize: 11, color: "var(--k-t3)" }}
                    >
                      {t.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
