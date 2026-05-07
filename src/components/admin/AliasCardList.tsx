"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { removeAlias } from "@/server/actions/aliases";

type Alias = {
  id: string;
  alias: string;
  athleteName: string;
  createdAt: Date;
};

export default function AliasCardList({
  aliases: initialAliases,
  isOwner,
}: {
  aliases: Alias[];
  isOwner: boolean;
}) {
  const [aliases, setAliases] = useState(initialAliases);
  const [search, setSearch] = useState("");
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return aliases;
    const q = search.toLowerCase();
    return aliases.filter(
      (a) =>
        a.alias.toLowerCase().includes(q) ||
        a.athleteName.toLowerCase().includes(q),
    );
  }, [aliases, search]);

  async function handleDelete(id: string) {
    await removeAlias(id);
    setAliases((prev) => prev.filter((a) => a.id !== id));
    setConfirmingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M11 11L14 14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar apodo o atleta..."
          className="w-full bg-[var(--k-elevated)] text-text text-sm rounded-xl pl-10 pr-4 py-2.5 border border-white/10 placeholder:text-text-3 focus:outline-none focus:border-[var(--k-t2)] transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-3 hover:text-text-2"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 2L12 12M12 2L2 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      <p className="text-[11px] text-text-3 font-mono uppercase tracking-wider">
        {filtered.length} apodo{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="k-card-flat p-3.5 flex items-center gap-3"
            >
              <span className="k-chip k-chip-strain text-[10px] font-mono truncate max-w-[120px]">
                {a.alias}
              </span>

              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-text-3 shrink-0"
              >
                <path
                  d="M3 8H13M13 8L9 4M13 8L9 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="text-sm text-text-2 truncate flex-1">
                {a.athleteName}
              </span>

              <span className="text-[10px] text-text-3 font-mono shrink-0 hidden sm:block">
                {a.createdAt.toLocaleDateString("es-MX")}
              </span>

              {isOwner && (
                <div className="shrink-0">
                  {confirmingId === a.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-3">¿Seguro?</span>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="text-[11px] text-[var(--k-warning)] font-medium hover:underline"
                      >
                        Sí, borrar
                      </button>
                      <button
                        onClick={() => setConfirmingId(null)}
                        className="text-[11px] text-text-3 hover:text-text-2"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingId(a.id)}
                      className="text-[11px] text-text-3 hover:text-[var(--k-warning)] transition-colors"
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                      >
                        <path
                          d="M2 4H12M4.5 4V2.5C4.5 2.22386 4.72386 2 5 2H9C9.27614 2 9.5 2.22386 9.5 2.5V4M6 7V10M8 7V10"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="k-card p-8 text-center"
        >
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-text-2">
            No encontramos apodos con &quot;{search}&quot;
          </p>
        </motion.div>
      )}
    </div>
  );
}
