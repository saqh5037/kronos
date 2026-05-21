"use client";

import dynamic from "next/dynamic";
import { FilterBar } from "@/components/data/FilterBar";

const DateRangePicker = dynamic(
  () =>
    import("@/components/data/DateRangePicker").then((m) => m.DateRangePicker),
  {
    ssr: false,
    loading: () => (
      <div
        className="k-skeleton rounded-md"
        style={{ height: 36, width: 220 }}
        aria-hidden="true"
      />
    ),
  },
);

export function ReportesFilters() {
  return (
    <FilterBar className="mb-4">
      <DateRangePicker />
    </FilterBar>
  );
}
