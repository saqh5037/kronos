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
      size: 32,
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          aria-label="Seleccionar todo"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          aria-label="Seleccionar fila"
        />
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
                return (
                  <th
                    key={header.id}
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
                        className="inline-flex min-h-8 items-center gap-1 py-1 hover:text-[var(--text-2)]"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <span aria-hidden className="text-[var(--text-3)]">
                          {dir === "asc" ? "↑" : dir === "desc" ? "↓" : "↕"}
                        </span>
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
                row.getIsSelected() && "bg-[var(--strain-soft)]",
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
