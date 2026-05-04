"use client";

import { useState } from "react";
import { downloadCSV, toCSV, type CSVColumn } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Props<T> = {
  filename: string;
  columns: CSVColumn<T>[];
  /** Sync rows or async fetcher (e.g. server action that returns full unpaginated set). */
  fetchRows: () => Promise<T[]> | T[];
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function ExportCSVButton<T>({
  filename,
  columns,
  fetchRows,
  label = "Exportar CSV",
  className,
  disabled,
}: Props<T>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle() {
    setBusy(true);
    setError(null);
    try {
      const rows = await fetchRows();
      const csv = toCSV(rows, columns);
      downloadCSV(filename, csv);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al exportar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handle}
        disabled={disabled || busy}
        className={cn(
          "k-btn-ghost inline-flex items-center gap-2 px-3 py-1.5 text-xs",
          (disabled || busy) && "opacity-50",
          className,
        )}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {busy ? "Exportando…" : label}
      </button>
      {error ? (
        <span className="text-[10px] text-[var(--pr)]">{error}</span>
      ) : null}
    </div>
  );
}
