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
import { formatDateShort, formatMXN } from "@/lib/format";
import { paymentGatewayLabel, paymentStatusLabel } from "@/lib/labels";
import { useUrlPatch } from "@/lib/url-state";
import { useSearchParams } from "next/navigation";
import { GatewayChip, StatusChip } from "./chips";

type Props = {
  rows: PaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  /** Label of the active range — repeated on the count so it can be checked. */
  periodLabel: string;
  /** Movements in the period before the method/status filters narrow it. */
  periodTotal: number;
  /** Anchor of the cash register, used as the next step for failed charges. */
  cashHref: string;
  /** Server-side filter values used to fetch the page — also reused by export. */
  filterValues: {
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    gateway?: PaymentGateway;
    status?: PaymentStatus;
  };
};

const fmtDate = (d: Date | null) => (d ? formatDateShort(d) : "—");

const csvColumns: CSVColumn<PaymentRow>[] = [
  { key: "createdAt", header: "Fecha creación", value: (r) => r.createdAt },
  { key: "paidAt", header: "Fecha pago", value: (r) => r.paidAt },
  { key: "athleteName", header: "Atleta", value: (r) => r.athleteName ?? "" },
  { key: "planName", header: "Plan", value: (r) => r.planName ?? "" },
  {
    key: "gateway",
    header: "Método",
    value: (r) => paymentGatewayLabel[r.gateway] ?? r.gateway,
  },
  {
    key: "status",
    header: "Estado",
    value: (r) => paymentStatusLabel[r.status] ?? r.status,
  },
  { key: "amount", header: "Monto", value: (r) => r.amount },
  { key: "currency", header: "Moneda", value: (r) => r.currency },
];

function amountColor(status: PaymentStatus): string {
  if (status === "PAID") return "var(--k-accent)";
  if (status === "REFUNDED") return "var(--k-t3)";
  if (status === "FAILED") return "var(--k-danger)";
  return "var(--k-t1)";
}

export function PaymentsTable({
  rows,
  total,
  page,
  pageSize,
  periodLabel,
  periodTotal,
  cashHref,
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
        cell: ({ row }) => (
          <div className="flex flex-col items-start gap-1">
            <StatusChip status={row.original.status} />
            {row.original.status === "FAILED" ? (
              <a
                href={cashHref}
                className="text-[11px] font-semibold underline decoration-dotted"
                style={{ color: "var(--k-accent)" }}
              >
                Registrar en efectivo
              </a>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "amount",
        header: "Monto",
        cell: ({ row }) => (
          <span
            className="font-display font-bold"
            style={{ color: amountColor(row.original.status) }}
          >
            {formatMXN(row.original.amount)}
          </span>
        ),
      },
    ],
    [cashHref],
  );

  async function exportAll(): Promise<PaymentRow[]> {
    const res = await listPaymentsPaged({
      ...filterValues,
      page: 1,
      pageSize: 5000,
    });
    return res.rows;
  }

  const narrowed = total !== periodTotal;

  return (
    <div className="k-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
        <div>
          <p className="k-eyebrow">
            {total} movimiento{total === 1 ? "" : "s"} · {periodLabel}
          </p>
          {narrowed ? (
            <p className="mt-0.5 text-[11px]" style={{ color: "var(--k-t3)" }}>
              de {periodTotal} en el periodo, con los filtros aplicados
            </p>
          ) : null}
        </div>
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
            title="Sin movimientos en el periodo"
            description="Ajusta las fechas o los filtros para ver más resultados."
          />
        </div>
      ) : (
        <>
          {/* Phone: stacked row cards — the money columns used to clip away */}
          <ul className="flex flex-col md:hidden">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.athleteName ?? "—"}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: "var(--k-t2)" }}
                  >
                    {r.planName ?? "—"}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-[var(--k-t3)]">
                      {fmtDate(r.paidAt ?? r.createdAt)}
                    </span>
                    <GatewayChip gateway={r.gateway} />
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className="font-display text-base font-bold"
                    style={{ color: amountColor(r.status) }}
                  >
                    {formatMXN(r.amount)}
                  </span>
                  <StatusChip status={r.status} />
                  {r.status === "FAILED" ? (
                    <a
                      href={cashHref}
                      className="text-[11px] font-semibold underline decoration-dotted"
                      style={{ color: "var(--k-accent)" }}
                    >
                      Registrar en efectivo
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
          </div>
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
