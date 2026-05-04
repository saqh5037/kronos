"use client";

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
    <div className={cn("relative", className)}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path
            d="m20 20-3.5-3.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--card)] py-2 pl-9 pr-3 text-sm text-[var(--text)] placeholder:text-[var(--input-placeholder)] focus:border-[var(--strain-line)] focus:outline-none"
      />
    </div>
  );
}
