"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
  /** Keep the range readout even when there is a single page. Default false. */
  alwaysShowRange?: boolean;
};

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  className,
  alwaysShowRange = false,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // A "1 / 1" pager with two disabled arrows is chrome that says nothing
  // (audit 2026-09-15, /admin/atletas).
  if (totalPages <= 1 && !alwaysShowRange) return null;

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
      {totalPages > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--k-line)] bg-[var(--k-surface)] px-2 hover:border-[var(--k-line-2)] disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft width={16} height={16} aria-hidden focusable={false} />
          </button>
          <span className="px-2 font-mono">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--k-line)] bg-[var(--k-surface)] px-2 hover:border-[var(--k-line-2)] disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight
              width={16}
              height={16}
              aria-hidden
              focusable={false}
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}
