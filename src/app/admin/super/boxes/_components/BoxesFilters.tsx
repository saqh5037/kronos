"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";

export function BoxesFilters() {
  return (
    <FilterBar className="mb-4">
      <SearchInput
        placeholder="Buscar nombre, slug u owner…"
        paramKey="q"
        className="min-w-[260px] flex-1"
      />
      <SelectFilter
        paramKey="status"
        label="Estado"
        options={[
          { value: "ACTIVE", label: "Activos" },
          { value: "TRIAL", label: "Trial" },
          { value: "PAST_DUE", label: "Vencidos" },
          { value: "CANCELLED", label: "Cancelados" },
          { value: "EXPIRED", label: "Expirados" },
        ]}
      />
    </FilterBar>
  );
}
