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
    <div className="k-card mb-4 p-4 md:p-5">
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
        <div>
          <label
            htmlFor="filter-from"
            className="mb-1 block font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase"
          >
            Cobros desde
          </label>
          <input
            id="filter-from"
            type="date"
            value={from}
            onChange={(e) => patch({ from: e.target.value || null })}
            className="w-full rounded-lg border border-[var(--k-line-2)] bg-[var(--k-surface)] p-2 text-sm text-[var(--k-t1)] focus:border-[var(--k-accent)] focus:outline-none"
          />
          <p className="mt-1 text-[10px]" style={{ color: "var(--k-t3)" }}>
            Día / mes / año
          </p>
        </div>
        <div>
          <label
            htmlFor="filter-to"
            className="mb-1 block font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase"
          >
            Cobros hasta
          </label>
          <input
            id="filter-to"
            type="date"
            value={to}
            onChange={(e) => patch({ to: e.target.value || null })}
            className="w-full rounded-lg border border-[var(--k-line-2)] bg-[var(--k-surface)] p-2 text-sm text-[var(--k-t1)] focus:border-[var(--k-accent)] focus:outline-none"
          />
          <p className="mt-1 text-[10px]" style={{ color: "var(--k-t3)" }}>
            Día / mes / año
          </p>
        </div>
        <div>
          <label
            htmlFor="filter-plan"
            className="mb-1 block font-mono text-xs tracking-wider text-[var(--k-t3)] uppercase"
          >
            Plan
          </label>
          <select
            id="filter-plan"
            value={planSlug}
            onChange={(e) => patch({ plan: e.target.value || null })}
            className="w-full rounded-lg border border-[var(--k-line-2)] bg-[var(--k-surface)] p-2 text-sm text-[var(--k-t1)] focus:border-[var(--k-accent)] focus:outline-none"
          >
            <option value="">Todos</option>
            {plans.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px]" style={{ color: "var(--k-t3)" }}>
            &nbsp;
          </p>
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
