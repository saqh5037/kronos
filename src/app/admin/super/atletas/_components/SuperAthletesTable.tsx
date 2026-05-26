"use client";

import { useMemo, useState, useTransition } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/data/EmptyState";
import { listAllAthletesCrossTenant } from "@/server/actions/super-athletes";
import type {
  SuperAthleteRow,
  BoxFilterItem,
} from "@/server/actions/super-athletes";
import type { AthleteStatus } from "@prisma/client";
import { AthleteStatusBadge } from "./AthleteStatusBadge";
import { SuperAthleteDrawer } from "./SuperAthleteDrawer";

const PAGE_SIZE = 25;

// Safe date formatter — passes locale explicitly to avoid hydration mismatch
function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  initialRows: SuperAthleteRow[];
  initialTotal: number;
  boxes: BoxFilterItem[];
};

export function SuperAthletesTable({
  initialRows,
  initialTotal,
  boxes,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const [rows, setRows] = useState<SuperAthleteRow[]>(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AthleteStatus | "">("");
  const [boxFilter, setBoxFilter] = useState("");
  const [drawerAthleteId, setDrawerAthleteId] = useState<string | null>(null);

  const drawerBoxName = useMemo(
    () => rows.find((r) => r.id === drawerAthleteId)?.boxName ?? null,
    [rows, drawerAthleteId],
  );

  function fetchPage(opts: {
    page: number;
    search: string;
    status: AthleteStatus | "";
    boxId: string;
  }) {
    startTransition(async () => {
      const result = await listAllAthletesCrossTenant({
        page: opts.page,
        pageSize: PAGE_SIZE,
        search: opts.search || null,
        status: opts.status || null,
        boxId: opts.boxId || null,
      });
      setRows(result.rows);
      setTotal(result.total);
      setPage(result.page);
    });
  }

  function handleSearchChange(v: string) {
    setSearch(v);
    fetchPage({ page: 1, search: v, status: statusFilter, boxId: boxFilter });
  }

  function handleStatusChange(v: AthleteStatus | "") {
    setStatusFilter(v);
    fetchPage({ page: 1, search, status: v, boxId: boxFilter });
  }

  function handleBoxChange(v: string) {
    setBoxFilter(v);
    fetchPage({ page: 1, search, status: statusFilter, boxId: v });
  }

  function handlePageChange(p: number) {
    setPage(p);
    fetchPage({ page: p, search, status: statusFilter, boxId: boxFilter });
  }

  const columns = useMemo<ColumnDef<SuperAthleteRow, unknown>[]>(
    () => [
      {
        accessorKey: "firstName",
        header: "Atleta",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-[var(--k-t1)]">
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
        accessorKey: "boxName",
        header: "Box",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm text-[var(--k-t1)]">
              {row.original.boxName}
            </span>
            <span className="font-mono text-[10px] text-[var(--k-t3)]">
              /{row.original.boxSlug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <AthleteStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "activePlanName",
        header: "Plan",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--k-t2)]">
            {row.original.activePlanName ?? (
              <span className="text-[var(--k-t3)]">—</span>
            )}
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

  return (
    <>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Buscar nombre o email…"
          className="min-w-[240px] flex-1 rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-4 py-2 text-sm text-[var(--k-t1)] placeholder:text-[var(--k-t3)] focus:outline-none focus:ring-1 focus:ring-[var(--k-accent)]"
        />
        <select
          value={statusFilter}
          onChange={(e) =>
            handleStatusChange(e.target.value as AthleteStatus | "")
          }
          className="rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-3 py-2 text-sm text-[var(--k-t1)] focus:outline-none focus:ring-1 focus:ring-[var(--k-accent)]"
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">Activos</option>
          <option value="PAUSED">Pausados</option>
          <option value="DROPIN">Drop-in</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        <select
          value={boxFilter}
          onChange={(e) => handleBoxChange(e.target.value)}
          className="rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-3 py-2 text-sm text-[var(--k-t1)] focus:outline-none focus:ring-1 focus:ring-[var(--k-accent)]"
        >
          <option value="">Todos los boxes</option>
          {boxes.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className="k-card"
        style={{ opacity: isPending ? 0.7 : 1, transition: "opacity 0.15s" }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
          <p className="k-eyebrow">
            {total.toLocaleString("es-MX")} atleta{total === 1 ? "" : "s"}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin atletas que coincidan"
              description="Intenta cambiar el filtro de estado, box o la búsqueda."
            />
          </div>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden md:block">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(r) => r.id}
                onRowClick={(r) => setDrawerAthleteId(r.id)}
              />
            </div>

            {/* Mobile: cards */}
            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {rows.map((athlete) => (
                <li key={athlete.id}>
                  <button
                    type="button"
                    onClick={() => setDrawerAthleteId(athlete.id)}
                    className="k-card w-full text-left"
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span
                          style={{
                            fontFamily: "var(--k-font-body)",
                            fontWeight: 500,
                            fontSize: 14,
                            color: "var(--k-t1)",
                            lineHeight: 1.3,
                          }}
                        >
                          {athlete.firstName} {athlete.lastName}
                        </span>
                        {athlete.email ? (
                          <span
                            style={{
                              fontFamily: "var(--k-font-display)",
                              fontSize: 10,
                              color: "var(--k-t3)",
                              marginTop: 2,
                            }}
                          >
                            {athlete.email}
                          </span>
                        ) : null}
                      </div>
                      <AthleteStatusBadge status={athlete.status} />
                    </div>

                    {/* Box */}
                    <p
                      style={{ fontSize: 12, color: "var(--k-t2)", margin: 0 }}
                    >
                      {athlete.boxName}
                      <span
                        style={{
                          fontFamily: "var(--k-font-display)",
                          fontSize: 10,
                          color: "var(--k-t3)",
                          marginLeft: 4,
                        }}
                      >
                        /{athlete.boxSlug}
                      </span>
                    </p>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                        borderTop: "1px solid var(--k-line)",
                        paddingTop: 10,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 9,
                            color: "var(--k-t3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Plan
                        </span>
                        <span style={{ fontSize: 12, color: "var(--k-t1)" }}>
                          {athlete.activePlanName ?? (
                            <span style={{ color: "var(--k-t3)" }}>—</span>
                          )}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 9,
                            color: "var(--k-t3)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Última clase
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 12,
                            color: "var(--k-t2)",
                          }}
                        >
                          {fmtDate(athlete.lastAttendanceAt)}
                        </span>
                      </div>
                    </div>

                    {/* Footer */}
                    <p
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        color: "var(--k-t3)",
                        margin: 0,
                      }}
                    >
                      Alta: {fmtDate(athlete.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {/* Pagination */}
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

      <SuperAthleteDrawer
        athleteId={drawerAthleteId}
        boxName={drawerBoxName}
        onClose={() => setDrawerAthleteId(null)}
      />
    </>
  );
}
