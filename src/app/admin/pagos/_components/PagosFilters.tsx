"use client";

import { DateRangePicker } from "@/components/data/DateRangePicker";
import { SearchInput } from "@/components/data/SearchInput";
import { SelectFilter } from "@/components/data/SelectFilter";

type PlanOption = { id: string; name: string };

/**
 * Two explicit rows instead of one wrapping row: the range plus the search on
 * top, the three selects on a grid underneath. At 1280 "Plan" no longer ends up
 * alone on a second line, and at 360 each control gets its own full-width line.
 */
export function PagosFilters({ plans }: { plans: PlanOption[] }) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-3">
      <div className="flex flex-wrap items-center gap-3">
        <DateRangePicker />
        <SearchInput
          placeholder="Buscar atleta…"
          className="min-w-[200px] flex-1"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SelectFilter
          paramKey="gateway"
          label="Método"
          className="min-w-0"
          options={[
            { value: "CASH", label: "Efectivo" },
            { value: "MERCADOPAGO", label: "Mercado Pago" },
          ]}
        />
        <SelectFilter
          paramKey="status"
          label="Estado"
          className="min-w-0"
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
          className="min-w-0"
          options={plans.map((p) => ({ value: p.id, label: p.name }))}
        />
      </div>
    </div>
  );
}
