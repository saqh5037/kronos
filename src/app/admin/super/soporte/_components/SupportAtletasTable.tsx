"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/data/EmptyState";
import { listSupportBoxAthletes } from "@/server/actions/support";
import type { AthleteRow } from "@/server/actions/athletes";
import type { AthleteStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { SupportAthleteDrawer } from "./SupportAthleteDrawer";

const PAGE_SIZE = 25;

const fmtDate = (d: Date | null) =>
  d
    ? new Date(d).toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "short",
      })
    : "—";

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

type Props = {
  initialRows: AthleteRow[];
  initialTotal: number;
};

export function SupportAtletasTable({ initialRows, initialTotal }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<AthleteRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | "">("");
  const [drawerId, setDrawerId] = useState<string | null>(null);

  function fetchPage(opts: {
    page: number;
    search: string;
    status: AthleteStatus | "";
  }) {
    startTransition(async () => {
      const result = await listSupportBoxAthletes({
        page: opts.page,
        pageSize: PAGE_SIZE,
        search: opts.search || undefined,
        status: opts.status || undefined,
      });
      if (result.ok) {
        setRows(result.result.rows);
        setTotal(result.result.total);
        setPage(result.result.page);
      }
    });
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    fetchPage({ page: 1, search: v, status: statusFilter });
  }

  function handleStatusChange(v: AthleteStatus | "") {
    setStatusFilter(v);
    fetchPage({ page: 1, search, status: v });
  }

  function handlePageChange(p: number) {
    fetchPage({ page: p, search, status: statusFilter });
  }

  function handleDrawerRefresh() {
    fetchPage({ page, search, status: statusFilter });
    router.refresh();
  }

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
    ],
    [],
  );

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar nombre, teléfono o email…"
          className="min-w-[240px] flex-1 rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-4 py-2 text-sm text-[var(--k-t1)] placeholder:text-[var(--k-t3)] focus:outline-none focus:ring-1 focus:ring-[var(--k-warning)]"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            handleStatusChange(e.target.value as AthleteStatus | "")
          }
          className="rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-3 py-2 text-sm text-[var(--k-t1)] focus:outline-none focus:ring-1 focus:ring-[var(--k-warning)]"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PAUSED">Pausados</option>
          <option value="DROPIN">Drop-in</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
      </div>

      <div className="k-card" style={{ opacity: isPending ? 0.7 : 1 }}>
        <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
          <p className="k-eyebrow">
            {total} atleta{total === 1 ? "" : "s"}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Este box aún no tiene atletas"
              description="Sin resultados para los filtros actuales."
            />
          </div>
        ) : (
          <>
            <DataTable
              data={rows}
              columns={columns}
              rowKey={(r) => r.id}
              onRowClick={(r) => setDrawerId(r.id)}
            />
            <div className="border-t border-[var(--k-line)] px-4 py-2">
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        )}
      </div>

      <SupportAthleteDrawer
        athleteId={drawerId}
        onClose={() => setDrawerId(null)}
        onActionComplete={handleDrawerRefresh}
      />
    </>
  );
}
