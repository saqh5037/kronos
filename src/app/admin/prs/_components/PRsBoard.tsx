"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import type { PRRow } from "@/server/actions/prs";
import { formatDateShort } from "@/lib/format";

type PRCard = {
  movementName: string;
  top: PRRow;
  rest: PRRow[];
};

/**
 * PR board (audit 2026-09-15, /admin/prs P2).
 *
 * Was a rigid 3-column grid whose rows stretched to the tallest card, leaving
 * ~900 px of empty card. Now the cards are sized by their content (CSS
 * columns), and an athlete search answers the question the page is actually
 * opened with: "where does Emma stand?".
 */
export function PRsBoard({ prs }: { prs: PRRow[] }) {
  const [query, setQuery] = useState("");

  const cards = useMemo<PRCard[]>(() => {
    const q = query.trim().toLowerCase();
    const byMovement = new Map<string, PRRow[]>();
    for (const pr of prs) {
      if (q && !pr.athleteName.toLowerCase().includes(q)) continue;
      if (!byMovement.has(pr.movementName)) byMovement.set(pr.movementName, []);
      byMovement.get(pr.movementName)!.push(pr);
    }
    return Array.from(byMovement.entries()).map(([movementName, rows]) => {
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      return { movementName, top: sorted[0], rest: sorted.slice(1) };
    });
  }, [prs, query]);

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search
          size={14}
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--k-t2)]"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar atleta…"
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

      {cards.length === 0 ? (
        <div className="k-card p-8 text-center">
          <SearchX
            size={24}
            aria-hidden
            className="mx-auto mb-2 text-[var(--k-t2)]"
          />
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Sin PRs para “{query}”.
          </p>
        </div>
      ) : (
        <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [column-fill:_balance]">
          {cards.map(({ movementName, top, rest }) => (
            <div
              key={movementName}
              className="k-card mb-4 break-inside-avoid overflow-hidden"
            >
              <div
                className="px-4 py-4"
                style={{
                  background: "var(--k-accent-soft)",
                  borderBottom: "1px solid var(--k-line)",
                }}
              >
                <p className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
                  {movementName.toUpperCase()}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display font-bold text-4xl"
                    style={{
                      letterSpacing: "-0.03em",
                      color: "var(--k-accent)",
                    }}
                  >
                    {top.value}
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "var(--k-t2)" }}
                  >
                    {top.unit}
                  </span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--k-t2)" }}>
                  {top.athleteName} · {formatDateShort(top.achievedAt)}
                </p>
              </div>

              {rest.length > 0 ? (
                <ul className="flex flex-col">
                  {rest.map((pr, idx) => (
                    <li
                      key={pr.id}
                      className="px-4 py-2.5 border-b last:border-b-0 flex items-center justify-between"
                      style={{ borderColor: "var(--k-line)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="font-mono text-xs w-5"
                          style={{ color: "var(--k-t2)" }}
                        >
                          {idx + 2}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {pr.athleteName}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-sm flex-shrink-0">
                        {pr.value} {pr.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p
                  className="px-4 py-3 text-xs"
                  style={{ color: "var(--k-t2)" }}
                >
                  Solo 1 PR registrado
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
