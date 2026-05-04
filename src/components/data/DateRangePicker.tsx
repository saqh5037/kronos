"use client";

import { useState, useRef, useEffect } from "react";
import { useDateRange } from "@/lib/url-state";
import {
  RANGE_PRESET_LABELS,
  formatRange,
  type RangePresetKey,
} from "@/lib/dates";
import { cn } from "@/lib/utils";

const PRESETS: RangePresetKey[] = [
  "today",
  "last7",
  "last30",
  "last90",
  "thisMonth",
  "lastMonth",
];

function toInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DateRangePicker({ className }: { className?: string }) {
  const [range, setRange] = useDateRange();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--card)] px-3 py-1.5 text-sm text-[var(--text)] hover:border-[var(--line-strong)]"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M3 9h18M8 3v4M16 3v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>{formatRange(range)}</span>
      </button>

      {open ? (
        <div
          role="dialog"
          className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-[var(--line)] bg-[var(--card)] p-3 shadow-lg"
          style={{ boxShadow: "var(--card-glow-hover)" }}
        >
          <div className="mb-2 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setRange({ preset: p });
                  setOpen(false);
                }}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-left text-xs",
                  range.preset === p
                    ? "bg-[var(--strain-soft)] text-[var(--strain)]"
                    : "hover:bg-[var(--hover-subtle)] text-[var(--text-2)]",
                )}
              >
                {RANGE_PRESET_LABELS[p]}
              </button>
            ))}
          </div>
          <div className="border-t border-[var(--line)] pt-3">
            <div className="k-eyebrow mb-2">Rango personalizado</div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={toInputValue(range.from)}
                onChange={(e) => {
                  const from = new Date(e.target.value);
                  if (!isNaN(from.getTime())) {
                    setRange({ from, to: range.to });
                  }
                }}
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[var(--text)]"
              />
              <span className="text-[var(--text-3)]">–</span>
              <input
                type="date"
                defaultValue={toInputValue(range.to)}
                onChange={(e) => {
                  const to = new Date(e.target.value);
                  if (!isNaN(to.getTime())) {
                    setRange({ from: range.from, to });
                  }
                }}
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg-soft)] px-2 py-1 text-xs text-[var(--text)]"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
