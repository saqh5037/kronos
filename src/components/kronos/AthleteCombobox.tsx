"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Athlete {
  athleteId: string;
  firstName: string;
  lastName: string;
}

interface AthleteComboboxProps {
  athletes: Athlete[];
  value: string | null;
  onChange: (athleteId: string | null) => void;
  placeholder?: string;
}

export default function AthleteCombobox({
  athletes,
  value,
  onChange,
  placeholder = "Buscar atleta...",
}: AthleteComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = athletes.find((a) => a.athleteId === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return athletes;
    const q = query.toLowerCase();
    return athletes.filter(
      (a) =>
        a.firstName.toLowerCase().includes(q) ||
        a.lastName.toLowerCase().includes(q),
    );
  }, [athletes, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleSelect(athleteId: string | null) {
    onChange(athleteId);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setQuery("");
        }}
        className="w-full text-left bg-[var(--card-2)] text-[var(--text)] text-sm rounded-lg px-3 py-2 border border-[var(--line)] min-w-[160px] flex items-center justify-between gap-2 hover:border-[var(--line-strong)] transition-colors"
      >
        <span
          className={selected ? "text-[var(--text)]" : "text-[var(--text-3)]"}
        >
          {selected
            ? `${selected.firstName} ${selected.lastName}`
            : "-- Sin match --"}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-[var(--text-3)] transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5L6 8L9.5 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 mt-1 w-full min-w-[200px] bg-[var(--card)] border border-[var(--line)] rounded-lg shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-[var(--line)]">
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]"
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                >
                  <circle
                    cx="6"
                    cy="6"
                    r="4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 10L12.5 12.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  className="w-full bg-[var(--card-2)] text-[var(--text)] text-sm rounded-md pl-8 pr-3 py-1.5 border border-[var(--line)] placeholder:text-[var(--text-3)] focus:outline-none focus:border-[var(--steel)] transition-colors"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className="w-full text-left px-3 py-2 text-sm text-[var(--text-3)] hover:bg-[var(--hover-subtle)] transition-colors border-b border-[var(--line)]"
              >
                -- Sin match --
              </button>
              {filtered.map((athlete, i) => (
                <motion.button
                  key={athlete.athleteId}
                  type="button"
                  onClick={() => handleSelect(athlete.athleteId)}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-subtle)] transition-colors flex items-center gap-2 ${
                    athlete.athleteId === value
                      ? "bg-[var(--steel-soft)] text-[var(--steel)]"
                      : "text-[var(--text-2)]"
                  }`}
                >
                  {athlete.athleteId === value && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6.5L5 9L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span>
                    {athlete.firstName} {athlete.lastName}
                  </span>
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-4 text-sm text-[var(--text-3)] text-center">
                  No se encontró ningún atleta
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
