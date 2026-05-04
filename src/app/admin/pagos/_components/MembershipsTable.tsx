"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ExportCSVButton } from "@/components/data/ExportCSVButton";
import { EmptyState } from "@/components/data/EmptyState";
import {
  listMembershipsPaged,
  type MembershipRow,
} from "@/server/actions/memberships";
import type { CSVColumn } from "@/lib/csv";
import { useUrlPatch } from "@/lib/url-state";

const fmtDate = (d: Date | null) =>
  d ? d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }) : "∞";
const fmtMoney = (v: number) => `$${v.toLocaleString("es-MX")}`;

const csvColumns: CSVColumn<MembershipRow>[] = [
  { key: "athleteName", header: "Atleta", value: (r) => r.athleteName },
  { key: "planName", header: "Plan", value: (r) => r.planName },
  { key: "planType", header: "Tipo", value: (r) => r.planType },
  { key: "startDate", header: "Inicio", value: (r) => r.startDate },
  { key: "endDate", header: "Fin", value: (r) => r.endDate },
  { key: "status", header: "Estado", value: (r) => r.status },
  { key: "classesUsed", header: "Clases usadas", value: (r) => r.classesUsed },
  {
    key: "classesRemaining",
    header: "Clases restantes",
    value: (r) => r.classesRemaining,
  },
  { key: "amountPaid", header: "Pagado", value: (r) => r.amountPaid },
];

type Props = {
  rows: MembershipRow[];
  total: number;
  page: number;
  pageSize: number;
  filterValues: {
    search?: string;
    status?: string;
    planId?: string;
  };
};

export function MembershipsTable({
  rows,
  total,
  page,
  pageSize,
  filterValues,
}: Props) {
  const patch = useUrlPatch();

  const columns = useMemo<ColumnDef<MembershipRow, unknown>[]>(
    () => [
      {
        accessorKey: "athleteName",
        header: "Atleta",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.athleteName}</span>
        ),
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) => (
          <span>
            {row.original.planName}{" "}
            <span className="ml-1 font-mono text-[10px] text-[var(--text-3)]">
              {row.original.planType}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Vigencia",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--text-3)]">
            {fmtDate(row.original.startDate)} → {fmtDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: "classesUsed",
        header: "Clases",
        cell: ({ row }) => (
          <span className="text-xs">
            <span className="font-mono">{row.original.classesUsed}</span>
            {row.original.classesRemaining !== null ? (
              <span className="text-[var(--text-3)]">
                {" "}
                / {row.original.classesUsed + row.original.classesRemaining}
              </span>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: "amountPaid",
        header: "Pagado",
        cell: ({ row }) => (
          <span className="font-mono">{fmtMoney(row.original.amountPaid)}</span>
        ),
      },
    ],
    [],
  );

  async function exportAll(): Promise<MembershipRow[]> {
    const res = await listMembershipsPaged({
      ...filterValues,
      status: filterValues.status as MembershipRow["status"] | undefined,
      page: 1,
      pageSize: 5000,
    });
    return res.rows;
  }

  return (
    <div className="k-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <p className="k-eyebrow">
          {total} membership{total === 1 ? "" : "s"}
        </p>
        <ExportCSVButton<MembershipRow>
          filename="memberships"
          columns={csvColumns}
          fetchRows={exportAll}
          disabled={total === 0}
        />
      </div>
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Sin memberships"
            description="Sin resultados para los filtros actuales."
          />
        </div>
      ) : (
        <>
          <DataTable data={rows} columns={columns} rowKey={(r) => r.id} />
          <div className="border-t border-[var(--line)] px-4 py-2">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(n) => patch({ pmem: n > 1 ? String(n) : null })}
            />
          </div>
        </>
      )}
    </div>
  );
}
