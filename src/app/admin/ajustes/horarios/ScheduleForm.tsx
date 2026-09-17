"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Copy } from "lucide-react";
import {
  updateBoxSchedule,
  type BoxScheduleSettings,
  type DaySchedule,
} from "@/server/actions/box";

type DayKey = keyof BoxScheduleSettings["weeklySchedule"];

const DOWS: { key: DayKey; label: string }[] = [
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
  const [msg, setMsg] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null,
  );

  const dirty = JSON.stringify(state) !== JSON.stringify(initial);

  function setDay(key: DayKey, value: DaySchedule) {
    setState((s) => ({
      ...s,
      weeklySchedule: { ...s.weeklySchedule, [key]: value },
    }));
  }

  function toggleHour(key: DayKey, hour: number) {
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

  function setKind(key: DayKey, kind: "WOD" | "OPEN_BOX") {
    setState((s) => {
      const day = s.weeklySchedule[key];
      if (!day) return s;
      return {
        ...s,
        weeklySchedule: { ...s.weeklySchedule, [key]: { ...day, kind } },
      };
    });
  }

  /** Copies one day's hours and kind onto every other day of the week. */
  function copyToAllDays(key: DayKey) {
    setState((s) => {
      const source = s.weeklySchedule[key];
      if (!source) return s;
      const next = { ...s.weeklySchedule };
      for (const { key: k } of DOWS) {
        next[k] = { kind: source.kind, hours: [...source.hours] };
      }
      return { ...s, weeklySchedule: next };
    });
  }

  async function save() {
    setMsg(null);
    startTransition(async () => {
      try {
        await updateBoxSchedule(state);
        setMsg({ tone: "ok", text: "Horarios guardados" });
      } catch (e) {
        setMsg({ tone: "error", text: (e as Error).message });
      }
    });
  }

  return (
    /* Bottom padding keeps the fixed save bar from covering the last day */
    <div className="flex flex-col gap-6 pb-32">
      {/* Window settings */}
      <div className="k-card p-5">
        <h2 className="font-display mb-4 text-lg font-bold">
          Reglas de reserva
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Apertura de reservas (horas antes)"
            value={state.bookingOpenHoursAhead}
            onChange={(v) =>
              setState((s) => ({ ...s, bookingOpenHoursAhead: v }))
            }
            disabled={!canEdit}
            min={0}
            max={168}
            help="Por omisión, 24 horas antes de la clase."
          />
          <NumberField
            label="Cierre de cancelación (minutos antes)"
            value={state.cancelCloseMinBefore}
            onChange={(v) =>
              setState((s) => ({ ...s, cancelCloseMinBefore: v }))
            }
            disabled={!canEdit}
            min={0}
            max={720}
            help="Por omisión, 30 minutos antes de la clase."
          />
        </div>
        {/* Capacity is one setting and it lives in Ajustes › Box */}
        <p className="mt-4 text-xs" style={{ color: "var(--k-t3)" }}>
          Capacidad por clase:{" "}
          <strong style={{ color: "var(--k-t2)" }}>
            {state.defaultClassCapacity} atletas
          </strong>
          . Se configura en{" "}
          <Link
            href="/admin/ajustes"
            className="underline decoration-dotted"
            style={{ color: "var(--k-accent)" }}
          >
            Ajustes › Box
          </Link>
          .
        </p>
      </div>

      {/* Weekly schedule */}
      <div className="k-card p-4 md:p-5">
        <h2 className="font-display mb-1 text-lg font-bold">
          Horarios semanales
        </h2>
        <p className="mb-4 text-xs" style={{ color: "var(--k-t3)" }}>
          Toca las horas en las que abre el box. La grilla de Programación se
          arma con esto.
        </p>
        <div className="flex flex-col gap-3">
          {DOWS.map(({ key, label }) => {
            const day = state.weeklySchedule[key];
            const openBox = day?.kind === "OPEN_BOX";
            return (
              <div
                key={key}
                className="rounded-xl border p-3"
                style={{
                  background: day ? "var(--k-elevated)" : "transparent",
                  borderColor: "var(--k-line-2)",
                }}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex min-h-11 cursor-pointer items-center gap-2">
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
                        className="h-4 w-4 accent-[var(--k-accent)]"
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
                    <div className="flex flex-wrap items-center gap-1">
                      <KindToggle
                        active={day.kind === "WOD"}
                        onClick={() => setKind(key, "WOD")}
                        disabled={!canEdit}
                      >
                        WOD
                      </KindToggle>
                      <KindToggle
                        active={openBox}
                        onClick={() => setKind(key, "OPEN_BOX")}
                        disabled={!canEdit}
                      >
                        Open Box
                      </KindToggle>
                      {canEdit && day.hours.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => copyToAllDays(key)}
                          className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-[10px] font-bold tracking-wider uppercase"
                          style={{
                            color: "var(--k-t2)",
                            border: "1px solid var(--k-line-2)",
                          }}
                          title={`Copiar el horario de ${label} a todos los días`}
                        >
                          <Copy size={12} strokeWidth={2.2} aria-hidden />
                          Copiar a todos los días
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
                {day && (
                  /* 44 px targets, 6 per row at 360 */
                  <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 md:grid-cols-12">
                    {HOURS.map((h) => {
                      const on = day.hours.includes(h);
                      const onOpenBox = on && openBox;
                      return (
                        <button
                          key={h}
                          type="button"
                          onClick={() => toggleHour(key, h)}
                          disabled={!canEdit}
                          aria-pressed={on}
                          className="font-display min-h-11 rounded-md text-[12px] font-bold transition-all"
                          style={{
                            background: onOpenBox
                              ? "var(--k-accent-soft)"
                              : on
                                ? "var(--k-accent)"
                                : "var(--k-elevated)",
                            color: onOpenBox
                              ? "var(--k-accent)"
                              : on
                                ? "var(--k-accent-on)"
                                : "var(--k-t3)",
                            border: `1px solid ${
                              onOpenBox
                                ? "var(--k-accent-line)"
                                : on
                                  ? "transparent"
                                  : "var(--k-line)"
                            }`,
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
        <div
          className="mt-4 flex flex-wrap items-center gap-4 text-[11px]"
          style={{ color: "var(--k-t3)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: "var(--k-accent)" }}
            />
            Hora con WOD
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-block h-3 w-3 rounded-sm"
              style={{
                background: "var(--k-accent-soft)",
                border: "1px solid var(--k-accent-line)",
              }}
            />
            Hora de Open Box
          </span>
        </div>
      </div>

      {/* Fixed save bar — never covers the grid thanks to the padding above */}
      {canEdit && (
        <div
          className="fixed right-0 bottom-0 left-0 z-40 border-t px-4 py-3"
          style={{
            background: "var(--k-surface)",
            borderColor: "var(--k-line-2)",
            paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          }}
        >
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-end gap-3">
            {msg && (
              <span
                className="text-sm font-medium"
                role="status"
                style={{
                  color:
                    msg.tone === "error"
                      ? "var(--k-danger)"
                      : "var(--k-accent)",
                }}
              >
                {msg.text}
              </span>
            )}
            {!msg && dirty && (
              <span className="text-xs" style={{ color: "var(--k-t3)" }}>
                Tienes cambios sin guardar
              </span>
            )}
            <button
              type="button"
              onClick={save}
              disabled={isPending || !dirty}
              className="k-btn-grad px-6 py-2.5"
            >
              {isPending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
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
        className="font-display text-[10px] font-bold tracking-wider uppercase"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </span>
      <input
        type="number"
        inputMode="numeric"
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
      aria-pressed={active}
      className="inline-flex min-h-11 items-center rounded-md px-2.5 text-[10px] font-bold tracking-wider uppercase transition-all"
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
