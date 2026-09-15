"use client";

import { Search } from "lucide-react";
import { useDebouncedSearchParam } from "@/lib/url-state";
import { cn } from "@/lib/utils";

type Props = {
  placeholder?: string;
  paramKey?: string;
  className?: string;
  ariaLabel?: string;
};

export function SearchInput({
  placeholder = "Buscar…",
  paramKey = "q",
  className,
  ariaLabel,
}: Props) {
  const [value, setValue] = useDebouncedSearchParam(paramKey);

  return (
    <div className={cn("relative group", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t3)] group-focus-within:text-[var(--k-accent)] transition-colors"
      >
        <Search width={16} height={16} strokeWidth={1.75} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="min-h-11 w-full rounded-xl border border-[var(--k-line)] bg-[var(--k-surface)] py-2.5 pl-10 pr-3 text-sm font-medium text-[var(--k-t1)] placeholder:text-[var(--k-t2)] placeholder:font-normal focus:border-[var(--k-accent-line)] focus:outline-none focus:ring-2 focus:ring-[var(--k-accent-soft)] transition-all"
      />
    </div>
  );
}
