import type { PlatformBillingKpis } from "@/server/actions/super-billing";

function formatMxn(cents: number): string {
  const pesos = cents / 100;
  return `$${pesos.toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="k-card"
      style={{
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          color: "var(--k-t3)",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--k-font-display)",
          fontSize: 28,
          fontWeight: 700,
          color: accent ?? "var(--k-t1)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function BillingKpiRow({ kpis }: { kpis: PlatformBillingKpis }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 180px), 1fr))",
        gap: 12,
        marginBottom: 32,
      }}
    >
      <KpiCard
        label="MRR total"
        value={formatMxn(kpis.mrrTotalCents)}
        accent="var(--k-accent)"
      />
      <KpiCard
        label="ARR proyectado"
        value={formatMxn(kpis.arrProjectedCents)}
      />
      <KpiCard label="LTV promedio" value={formatMxn(kpis.ltvAvgCents)} />
      <KpiCard
        label="Activas"
        value={kpis.countActive.toLocaleString("es-MX")}
        accent="var(--k-accent)"
      />
      <KpiCard
        label="En trial"
        value={kpis.countTrial.toLocaleString("es-MX")}
        accent="var(--k-warning)"
      />
      <KpiCard
        label="Vencidas"
        value={(
          kpis.countPastDue +
          kpis.countExpired +
          kpis.countCancelled
        ).toLocaleString("es-MX")}
        accent={
          kpis.countPastDue + kpis.countExpired + kpis.countCancelled > 0
            ? "var(--k-danger)"
            : "var(--k-t2)"
        }
      />
    </div>
  );
}
