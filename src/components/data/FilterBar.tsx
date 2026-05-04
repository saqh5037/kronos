import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
