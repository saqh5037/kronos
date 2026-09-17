"use client";

import { useState } from "react";
import { Download } from "lucide-react";
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
          "k-btn-ghost inline-flex min-h-11 items-center gap-2 px-3 py-2 text-xs",
          (disabled || busy) && "opacity-50",
          className,
        )}
      >
        <Download
          width={16}
          height={16}
          strokeWidth={1.75}
          aria-hidden
          focusable={false}
        />
        {busy ? "Exportando…" : label}
      </button>
      {error ? (
        <span className="text-[10px] text-[var(--k-danger)]">{error}</span>
      ) : null}
    </div>
  );
}
