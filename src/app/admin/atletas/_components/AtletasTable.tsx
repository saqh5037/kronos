"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, RowSelectionState } from "@tanstack/react-table";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ExportCSVButton } from "@/components/data/ExportCSVButton";
import { BulkActionsBar } from "@/components/data/BulkActionsBar";
import { EmptyState } from "@/components/data/EmptyState";
import {
  listAthletesPaged,
  updateAthleteStatus,
  type AthleteRow,
} from "@/server/actions/athletes";
import type { AthleteStatus } from "@prisma/client";
import type { CSVColumn } from "@/lib/csv";
import { useUrlPatch } from "@/lib/url-state";
import { useRouter } from "next/navigation";
import { AthleteDrawer } from "./AthleteDrawer";

const fmtDate = (d: Date | null) =>
  d
    ? new Date(d).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      })
    : "—";

const csvColumns: CSVColumn<AthleteRow>[] = [
  { key: "firstName", header: "Nombre", value: (r) => r.firstName },
  { key: "lastName", header: "Apellido", value: (r) => r.lastName },
  { key: "phone", header: "Teléfono", value: (r) => r.phone ?? "" },
  { key: "email", header: "Email", value: (r) => r.email ?? "" },
  { key: "status", header: "Estado", value: (r) => r.status },
  {
    key: "activePlanName",
    header: "Plan activo",
    value: (r) => r.activePlanName ?? "",
  },
  {
    key: "lastAttendanceAt",
    header: "Última asistencia",
    value: (r) => r.lastAttendanceAt,
  },
  { key: "totalScores", header: "Total scores", value: (r) => r.totalScores },
  { key: "createdAt", header: "Alta", value: (r) => r.createdAt },
];

type Props = {
  rows: AthleteRow[];
  total: number;
  page: number;
  pageSize: number;
  filterValues: {
    dateFrom?: Date;
    dateTo?: Date;
    search?: string;
    status?: string;
  };
};

function StatusChip({ status }: { status: string }) {
  const cls =
    status === "ACTIVE"
      ? "k-chip-moss"
      : status === "PAUSED"
        ? "k-chip-steel"
        : status === "CANCELLED"
          ? "k-chip-ember"
          : "k-chip-ghost";
  return <span className={`k-chip ${cls} text-[10px]`}>{status}</span>;
}

export function AtletasTable({
  rows,
  total,
  page,
  pageSize,
  filterValues,
}: Props) {
  const patch = useUrlPatch();
  const router = useRouter();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const selectedIds = Object.keys(selection).filter((k) => selection[k]);

  const columns = useMemo<ColumnDef<AthleteRow, unknown>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: "Atleta",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </span>
            {row.original.email ? (
              <span className="text-[10px] text-[var(--k-t3)]">
                {row.original.email}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "phone",
        header: "Teléfono",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t2)]">
            {row.original.phone ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        accessorKey: "activePlanName",
        header: "Plan",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--k-t2)]">
            {row.original.activePlanName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "lastAttendanceAt",
        header: "Última clase",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t3)]">
            {fmtDate(row.original.lastAttendanceAt)}
          </span>
        ),
      },
      {
        accessorKey: "totalScores",
        header: "Scores",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.totalScores}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Alta",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t3)]">
            {fmtDate(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

  async function exportAll(): Promise<AthleteRow[]> {
    const res = await listAthletesPaged({
      ...filterValues,
      status: filterValues.status as AthleteStatus | undefined,
      page: 1,
      pageSize: 5000,
    });
    return res.rows;
  }

  async function bulkSetStatus(status: AthleteStatus) {
    setBulkBusy(true);
    try {
      await Promise.all(
        selectedIds.map((id) => updateAthleteStatus(id, status)),
      );
      setSelection({});
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
      <div className="k-card">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
          <p className="k-eyebrow">
            {total} atleta{total === 1 ? "" : "s"}
          </p>
          <ExportCSVButton<AthleteRow>
            filename="atletas"
            columns={csvColumns}
            fetchRows={exportAll}
            disabled={total === 0}
          />
        </div>
        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin atletas"
              description="Sin resultados para los filtros actuales."
            />
          </div>
        ) : (
          <>
            <DataTable
              data={rows}
              columns={columns}
              rowKey={(r) => r.id}
              selectable
              selection={selection}
              onSelectionChange={setSelection}
              onRowClick={(r) => setDrawerId(r.id)}
            />
            <div className="border-t border-[var(--k-line)] px-4 py-2">
              <Pagination
                page={page}
                pageSize={pageSize}
                total={total}
                onPageChange={(n) => patch({ page: n > 1 ? String(n) : null })}
              />
            </div>
          </>
        )}
      </div>

      <BulkActionsBar
        count={selectedIds.length}
        onClear={() => setSelection({})}
      >
        <button
          type="button"
          disabled={bulkBusy}
          onClick={() => bulkSetStatus("ACTIVE")}
          className="rounded-lg border border-[var(--k-accent-line)] bg-[var(--k-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--k-accent)] disabled:opacity-50"
        >
          Activar
        </button>
        <button
          type="button"
          disabled={bulkBusy}
          onClick={() => bulkSetStatus("PAUSED")}
          className="rounded-lg border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--k-t2)] disabled:opacity-50"
        >
          Pausar
        </button>
        <button
          type="button"
          disabled={bulkBusy}
          onClick={() => bulkSetStatus("CANCELLED")}
          className="rounded-lg border border-[var(--k-warning)]/30 bg-[var(--k-warning)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--k-warning)] disabled:opacity-50"
        >
          Cancelar
        </button>
      </BulkActionsBar>

      <AthleteDrawer athleteId={drawerId} onClose={() => setDrawerId(null)} />
    </>
  );
}
