"use client";

/**
 * The at-risk list on `/admin/atletas`, on the shared responsive primitive.
 *
 * It used to be a bare `<table>` with no phone rendering at all, so at 360 the
 * three right-hand columns — days without a check-in, membership state and the
 * action — simply fell off the screen (audit 2026-09-15, P0 #5).
 *
 * Client component because `<ResponsiveList/>` takes `render` callbacks, and
 * functions cannot cross the server->client boundary.
 */
import Link from "next/link";
import type { Route } from "next";
import {
  ResponsiveList,
  type ColumnSpec,
} from "@/components/data/ResponsiveList";
import type { AtRiskAthlete } from "@/server/actions/athletes";

type Props = {
  rows: AtRiskAthlete[];
  /**
   * Authoritative at-risk count from `getAthleteCounts().atRisk`. `rows` is
   * capped by the action's `limit`, so its length is not the count.
   */
  totalCount?: number;
};

export function AtRiskTable({ rows, totalCount }: Props) {
  if (rows.length === 0) return null;

  const columns: ColumnSpec<AtRiskAthlete>[] = [
    {
      key: "name",
      label: "Atleta",
      primary: true,
      render: (a) => (
        <Link
          href={`/admin/atletas/${a.id}` as Route}
          className="font-medium transition-colors hover:text-[var(--k-accent)]"
        >
          {a.firstName} {a.lastName}
        </Link>
      ),
    },
    {
      key: "daysSinceLastAttendance",
      label: "Días sin asistir",
      render: (a) => (
        <span className="k-chip k-chip-pr text-[10px]">
          {a.daysSinceLastAttendance ?? "Nunca"}
          {a.daysSinceLastAttendance !== null ? "d" : ""}
        </span>
      ),
    },
    {
      key: "membership",
      label: "Membresía",
      render: (a) =>
        a.hasOverdueMembership ? (
          <span className="text-xs text-[var(--k-danger)]">Vencida</span>
        ) : (
          <span className="text-xs text-[var(--k-t2)]">Vigente</span>
        ),
    },
    {
      key: "action",
      label: "Acción",
      align: "right",
      render: (a) => (
        <Link
          href={`/admin/atletas/${a.id}` as Route}
          className="k-btn-ghost inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold"
        >
          Ver atleta
        </Link>
      ),
    },
  ];

  const hidden = (totalCount ?? rows.length) - rows.length;

  return (
    <div className="k-card overflow-hidden">
      <ResponsiveList
        rows={rows}
        columns={columns}
        rowKey={(a) => a.id}
        caption="Atletas en riesgo de dejar el box"
        className="p-2 md:p-0"
      />
      {hidden > 0 ? (
        <p
          className="border-t px-4 py-2 text-[11px]"
          style={{ borderColor: "var(--k-line)", color: "var(--k-t3)" }}
        >
          Se muestran {rows.length} de {totalCount} atletas en riesgo.
        </p>
      ) : null}
    </div>
  );
}

export default AtRiskTable;
