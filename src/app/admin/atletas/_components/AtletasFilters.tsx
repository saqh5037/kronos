"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { DateRangePicker } from "@/components/data/DateRangePicker";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";
import { useSearchParamState } from "@/lib/url-state";

function ActiveChip() {
  const [status, setStatus] = useSearchParamState("status");
  const isActive = status === "ACTIVE";

  return (
    <button
      type="button"
      onClick={() => setStatus(isActive ? "" : "ACTIVE")}
      className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
      style={
        isActive
          ? {
              background: "var(--k-accent-soft)",
              border: "1px solid var(--k-accent-line)",
              color: "var(--k-accent)",
            }
          : {
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line-2)",
              color: "var(--k-t2)",
            }
      }
    >
      Activos
    </button>
  );
}

export function AtletasFilters() {
  return (
    <FilterBar className="mb-4">
      <ActiveChip />
      <DateRangePicker />
      <SearchInput
        placeholder="Buscar nombre, teléfono o email…"
        className="min-w-[260px] flex-1"
      />
      <SelectFilter
        paramKey="status"
        label="Estado"
        options={[
          { value: "ACTIVE", label: "Activos" },
          { value: "PAUSED", label: "Pausados" },
          { value: "DROPIN", label: "Drop-in" },
          { value: "CANCELLED", label: "Cancelados" },
        ]}
      />
    </FilterBar>
  );
}
