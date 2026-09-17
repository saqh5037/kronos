import { Dumbbell } from "lucide-react";
import type { SportBreakdownRow } from "@/server/actions/wearables";
import { CHART_PALETTE } from "@/components/charts/tokens";
import { formatDecimal } from "@/lib/format";
import { SectionEmpty, SectionHeader } from "./section-empty";

type Props = {
  breakdown: SportBreakdownRow[];
};

export function SportsCard({ breakdown }: Props) {
  const maxSessions = Math.max(1, ...breakdown.map((b) => b.sessions));

  return (
    <section className="k-card overflow-hidden" style={{ padding: 16 }}>
      <SectionHeader label="Deportes · 90 días" />

      {breakdown.length === 0 ? (
        <SectionEmpty
          icon={Dumbbell}
          message="Aún no hay entrenamientos registrados por Whoop en los últimos 90 días."
        />
      ) : (
        <ul
          className="flex flex-col"
          style={{ marginTop: 12, gap: 12, listStyle: "none", padding: 0 }}
        >
          {breakdown.map((b, i) => {
            const pct = (b.sessions / maxSessions) * 100;
            const hoursTotal = b.totalMs / 3_600_000;
            return (
              <li key={b.slug}>
                <div
                  className="flex items-baseline justify-between"
                  style={{ marginBottom: 4 }}
                >
                  <span
                    className="font-body font-semibold"
                    style={{ fontSize: 13, color: "var(--k-t1)" }}
                  >
                    {b.label}
                  </span>
                  <span
                    className="font-body"
                    style={{ fontSize: 11, color: "var(--k-t3)" }}
                  >
                    {b.sessions} {b.sessions === 1 ? "sesión" : "sesiones"} ·{" "}
                    {formatDecimal(hoursTotal, 1)} h
                  </span>
                </div>
                <div
                  className="overflow-hidden"
                  style={{
                    height: 8,
                    borderRadius: 4,
                    background: "var(--k-bg)",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      borderRadius: 4,
                      background: CHART_PALETTE[i % CHART_PALETTE.length],
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
