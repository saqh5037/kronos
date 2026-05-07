"use client";

import { useUrlPatch } from "@/lib/url-state";
import { useSearchParams } from "next/navigation";

type PlanOption = { slug: string; name: string };

type Props = {
  plans: PlanOption[];
};

export function HistorialFilters({ plans }: Props) {
  const params = useSearchParams();
  const patch = useUrlPatch();

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const planSlug = params.get("plan") ?? "";

  const hasAny = Boolean(from || to || planSlug);

  return (
    <div className="k-card p-4 md:p-5 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div>
          <label
            htmlFor="filter-from"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--k-t3)] mb-1"
          >
            Desde
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => patch({ from: e.target.value || null })}
            className="w-full rounded-lg p-2 bg-[var(--k-surface)] border border-[var(--border)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-warning)]"
          />
        </div>
        <div>
          <label
            htmlFor="filter-to"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--k-t3)] mb-1"
          >
            Hasta
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => patch({ to: e.target.value || null })}
            className="w-full rounded-lg p-2 bg-[var(--k-surface)] border border-[var(--border)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-warning)]"
          />
        </div>
        <div>
          <label
            htmlFor="filter-plan"
            className="block text-xs font-mono uppercase tracking-wider text-[var(--k-t3)] mb-1"
          >
            Plan
          </label>
          <select
            id="filter-plan"
            value={planSlug}
            onChange={(e) => patch({ plan: e.target.value || null })}
            className="w-full rounded-lg p-2 bg-[var(--k-surface)] border border-[var(--border)] text-[var(--k-t1)] text-sm focus:outline-none focus:border-[var(--k-warning)]"
          >
            <option value="">Todos</option>
            {plans.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasAny && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => patch({ from: null, to: null, plan: null })}
            className="text-sm text-[var(--k-t3)] hover:text-[var(--k-t2)]"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
