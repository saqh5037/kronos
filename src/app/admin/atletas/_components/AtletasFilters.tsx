"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { DateRangePicker } from "@/components/data/DateRangePicker";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";

export function AtletasFilters() {
  return (
    <FilterBar className="mb-4">
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
