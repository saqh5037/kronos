"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { DateRangePicker } from "@/components/data/DateRangePicker";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";
import { athleteStatusLabel } from "@/lib/labels";

/**
 * The list shows every ACTIVE athlete unless a status is chosen, so the empty
 * option is labelled as what it actually does. "all" clears the filter (audit
 * 2026-09-15: the 30-day default hid 34 of 42 athletes).
 */
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
        allLabel={`${athleteStatusLabel.ACTIVE}s (predeterminado)`}
        options={[
          { value: "all", label: "Todos los estados" },
          { value: "ACTIVE", label: `${athleteStatusLabel.ACTIVE}s` },
          { value: "PAUSED", label: `${athleteStatusLabel.PAUSED}s` },
          { value: "DROPIN", label: `${athleteStatusLabel.DROPIN}s` },
          { value: "CANCELLED", label: "Bajas" },
        ]}
      />
    </FilterBar>
  );
}
