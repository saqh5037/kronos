"use client";

/*
 * Client component because `<ResponsiveList/>` takes `render` callbacks in its
 * column spec, and functions cannot cross the server->client boundary.
 */
import Link from "next/link";
import type { Route } from "next";
import { formatDateShort, formatMXN } from "@/lib/format";
import {
  ResponsiveList,
  type ColumnSpec,
} from "@/components/data/ResponsiveList";
import type { OverdueGroup } from "../_lib/period";

type Props = {
  rows: OverdueGroup[];
  /** Anchor of the cash register — the "register a payment" next step. */
  cashHref: string;
  /**
   * Authoritative number of morosos, from `getPaymentStats().overdueCount`.
   * `rows` is capped and deduped per athlete + plan, so when it is shorter
   * than this the table says so instead of quietly under-reporting.
   */
  totalCount?: number;
};

/**
 * Who owes money, one row per athlete + plan (audit 2026-09-15: the same
 * athlete appeared twice with two identical amounts), and every row carries
 * its next step.
 *
 * Both renderings — the `md+` table and the stacked phone cards — come from
 * ONE `ColumnSpec[]` through `<ResponsiveList/>`. The hand-rolled pair this
 * replaced is exactly how "Adeudo" went missing at 360 in the first place.
 */
export function OverdueTable({ rows, cashHref, totalCount }: Props) {
  if (rows.length === 0) return null;

  const columns: ColumnSpec<OverdueGroup>[] = [
    {
      key: "athleteName",
      label: "Atleta",
      primary: true,
      render: (r) => <span className="font-medium">{r.athleteName}</span>,
    },
    {
      key: "planName",
      label: "Plan",
      render: (r) => (
        <span className="text-[var(--k-t2)]">
          {r.planName}
          {r.occurrences > 1 ? (
            <span className="ml-1 text-[11px] text-[var(--k-t3)]">
              · {r.occurrences} periodos
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "endDate",
      label: "Venció",
      render: (r) => (
        <span className="font-mono text-xs text-[var(--k-t3)]">
          {formatDateShort(r.endDate)}
        </span>
      ),
    },
    {
      key: "daysOverdue",
      label: "Días",
      render: (r) => (
        <span className="k-chip k-chip-ember text-[10px]">
          {r.daysOverdue} días
        </span>
      ),
    },
    {
      key: "pendingAmount",
      label: "Adeudo",
      align: "right",
      render: (r) => (
        <span
          className="font-display font-bold"
          style={{ color: "var(--k-warning)" }}
        >
          {formatMXN(r.pendingAmount)}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Siguiente paso",
      align: "right",
      render: (r) => (
        <span className="inline-flex flex-wrap justify-end gap-3">
          <RowActions row={r} cashHref={cashHref} />
        </span>
      ),
    },
  ];

  const hidden = (totalCount ?? rows.length) - rows.length;

  return (
    <div className="k-card overflow-hidden">
      <ResponsiveList
        rows={rows}
        columns={columns}
        rowKey={(r) => r.key}
        caption="Membresías vencidas sin pago, por atleta y plan"
        className="p-2 md:p-0"
      />
      {hidden > 0 ? (
        <p
          className="border-t px-4 py-2 text-[11px]"
          style={{ borderColor: "var(--k-line)", color: "var(--k-t3)" }}
        >
          Se muestran {rows.length} de {totalCount} membresías vencidas.
        </p>
      ) : null}
    </div>
  );
}

function RowActions({
  row,
  cashHref,
}: {
  row: OverdueGroup;
  cashHref: string;
}) {
  return (
    <>
      <Link
        href={
          `/admin/atletas?q=${encodeURIComponent(row.athleteName)}` as Route
        }
        className="text-[11px] font-semibold underline decoration-dotted"
        style={{ color: "var(--k-t2)" }}
      >
        Ver atleta
      </Link>
      <a
        href={cashHref}
        className="text-[11px] font-semibold underline decoration-dotted"
        style={{ color: "var(--k-accent)" }}
      >
        Registrar pago
      </a>
    </>
  );
}
