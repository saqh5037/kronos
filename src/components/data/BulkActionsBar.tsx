"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  count: number;
  onClear?: () => void;
  children: ReactNode;
  className?: string;
};

export function BulkActionsBar({ count, onClear, children, className }: Props) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 mx-auto flex w-fit items-center gap-3 rounded-xl border border-[var(--k-line-2)] bg-[var(--k-elevated)] px-4 py-2 shadow-lg",
        className,
      )}
      style={{ boxShadow: "0 6px 20px rgba(0, 0, 0, 0.45)" }}
    >
      <span className="k-eyebrow text-[var(--k-t2)]">
        {count} seleccionado{count === 1 ? "" : "s"}
      </span>
      <div className="h-4 w-px bg-[var(--k-line)]" />
      <div className="flex items-center gap-2">{children}</div>
      {onClear ? (
        <>
          <div className="h-4 w-px bg-[var(--k-line)]" />
          <button
            type="button"
            onClick={onClear}
            className="inline-flex min-h-11 items-center text-xs text-[var(--k-t2)] hover:text-[var(--k-t1)]"
          >
            Limpiar
          </button>
        </>
      ) : null}
    </div>
  );
}
