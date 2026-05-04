import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--line)] bg-[var(--card)] py-10 text-center",
        className,
      )}
    >
      {icon ? <div className="text-[var(--text-3)]">{icon}</div> : null}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
        {description ? (
          <p className="text-xs text-[var(--text-2)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
