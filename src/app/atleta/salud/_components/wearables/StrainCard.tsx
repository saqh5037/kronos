import { Flame } from "lucide-react";
import type { StrainTrendPoint } from "@/server/actions/wearables";
import { formatDecimal } from "@/lib/format";
import {
  addCivilDays,
  civilDateInTz,
  DEFAULT_BOX_TIMEZONE,
  formatDayKey,
} from "@/lib/tz";
import { SectionEmpty, SectionHeader } from "./section-empty";
import { StrainChart } from "./StrainChart";

type Props = {
  trend: StrainTrendPoint[];
};

export function StrainCard({ trend }: Props) {
  const hasData = trend.some((p) => p.strain != null);

  // "Últimos 7 días" has to mean seven civil days in the box timezone, not the
  // last seven rows: Whoop can miss a day, and `slice(-7)` would then quietly
  // reach further back than the label claims — the total would grow precisely
  // because the athlete synced less.
  const today = civilDateInTz(new Date(), DEFAULT_BOX_TIMEZONE);
  const cutoff = formatDayKey(addCivilDays(today, -6));
  const weeklyTotal = trend
    .filter((p) => p.dayKey >= cutoff && p.strain != null)
    .reduce((sum, p) => sum + (p.strain ?? 0), 0);

  return (
    <section className="k-card overflow-hidden" style={{ padding: 16 }}>
      <div className="flex items-baseline justify-between">
        <SectionHeader label="Carga de entrenamiento" />
        {hasData && (
          <span
            className="font-body"
            style={{ fontSize: 11, color: "var(--k-t3)" }}
          >
            {formatDecimal(weeklyTotal, 1)} · últimos 7 días
          </span>
        )}
      </div>

      {!hasData ? (
        <SectionEmpty
          icon={Flame}
          message="Aún no hay carga registrada. Se calcula con cada ciclo que Whoop sincronice."
        />
      ) : (
        <div style={{ marginTop: 10 }}>
          <StrainChart data={trend} />
        </div>
      )}
    </section>
  );
}
