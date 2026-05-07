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
      style={{ boxShadow: "var(--card-glow-hover)" }}
    >
      <span className="k-eyebrow text-[var(--k-t2)]">
        {count} seleccionado{count === 1 ? "" : "s"}
      </span>
      <div className="h-4 w-px bg-[var(--line)]" />
      <div className="flex items-center gap-2">{children}</div>
      {onClear ? (
        <>
          <div className="h-4 w-px bg-[var(--line)]" />
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[var(--k-t3)] hover:text-[var(--k-t2)]"
          >
            Limpiar
          </button>
        </>
      ) : null}
    </div>
  );
}
