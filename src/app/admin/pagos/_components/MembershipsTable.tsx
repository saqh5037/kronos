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
import { formatDateShort, formatMXN } from "@/lib/format";
import { membershipStatusLabel, planTypeLabel } from "@/lib/labels";
import { useUrlPatch } from "@/lib/url-state";

const fmtDate = (d: Date | null) =>
  d ? formatDateShort(d) : "Sin vencimiento";

const csvColumns: CSVColumn<MembershipRow>[] = [
  { key: "athleteName", header: "Atleta", value: (r) => r.athleteName },
  { key: "planName", header: "Plan", value: (r) => r.planName },
  {
    key: "planType",
    header: "Tipo",
    value: (r) => planTypeLabel[r.planType] ?? r.planType,
  },
  { key: "startDate", header: "Inicio", value: (r) => r.startDate },
  { key: "endDate", header: "Fin", value: (r) => r.endDate },
  {
    key: "status",
    header: "Estado",
    value: (r) => membershipStatusLabel[r.status] ?? r.status,
  },
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

function classesText(row: MembershipRow): string {
  if (row.classesRemaining === null) return `${row.classesUsed} usadas`;
  return `${row.classesUsed} de ${row.classesUsed + row.classesRemaining}`;
}

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
            <span className="ml-1 text-[11px] text-[var(--k-t3)]">
              {planTypeLabel[row.original.planType]}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Vigencia",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t3)]">
            {fmtDate(row.original.startDate)} – {fmtDate(row.original.endDate)}
          </span>
        ),
      },
      {
        accessorKey: "classesUsed",
        header: "Clases",
        cell: ({ row }) => (
          <span className="text-xs">{classesText(row.original)}</span>
        ),
      },
      {
        accessorKey: "amountPaid",
        header: "Pagado",
        cell: ({ row }) => (
          <span className="font-display font-bold">
            {formatMXN(row.original.amountPaid)}
          </span>
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
        <p className="k-eyebrow">
          {total} membresía{total === 1 ? "" : "s"} activa
          {total === 1 ? "" : "s"}
        </p>
        <ExportCSVButton<MembershipRow>
          filename="membresias"
          columns={csvColumns}
          fetchRows={exportAll}
          disabled={total === 0}
        />
      </div>
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="Sin membresías"
            description="Sin resultados para los filtros actuales."
          />
        </div>
      ) : (
        <>
          {/* Phone: stacked row cards — "Clases" and "Pagado" used to clip away */}
          <ul className="flex flex-col md:hidden">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex items-start justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {r.athleteName}
                  </p>
                  <p
                    className="truncate text-xs"
                    style={{ color: "var(--k-t2)" }}
                  >
                    {r.planName} · {planTypeLabel[r.planType]}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-[var(--k-t3)]">
                    {fmtDate(r.startDate)} – {fmtDate(r.endDate)} ·{" "}
                    {classesText(r)}
                  </p>
                </div>
                <span className="font-display shrink-0 text-base font-bold">
                  {formatMXN(r.amountPaid)}
                </span>
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
              onPageChange={(n) => patch({ pmem: n > 1 ? String(n) : null })}
            />
          </div>
        </>
      )}
    </div>
  );
}
