import KCard from "@/components/kronos/KCard";
import Sparkline from "@/components/kronos/Sparkline";
import { formatPriceMxn } from "@/lib/saas-billing";
import type { OwnerSaasSpendMetrics } from "@/server/actions/saas-billing";

type Props = {
  metrics: OwnerSaasSpendMetrics;
};

const MONTH_LABELS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

function formatMonthLabel(monthKey: string): string {
  const [, m] = monthKey.split("-");
  const idx = Number(m) - 1;
  return MONTH_LABELS_ES[idx] ?? "—";
}

export function SpendMetricsCard({ metrics }: Props) {
  const hasHistory = metrics.lifetimeSpentCents > 0;
  if (!hasHistory && metrics.currentMrrCents === 0) return null;

  const sparkValues = metrics.monthlyHistory.map((b) => b.cents);
  const lastBucket = metrics.monthlyHistory[metrics.monthlyHistory.length - 1];
  const firstNonZero = metrics.monthlyHistory.find((b) => b.cents > 0);
  const monthsActive = metrics.monthlyHistory.filter((b) => b.cents > 0).length;

  return (
    <KCard animate={false} className="p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-xl font-bold">Tu gasto en Kronos</h2>
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)]">
          Últimos 12 meses
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] mb-1">
            Suscripción mensual
          </p>
          <p
            className="font-display text-2xl font-extrabold"
            style={{ color: "var(--strain)" }}
          >
            {metrics.currentMrrCents > 0
              ? formatPriceMxn(metrics.currentMrrCents)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] mb-1">
            Proyección anual (ARR)
          </p>
          <p className="font-display text-2xl font-extrabold">
            {metrics.arrProjectedCents > 0
              ? formatPriceMxn(metrics.arrProjectedCents)
              : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-3)] mb-1">
            Total pagado
          </p>
          <p
            className="font-display text-2xl font-extrabold"
            style={{ color: "var(--moss)" }}
          >
            {formatPriceMxn(metrics.lifetimeSpentCents)}
          </p>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            {metrics.totalInvoiceCount} cobro
            {metrics.totalInvoiceCount === 1 ? "" : "s"}
            {monthsActive > 0
              ? ` · ${monthsActive} ${monthsActive === 1 ? "mes" : "meses"} activos`
              : ""}
          </p>
        </div>
      </div>

      {hasHistory && sparkValues.some((v) => v > 0) && (
        <div className="pt-3 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-3)] mb-2 flex items-center justify-between gap-2">
            <span>Historial mensual</span>
            <span className="font-mono">
              {firstNonZero ? formatMonthLabel(firstNonZero.month) : ""}
              {lastBucket ? ` → ${formatMonthLabel(lastBucket.month)}` : ""}
            </span>
          </p>
          <div className="w-full overflow-hidden">
            <Sparkline
              values={sparkValues}
              color="var(--moss)"
              height={48}
              width={320}
              animate
            />
          </div>
        </div>
      )}
    </KCard>
  );
}
