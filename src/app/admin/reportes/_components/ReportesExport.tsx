"use client";

import { ExportCSVButton } from "@/components/data/ExportCSVButton";
import type { CSVColumn } from "@/lib/csv";

export type RevenueMonthCsvRow = {
  month: string;
  revenue: number;
  paymentCount: number;
};

export type AthletesMonthCsvRow = {
  month: string;
  newAthletes: number;
  churnedMemberships: number;
};

export type ChurnRiskCsvRow = {
  name: string;
  severity: string;
  signalCount: number;
  reasons: string;
  daysSinceLastAttended: number | null;
};

const revenueColumns: CSVColumn<RevenueMonthCsvRow>[] = [
  { key: "month", header: "Mes", value: (r) => r.month },
  { key: "revenue", header: "Ingresos (MXN)", value: (r) => r.revenue },
  { key: "paymentCount", header: "Cobros", value: (r) => r.paymentCount },
];

const athletesColumns: CSVColumn<AthletesMonthCsvRow>[] = [
  { key: "month", header: "Mes", value: (r) => r.month },
  { key: "newAthletes", header: "Nuevos", value: (r) => r.newAthletes },
  {
    key: "churnedMemberships",
    header: "Bajas",
    value: (r) => r.churnedMemberships,
  },
];

const churnColumns: CSVColumn<ChurnRiskCsvRow>[] = [
  { key: "name", header: "Atleta", value: (r) => r.name },
  { key: "severity", header: "Riesgo", value: (r) => r.severity },
  { key: "signalCount", header: "Señales", value: (r) => r.signalCount },
  { key: "reasons", header: "Motivos", value: (r) => r.reasons },
  {
    key: "daysSinceLastAttended",
    header: "Días sin venir",
    value: (r) => r.daysSinceLastAttended,
  },
];

export function ExportRevenueMonths({ rows }: { rows: RevenueMonthCsvRow[] }) {
  return (
    <ExportCSVButton<RevenueMonthCsvRow>
      filename="ingresos-12-meses"
      label="CSV"
      columns={revenueColumns}
      fetchRows={() => rows}
      disabled={rows.length === 0}
    />
  );
}

export function ExportAthletesMonths({
  rows,
}: {
  rows: AthletesMonthCsvRow[];
}) {
  return (
    <ExportCSVButton<AthletesMonthCsvRow>
      filename="altas-y-bajas-12-meses"
      label="CSV"
      columns={athletesColumns}
      fetchRows={() => rows}
      disabled={rows.length === 0}
    />
  );
}

export function ExportChurnRisk({ rows }: { rows: ChurnRiskCsvRow[] }) {
  return (
    <ExportCSVButton<ChurnRiskCsvRow>
      filename="atletas-en-riesgo"
      label="CSV"
      columns={churnColumns}
      fetchRows={() => rows}
      disabled={rows.length === 0}
    />
  );
}
