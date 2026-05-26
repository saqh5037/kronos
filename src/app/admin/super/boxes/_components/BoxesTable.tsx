"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { EmptyState } from "@/components/data/EmptyState";
import { useUrlPatch } from "@/lib/url-state";
import type { SuperBoxRow } from "./types";
import { StatusBadge } from "./StatusBadge";
import { BoxDrawer } from "./BoxDrawer";

// Safe date formatter — uses string input, avoids hydration mismatch
function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Props = {
  rows: SuperBoxRow[];
  total: number;
  page: number;
  pageSize: number;
};

export function BoxesTable({ rows, total, page, pageSize }: Props) {
  const patch = useUrlPatch();
  const [drawerBox, setDrawerBox] = useState<SuperBoxRow | null>(null);

  const columns = useMemo<ColumnDef<SuperBoxRow, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Box",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-medium text-[var(--k-t1)]">
              {row.original.name}
            </span>
            <span className="font-mono text-[10px] text-[var(--k-t3)]">
              /{row.original.slug}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "ownerEmail",
        header: "Owner",
        cell: ({ row }) => (
          <span className="text-xs text-[var(--k-t2)]">
            {row.original.ownerEmail ?? (
              <span className="text-[var(--k-t3)]">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "athleteCount",
        header: "Atletas",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-bold text-[var(--k-t1)]">
            {row.original.athleteCount.toLocaleString("es-MX")}
          </span>
        ),
      },
      {
        accessorKey: "userCount",
        header: "Usuarios",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t2)]">
            {row.original.userCount.toLocaleString("es-MX")}
          </span>
        ),
      },
      {
        accessorKey: "planName",
        header: "Plan",
        cell: ({ row }) =>
          row.original.planName ? (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                fontWeight: 600,
                color: "var(--k-t1)",
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              {row.original.planName}
            </span>
          ) : (
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 11,
                color: "var(--k-t3)",
                background: "var(--k-elevated)",
                border: "1px dashed var(--k-line)",
                padding: "2px 8px",
                borderRadius: 999,
              }}
            >
              Sin plan
            </span>
          ),
      },
      {
        accessorKey: "subscriptionStatus",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge status={row.original.subscriptionStatus} />
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
      <div className="k-card">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--k-line)] px-4 py-3">
          <p className="k-eyebrow">
            {total} box{total === 1 ? "" : "es"}
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Sin boxes que coincidan"
              description="Intenta cambiar el filtro de estado o la búsqueda."
            />
          </div>
        ) : (
          <>
            {/* Desktop: tabla — hidden on mobile */}
            <div className="hidden md:block">
              <DataTable
                data={rows}
                columns={columns}
                rowKey={(r) => r.id}
                onRowClick={(r) => setDrawerBox(r)}
              />
            </div>

            {/* Mobile: cards — hidden on md+ */}
            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {rows.map((box) => (
                <li key={box.id}>
                  <button
                    type="button"
                    onClick={() => setDrawerBox(box)}
                    className="k-card w-full text-left"
                    style={{
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {/* Header: nombre + badge */}
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
                          {box.name}
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 10,
                            color: "var(--k-t3)",
                            marginTop: 2,
                          }}
                        >
                          /{box.slug}
                        </span>
                      </div>
                      <StatusBadge status={box.subscriptionStatus} />
                    </div>

                    {/* Owner */}
                    <p
                      style={{ fontSize: 12, color: "var(--k-t2)", margin: 0 }}
                    >
                      {box.ownerEmail ?? (
                        <span style={{ color: "var(--k-t3)" }}>Sin owner</span>
                      )}
                    </p>

                    {/* Stats row */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr",
                        gap: 8,
                        borderTop: "1px solid var(--k-line)",
                        paddingTop: 10,
                      }}
                    >
                      {/* Atletas */}
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
                          Atletas
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--k-t1)",
                            lineHeight: 1,
                          }}
                        >
                          {box.athleteCount.toLocaleString("es-MX")}
                        </span>
                      </div>
                      {/* Usuarios */}
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
                          Usuarios
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--k-font-display)",
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--k-t2)",
                            lineHeight: 1,
                          }}
                        >
                          {box.userCount.toLocaleString("es-MX")}
                        </span>
                      </div>
                      {/* Plan */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 4,
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
                        {box.planName ? (
                          <span
                            style={{
                              fontFamily: "var(--k-font-display)",
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--k-t1)",
                              background: "var(--k-elevated)",
                              border: "1px solid var(--k-line)",
                              padding: "2px 8px",
                              borderRadius: 999,
                              display: "inline-block",
                            }}
                          >
                            {box.planName}
                          </span>
                        ) : (
                          <span
                            style={{
                              fontFamily: "var(--k-font-display)",
                              fontSize: 11,
                              color: "var(--k-t3)",
                              background: "var(--k-elevated)",
                              border: "1px dashed var(--k-line)",
                              padding: "2px 8px",
                              borderRadius: 999,
                              display: "inline-block",
                            }}
                          >
                            Sin plan
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer: fecha alta */}
                    <p
                      style={{
                        fontFamily: "var(--k-font-display)",
                        fontSize: 10,
                        color: "var(--k-t3)",
                        margin: 0,
                      }}
                    >
                      Alta: {fmtDate(box.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>

            {/* Pagination — shared, visible en ambas vistas */}
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

      <BoxDrawer box={drawerBox} onClose={() => setDrawerBox(null)} />
    </>
  );
}
