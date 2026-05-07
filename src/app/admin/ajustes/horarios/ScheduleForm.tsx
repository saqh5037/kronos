"use client";

import { useState, useTransition } from "react";
import {
  updateBoxSchedule,
  type BoxScheduleSettings,
  type DaySchedule,
} from "@/server/actions/box";

const DOWS: {
  key: keyof BoxScheduleSettings["weeklySchedule"];
  label: string;
}[] = [
  { key: "mon", label: "Lunes" },
  { key: "tue", label: "Martes" },
  { key: "wed", label: "Miércoles" },
  { key: "thu", label: "Jueves" },
  { key: "fri", label: "Viernes" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function ScheduleForm({
  initial,
  canEdit,
}: {
  initial: BoxScheduleSettings;
  canEdit: boolean;
}) {
  const [state, setState] = useState<BoxScheduleSettings>(initial);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function setDay(
    key: keyof BoxScheduleSettings["weeklySchedule"],
    value: DaySchedule,
  ) {
    setState((s) => ({
      ...s,
      weeklySchedule: { ...s.weeklySchedule, [key]: value },
    }));
  }

  function toggleHour(
    key: keyof BoxScheduleSettings["weeklySchedule"],
    hour: number,
  ) {
    setState((s) => {
      const day = s.weeklySchedule[key];
      const current = day ?? { kind: "WOD" as const, hours: [] };
      const has = current.hours.includes(hour);
      const newHours = has
        ? current.hours.filter((h) => h !== hour)
        : [...current.hours, hour].sort((a, b) => a - b);
      return {
        ...s,
        weeklySchedule: {
          ...s.weeklySchedule,
          [key]: newHours.length === 0 ? null : { ...current, hours: newHours },
        },
      };
    });
  }

  function setKind(
    key: keyof BoxScheduleSettings["weeklySchedule"],
    kind: "WOD" | "OPEN_BOX",
  ) {
    setState((s) => {
      const day = s.weeklySchedule[key];
      if (!day) return s;
      return {
        ...s,
        weeklySchedule: { ...s.weeklySchedule, [key]: { ...day, kind } },
      };
    });
  }

  async function save() {
    setMsg(null);
    startTransition(async () => {
      try {
        await updateBoxSchedule(state);
        setMsg("Guardado ✓");
      } catch (e) {
        setMsg(`Error: ${(e as Error).message}`);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Window settings */}
      <div className="k-card p-5">
        <h2 className="font-display text-lg font-bold mb-4">
          Reglas de reserva
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NumberField
            label="Capacity por defecto"
            value={state.defaultClassCapacity}
            onChange={(v) =>
              setState((s) => ({ ...s, defaultClassCapacity: v }))
            }
            disabled={!canEdit}
            min={1}
            max={200}
            help="Atletas máx por clase nueva"
          />
          <NumberField
            label="Apertura reservas (horas antes)"
            value={state.bookingOpenHoursAhead}
            onChange={(v) =>
              setState((s) => ({ ...s, bookingOpenHoursAhead: v }))
            }
            disabled={!canEdit}
            min={0}
            max={168}
            help="Default 24h"
          />
          <NumberField
            label="Cierre cancelación (min antes)"
            value={state.cancelCloseMinBefore}
            onChange={(v) =>
              setState((s) => ({ ...s, cancelCloseMinBefore: v }))
            }
            disabled={!canEdit}
            min={0}
            max={720}
            help="Default 30 min"
          />
        </div>
      </div>

      {/* Weekly schedule */}
      <div className="k-card p-5">
        <h2 className="font-display text-lg font-bold mb-4">
          Horarios semanales
        </h2>
        <div className="flex flex-col gap-3">
          {DOWS.map(({ key, label }) => {
            const day = state.weeklySchedule[key];
            return (
              <div
                key={key}
                className="rounded-xl p-3 border"
                style={{
                  background: day ? "var(--k-elevated)" : "transparent",
                  borderColor: "var(--k-line-2)",
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!day}
                        onChange={(e) =>
                          setDay(
                            key,
                            e.target.checked
                              ? { kind: "WOD", hours: [] }
                              : null,
                          )
                        }
                        disabled={!canEdit}
                      />
                      <span className="font-display text-base font-bold">
                        {label}
                      </span>
                    </label>
                    {!day && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--k-t3)" }}
                      >
                        cerrado
                      </span>
                    )}
                  </div>
                  {day && (
                    <div className="flex gap-1">
                      <KindToggle
                        active={day.kind === "WOD"}
                        onClick={() => setKind(key, "WOD")}
                        disabled={!canEdit}
                      >
                        WOD
                      </KindToggle>
                      <KindToggle
                        active={day.kind === "OPEN_BOX"}
                        onClick={() => setKind(key, "OPEN_BOX")}
                        disabled={!canEdit}
                      >
                        Open Box
                      </KindToggle>
                    </div>
                  )}
                </div>
                {day && (
                  <div className="flex flex-wrap gap-1.5">
                    {HOURS.map((h) => {
                      const on = day.hours.includes(h);
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHour(key, h)}
                          disabled={!canEdit}
                          className="font-mono text-[11px] font-bold rounded-md transition-all"
                          style={{
                            width: 38,
                            height: 30,
                            background: on
                              ? day.kind === "OPEN_BOX"
                                ? "var(--k-warning)"
                                : "var(--k-accent)"
                              : "var(--k-elevated)",
                            color: on ? "var(--k-accent-on)" : "var(--k-t3)",
                            border: `1px solid ${on ? "transparent" : "var(--k-line)"}`,
                            cursor: canEdit ? "pointer" : "not-allowed",
                            opacity: canEdit ? 1 : 0.7,
                          }}
                        >
                          {String(h).padStart(2, "0")}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save bar */}
      {canEdit && (
        <div className="sticky bottom-4 flex items-center justify-end gap-3">
          {msg && (
            <span
              className="text-sm font-medium"
              style={{
                color: msg.startsWith("Error")
                  ? "var(--k-danger)"
                  : "var(--k-accent)",
              }}
            >
              {msg}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={isPending}
            className="k-btn-grad px-6 py-2.5"
          >
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled,
  min,
  max,
  help,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  help?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border bg-[var(--k-elevated)] px-3 py-2 text-sm"
        style={{ borderColor: "var(--k-line-2)", color: "var(--k-t1)" }}
      />
      {help && (
        <span className="text-[10px]" style={{ color: "var(--k-t3)" }}>
          {help}
        </span>
      )}
    </label>
  );
}

function KindToggle({
  active,
  onClick,
  disabled,
  children,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase transition-all"
      style={{
        background: active ? "var(--k-surface)" : "transparent",
        color: active ? "var(--k-t1)" : "var(--k-t3)",
        border: `1px solid ${active ? "var(--k-line-2)" : "var(--k-line)"}`,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}
