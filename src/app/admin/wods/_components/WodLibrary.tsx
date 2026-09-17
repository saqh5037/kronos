"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import type { WODSummary } from "@/server/actions/wods";
import type { WODType } from "@prisma/client";
import { wodTypeLabel } from "@/lib/labels";
import { WodCard } from "./WodCard";

/**
 * Client-side search and type filter over the library (audit /admin/wods P2:
 * twenty cards with no way to find one).
 */
export function WodLibrary({ wods }: { wods: WODSummary[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<WODType | "ALL">("ALL");

  const types = useMemo(() => {
    const present = new Set<WODType>(wods.map((w) => w.type));
    return (Object.keys(wodTypeLabel) as WODType[]).filter((t) =>
      present.has(t),
    );
  }, [wods]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wods.filter((w) => {
      if (type !== "ALL" && w.type !== type) return false;
      if (q && !w.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [wods, query, type]);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            size={14}
            aria-hidden
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t2)]"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar WOD por nombre…"
            className="w-full rounded-xl border bg-[var(--k-surface)] py-2 pl-9 pr-9 text-sm"
            style={{ borderColor: "var(--k-line-2)" }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--k-t2)] hover:text-[var(--k-t1)]"
            >
              <X size={14} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="-mx-1 w-full overflow-x-auto px-1 sm:mx-0 sm:w-auto sm:px-0">
          <div className="inline-flex w-max gap-1.5">
            {(["ALL", ...types] as (WODType | "ALL")[]).map((t) => {
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  aria-pressed={active}
                  className="whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                  style={{
                    background: active
                      ? "var(--k-accent-soft)"
                      : "var(--k-elevated)",
                    color: active ? "var(--k-accent)" : "var(--k-t2)",
                    border: `1px solid ${
                      active ? "var(--k-accent-line)" : "var(--k-line-2)"
                    }`,
                  }}
                >
                  {t === "ALL" ? "Todos" : wodTypeLabel[t]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
        {filtered.length} de {wods.length} WOD{wods.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <div className="k-card p-8 text-center">
          <SearchX
            size={24}
            aria-hidden
            className="mx-auto mb-2 text-[var(--k-t2)]"
          />
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Ningún WOD coincide con esos filtros.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("ALL");
            }}
            className="k-btn-ghost mt-3 inline-flex min-h-11 items-center rounded-full px-4 text-xs font-bold"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((w) => (
            <WodCard key={w.id} w={w} />
          ))}
        </div>
      )}
    </>
  );
}
