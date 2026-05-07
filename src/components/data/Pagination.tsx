"use client";

import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 text-xs text-[var(--k-t2)]",
        className,
      )}
    >
      <div>
        <span className="font-mono">{from}</span>–
        <span className="font-mono">{to}</span> de{" "}
        <span className="font-mono">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 hover:border-[var(--k-line-2)] disabled:opacity-40"
          aria-label="Anterior"
        >
          ‹
        </button>
        <span className="px-2 font-mono">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--card)] px-2 hover:border-[var(--k-line-2)] disabled:opacity-40"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>
    </div>
  );
}
