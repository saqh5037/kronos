"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { DateRangePicker } from "@/components/data/DateRangePicker";

export function AsistenciaFilters() {
  return (
    <FilterBar className="mb-4">
      <DateRangePicker />
    </FilterBar>
  );
}
