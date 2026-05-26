"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useTransition } from "react";
import { DataTable } from "@/components/data/DataTable";
import { Pagination } from "@/components/data/Pagination";
import { ExportCSVButton } from "@/components/data/ExportCSVButton";
import { EmptyState } from "@/components/data/EmptyState";
import {
  listMembershipsPaged,
  pauseMembership,
  resumeMembership,
  cancelMembership,
  type MembershipRow,
} from "@/server/actions/memberships";
import type { CSVColumn } from "@/lib/csv";
import { useUrlPatch } from "@/lib/url-state";
import { kToast } from "@/lib/toast";
import { useConfirm } from "@/lib/use-confirm";

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

function MembershipActions({ membership }: { membership: MembershipRow }) {
  const [isPending, startTransition] = useTransition();
  // Once a cancel falls into the approval queue, lock the row so the owner
  // can't fire duplicate PermissionGrantRequests by re-clicking.
  const [requested, setRequested] = useState(false);
  const confirm = useConfirm();

  function handlePause() {
    startTransition(async () => {
      try {
        await pauseMembership(membership.id);
        kToast.info("Membresía pausada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al pausar");
      }
    });
  }

  function handleResume() {
    startTransition(async () => {
      try {
        await resumeMembership(membership.id);
        kToast.success("Membresía reactivada");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al reactivar");
      }
    });
  }

  async function handleCancel() {
    const ok = await confirm({
      title: "¿Cancelar esta membresía?",
      message: `Se cancelará la membresía de ${membership.athleteName}. Esta acción no se puede deshacer.`,
      confirmLabel: "Sí, cancelar",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        const result = await cancelMembership(membership.id);
        if ("status" in result && result.status === "pending_approval") {
          setRequested(true);
          kToast.warning("Solicitud enviada — requiere aprobación del owner");
        } else {
          kToast.info("Membresía cancelada");
        }
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al cancelar");
      }
    });
  }

  const canAct =
    membership.status === "ACTIVE" || membership.status === "PAUSED";
  if (!canAct) return null;

  return (
    <div className="flex items-center gap-1">
      {membership.status === "ACTIVE" && (
        <button
          onClick={handlePause}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md disabled:opacity-50 transition-colors"
          style={{ color: "var(--k-t2)" }}
          title="Pausar membresía"
        >
          {isPending ? "…" : "Pausar"}
        </button>
      )}
      {membership.status === "PAUSED" && (
        <button
          onClick={handleResume}
          disabled={isPending}
          className="text-xs px-2 py-1 rounded-md disabled:opacity-50 transition-colors"
          style={{ color: "var(--k-accent)" }}
          title="Reanudar membresía"
        >
          {isPending ? "…" : "Reanudar"}
        </button>
      )}
      <button
        onClick={handleCancel}
        disabled={isPending || requested}
        className="text-xs px-2 py-1 rounded-md disabled:opacity-50 transition-colors"
        style={{ color: "var(--k-danger)" }}
        title="Cancelar membresía"
      >
        {requested ? "Solicitado" : isPending ? "…" : "Cancelar"}
      </button>
    </div>
  );
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
            <span className="ml-1 font-mono text-[10px] text-[var(--k-t3)]">
              {row.original.planType}
            </span>
          </span>
        ),
      },
      {
        accessorKey: "startDate",
        header: "Vigencia",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--k-t3)]">
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
              <span className="text-[var(--k-t3)]">
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
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <MembershipActions membership={row.original} />,
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
