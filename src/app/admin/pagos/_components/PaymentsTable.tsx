"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ExportCSVButton } from "@/components/data/ExportCSVButton";
import { EmptyState } from "@/components/data/EmptyState";
import { listPaymentsPaged, type PaymentRow } from "@/server/actions/payments";
import type { PaymentGateway, PaymentStatus } from "@/lib/validations/payment";
import type { CSVColumn } from "@/lib/csv";
import { useUrlPatch } from "@/lib/url-state";
import { useSearchParams } from "next/navigation";
import { GatewayChip, StatusChip } from "./chips";

type Props = {
  rows: PaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Server-side filter values used to fetch the page — also reused by export. */
  filterValues: {
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    gateway?: PaymentGateway;
    status?: PaymentStatus;
  };
};

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "—";
const fmtMoney = (v: number) => `$${v.toLocaleString("es-MX")}`;

const csvColumns: CSVColumn<PaymentRow>[] = [
  { key: "createdAt", header: "Fecha creación", value: (r) => r.createdAt },
  { key: "paidAt", header: "Fecha pago", value: (r) => r.paidAt },
  { key: "athleteName", header: "Atleta", value: (r) => r.athleteName ?? "" },
  { key: "planName", header: "Plan", value: (r) => r.planName ?? "" },
  { key: "gateway", header: "Método", value: (r) => r.gateway },
  { key: "status", header: "Estado", value: (r) => r.status },
  { key: "amount", header: "Monto", value: (r) => r.amount },
  { key: "currency", header: "Moneda", value: (r) => r.currency },
];

export function PaymentsTable({
  rows,
  total,
  page,
  pageSize,
  filterValues,
}: Props) {
  const sp = useSearchParams();
  const patch = useUrlPatch();

  const columns = useMemo<ColumnDef<PaymentRow, unknown>[]>(
    () => [
      {
        accessorKey: "paidAt",
        header: "Fecha",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t3)]">
            {fmtDate(row.original.paidAt ?? row.original.createdAt)}
          </span>
        ),
      },
      {
        accessorKey: "athleteName",
        header: "Atleta",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.athleteName ?? "—"}</span>
        ),
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--k-t2)]">
            {row.original.planName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "gateway",
        header: "Método",
        cell: ({ row }) => <GatewayChip gateway={row.original.gateway} />,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => {
          const tone =
            row.original.status === "PAID"
              ? "var(--k-accent)"
              : row.original.status === "REFUNDED"
                ? "var(--k-t3)"
                : "var(--k-t1)";
          return (
            <span className="font-mono font-bold" style={{ color: tone }}>
              {fmtMoney(row.original.amount)}
            </span>
          );
        },
      },
    ],
    [],
  );

  async function exportAll(): Promise<PaymentRow[]> {
    const res = await listPaymentsPaged({
      ...filterValues,
      page: 1,
      pageSize: 5000,
    });
    return res.rows;
  }

  return (
    <div className="k-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
        <p className="k-eyebrow">
          {total} pago{total === 1 ? "" : "s"} en el rango
        </p>
        <ExportCSVButton<PaymentRow>
          filename={`pagos-${sp.get("preset") ?? "rango"}`}
          columns={csvColumns}
          fetchRows={exportAll}
          disabled={total === 0}
        />
      </div>
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Sin pagos en el rango"
            description="Ajustá fechas o filtros para ver más resultados."
          />
        </div>
      ) : (
        <>
          <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
          <div className="border-t border-[var(--k-line)] px-4 py-2">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(n) => patch({ ppay: n > 1 ? String(n) : null })}
            />
          </div>
        </>
      )}
    </div>
  );
}
