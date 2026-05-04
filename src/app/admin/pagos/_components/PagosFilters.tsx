"use client";

import { FilterBar } from "@/components/data/FilterBar";
import { DateRangePicker } from "@/components/data/DateRangePicker";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";

type PlanOption = { id: string; name: string };

export function PagosFilters({ plans }: { plans: PlanOption[] }) {
  return (
    <FilterBar className="mb-4">
      <DateRangePicker />
      <SearchInput
        placeholder="Buscar atleta…"
        className="min-w-[220px] flex-1"
      />
      <SelectFilter
        paramKey="gateway"
        label="Método"
        options={[
          { value: "CASH", label: "Efectivo" },
          { value: "MERCADOPAGO", label: "Mercado Pago" },
        ]}
      />
      <SelectFilter
        paramKey="status"
        label="Estado"
        options={[
          { value: "PAID", label: "Pagado" },
          { value: "PENDING", label: "Pendiente" },
          { value: "FAILED", label: "Fallido" },
          { value: "REFUNDED", label: "Reembolsado" },
        ]}
      />
      <SelectFilter
        paramKey="plan"
        label="Plan"
        options={plans.map((p) => ({ value: p.id, label: p.name }))}
      />
    </FilterBar>
  );
}
