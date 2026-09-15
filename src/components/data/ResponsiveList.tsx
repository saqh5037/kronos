"use client";

/**
 * One column spec, two renderings: a real `<table>` from `md` up, stacked row
 * cards below it (audit 2026-09-15, P0 #4/#5 — `/admin/reservas` at 360 renders
 * rows with no athlete name, `/admin/pagos` clips Monto/Estado/Adeudo).
 *
 * Because both renderings read the same `ColumnSpec[]`, a column can never be
 * present in the table and missing from the phone layout.
 */
import { cn } from "@/lib/utils";
import {
  primaryColumnIndex,
  toCardModel,
  type ColumnSpec,
} from "./responsive-list";

export type { ColumnSpec } from "./responsive-list";

export interface ResponsiveListProps<T> {
  rows: T[];
  columns: ColumnSpec<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Accessible name for the table. */
  caption?: string;
  empty?: React.ReactNode;
  className?: string;
}

const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function ResponsiveList<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  caption,
  empty,
  className,
}: ResponsiveListProps<T>) {
  if (rows.length === 0 && empty !== undefined) {
    return <div className={className}>{empty}</div>;
  }

  const titleIndex = primaryColumnIndex(columns);

  return (
    <div className={className}>
      {/* md+ : the table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="k-table w-full">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={ALIGN_CLASS[c.align ?? "left"]}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={ALIGN_CLASS[c.align ?? "left"]}
                  >
                    {c.render
                      ? c.render(row)
                      : ((row as Record<string, unknown>)[c.key] as React.ReactNode) ??
                        "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* below md : one card per row, every column kept */}
      <ul className="flex list-none flex-col gap-2 md:hidden">
        {rows.map((row) => {
          const card = toCardModel(columns, row);
          const titleColumn = titleIndex >= 0 ? columns[titleIndex] : null;
          return (
            <li key={rowKey(row)}>
              <div
                role={onRowClick ? "button" : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "flex flex-col gap-2 rounded-xl border border-[var(--k-line)] bg-[var(--k-surface)] p-3",
                  onRowClick && "min-h-[44px] cursor-pointer",
                )}
              >
                {card.title ? (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-[var(--k-t1)]">
                      {card.title.value}
                    </span>
                    {titleColumn ? (
                      <span className="sr-only">{titleColumn.label}</span>
                    ) : null}
                  </div>
                ) : null}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {card.fields.map((f) => (
                    <div key={f.key} className="flex flex-col gap-0.5">
                      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--k-t2)]">
                        {f.label}
                      </dt>
                      <dd
                        className={cn(
                          "text-xs text-[var(--k-t1)]",
                          ALIGN_CLASS[f.align],
                        )}
                      >
                        {f.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default ResponsiveList;
