import Link from "next/link";
import type { Route } from "next";
import { formatDateShort, formatMXN } from "@/lib/format";
import type { OverdueGroup } from "../_lib/period";

type Props = {
  rows: OverdueGroup[];
  /** Anchor of the cash register — the "register a payment" next step. */
  cashHref: string;
};

/**
 * Who owes money, one row per athlete + plan (audit 2026-09-15: the same
 * athlete appeared twice with two identical amounts), and every row carries
 * its next step.
 */
export function OverdueTable({ rows, cashHref }: Props) {
  if (rows.length === 0) return null;

  return (
    <div className="k-card overflow-hidden">
      {/* Phone: stacked row cards — "Adeudo" used to clip away */}
      <ul className="flex flex-col md:hidden">
        {rows.map((r) => (
          <li
            key={r.key}
            className="border-b border-[var(--k-line)] px-4 py-3 last:border-b-0"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.athleteName}</p>
                <p
                  className="truncate text-xs"
                  style={{ color: "var(--k-t2)" }}
                >
                  {r.planName}
                  {r.occurrences > 1 ? ` · ${r.occurrences} periodos` : ""}
                </p>
                <p className="mt-1.5 font-mono text-[11px] text-[var(--k-t3)]">
                  Venció {formatDateShort(r.endDate)} · {r.daysOverdue} días
                </p>
              </div>
              <span
                className="font-display shrink-0 text-base font-bold"
                style={{ color: "var(--k-warning)" }}
              >
                {formatMXN(r.pendingAmount)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <RowActions row={r} cashHref={cashHref} />
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="k-table text-sm">
          <thead>
            <tr>
              <th>Atleta</th>
              <th>Plan</th>
              <th>Venció</th>
              <th>Días</th>
              <th className="text-right">Adeudo</th>
              <th className="text-right">Siguiente paso</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td className="font-medium">{r.athleteName}</td>
                <td className="text-[var(--k-t2)]">
                  {r.planName}
                  {r.occurrences > 1 ? (
                    <span className="ml-1 text-[11px] text-[var(--k-t3)]">
                      · {r.occurrences} periodos
                    </span>
                  ) : null}
                </td>
                <td className="font-mono text-xs text-[var(--k-t3)]">
                  {formatDateShort(r.endDate)}
                </td>
                <td>
                  <span className="k-chip k-chip-ember text-[10px]">
                    {r.daysOverdue} días
                  </span>
                </td>
                <td
                  className="font-display text-right font-bold"
                  style={{ color: "var(--k-warning)" }}
                >
                  {formatMXN(r.pendingAmount)}
                </td>
                <td className="text-right">
                  <div className="inline-flex flex-wrap justify-end gap-3">
                    <RowActions row={r} cashHref={cashHref} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
