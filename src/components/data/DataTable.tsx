"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props<T> = {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selection?: RowSelectionState;
  onSelectionChange?: (next: RowSelectionState) => void;
  empty?: React.ReactNode;
  className?: string;
};

export function DataTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  selectable = false,
  selection,
  onSelectionChange,
  empty,
  className,
}: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalSel, setInternalSel] = useState<RowSelectionState>({});
  const sel = selection ?? internalSel;

  const finalColumns = useMemo<ColumnDef<T, unknown>[]>(() => {
    if (!selectable) return columns;
    const checkbox: ColumnDef<T, unknown> = {
      id: "_select",
      size: 44,
      header: ({ table }) => (
        <label className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center">
          <input
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
            aria-label="Seleccionar todo"
            className="h-4 w-4 accent-[var(--k-accent)]"
          />
        </label>
      ),
      cell: ({ row }) => (
        <label
          className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label="Seleccionar fila"
            className="h-4 w-4 accent-[var(--k-accent)]"
          />
        </label>
      ),
    };
    return [checkbox, ...columns];
  }, [columns, selectable]);

  const table = useReactTable({
    data,
    columns: finalColumns,
    state: { sorting, rowSelection: sel },
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === "function" ? updater(sel) : updater;
      if (onSelectionChange) onSelectionChange(next);
      else setInternalSel(next);
    },
    getRowId: rowKey,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (data.length === 0 && empty !== undefined) {
    return <div className={className}>{empty}</div>;
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="k-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const dir = header.column.getIsSorted();
                const SortIcon =
                  dir === "asc"
                    ? ArrowUp
                    : dir === "desc"
                      ? ArrowDown
                      : ChevronsUpDown;
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={
                      !canSort
                        ? undefined
                        : dir === "asc"
                          ? "ascending"
                          : dir === "desc"
                            ? "descending"
                            : "none"
                    }
                    style={{
                      width: header.getSize()
                        ? `${header.getSize()}px`
                        : undefined,
                    }}
                  >
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        type="button"
                        onClick={header.column.getToggleSortingHandler()}
                        aria-label={
                          dir === "asc"
                            ? "Ordenado de menor a mayor. Cambiar orden"
                            : dir === "desc"
                              ? "Ordenado de mayor a menor. Cambiar orden"
                              : "Sin ordenar. Ordenar por esta columna"
                        }
                        className={cn(
                          "inline-flex min-h-11 items-center gap-1 py-1 transition-colors hover:text-[var(--k-t1)]",
                          dir && "text-[var(--k-accent)]",
                        )}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIcon
                          width={14}
                          height={14}
                          strokeWidth={2}
                          aria-hidden
                          focusable={false}
                          style={{
                            color: dir ? "var(--k-accent)" : "var(--k-t2)",
                          }}
                        />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              className={cn(
                onRowClick && "cursor-pointer",
                row.getIsSelected() && "bg-[var(--k-accent-soft)]",
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
