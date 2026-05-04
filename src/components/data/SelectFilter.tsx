"use client";

import { useSearchParamState } from "@/lib/url-state";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string };

type Props = {
  paramKey: string;
  options: SelectOption[];
  label?: string;
  allLabel?: string;
  className?: string;
};

export function SelectFilter({
  paramKey,
  options,
  label,
  allLabel = "Todos",
  className,
}: Props) {
  const [value, setValue] = useSearchParamState(paramKey);

  return (
    <label
      className={cn(
        "flex items-center gap-2 text-xs text-[var(--text-2)]",
        className,
      )}
    >
      {label ? <span className="k-eyebrow">{label}</span> : null}
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--text)] focus:border-[var(--strain-line)] focus:outline-none"
      >
        <option value="">{allLabel}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
