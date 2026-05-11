"use client";

import { useState } from "react";
import { createBodyMetricForAthlete } from "@/server/actions/body-metrics";
import { BODY_METRIC_LABEL } from "@/lib/validations/body-metric";
import type { BodyMetricType } from "@/lib/validations/body-metric";
import { LogMeasurementModal } from "@/app/atleta/salud/_components/LogMeasurementModal";

type Entry = {
  id: string;
  type: string;
  label: string | null;
  value: number;
  unit: string;
  measuredAt: Date;
};

type Props = {
  athleteId: string;
  entries: Entry[];
};

const fmtShortDate = (d: Date) =>
  new Date(d).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });

export function AthleteBodyMetrics({ athleteId, entries }: Props) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Entry[]>(entries);

  function labelFor(e: Entry): string {
    if (e.label) return e.label;
    return BODY_METRIC_LABEL[e.type as BodyMetricType] ?? e.type;
  }

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="k-eyebrow">Composición corporal</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="k-tap"
          style={{
            background: "var(--k-accent)",
            color: "var(--k-accent-on)",
            border: "none",
            padding: "6px 12px",
            borderRadius: 8,
            fontFamily: "var(--k-font-display)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          + Registrar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--k-t3)]">
          Sin mediciones registradas. Empieza con el peso.
        </p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 8).map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-[var(--k-elevated)]"
            >
              <span className="text-xs text-[var(--k-t2)]">
                {fmtShortDate(e.measuredAt)} · {labelFor(e)}
              </span>
              <span className="font-mono text-sm font-bold text-[var(--k-t1)]">
                {e.value} {e.unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      <LogMeasurementModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          /* items already updated optimistically in saveAction */
        }}
        saveAction={async (payload) => {
          const created = await createBodyMetricForAthlete(athleteId, payload);
          setItems((prev) => [
            {
              id: created.id,
              type: created.type,
              label: created.label,
              value: created.value,
              unit: created.unit,
              measuredAt: created.measuredAt,
            },
            ...prev,
          ]);
        }}
      />
    </section>
  );
}
