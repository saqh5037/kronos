"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClass } from "@/server/actions/classes";
import { kToast } from "@/lib/toast";
import { KModal } from "@/components/kronos/KModal";

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };

export default function ClassForm({
  coaches,
  wods,
  defaultDate,
}: {
  coaches: Coach[];
  wods: WOD[];
  defaultDate?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate ?? today);
  const [time, setTime] = useState("07:00");
  const [durationMin, setDurationMin] = useState("60");
  const [capacity, setCapacity] = useState("16");
  const [coachId, setCoachId] = useState("");
  const [wodId, setWodId] = useState("");
  const [recFreq, setRecFreq] = useState("NONE");
  const [recCount, setRecCount] = useState("8");

  function reset() {
    setDate(defaultDate ?? today);
    setTime("07:00");
    setDurationMin("60");
    setCapacity("16");
    setCoachId("");
    setWodId("");
    setRecFreq("NONE");
    setRecCount("8");
    setError(null);
  }

  function close() {
    if (pending) return;
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const startsAt = new Date(`${date}T${time}`);
    if (Number.isNaN(startsAt.getTime())) {
      setError("Fecha u hora inválida");
      return;
    }

    const data = {
      startsAt: startsAt.toISOString(),
      durationMin,
      capacity,
      coachId,
      wodId,
      recurrence:
        recFreq && recFreq !== "NONE"
          ? { freq: recFreq, count: recCount || 8 }
          : { freq: "NONE" },
    };

    startTransition(async () => {
      try {
        await createClass(data);
        kToast.success("Clase creada");
        reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear clase");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="k-btn-grad px-4 py-2 rounded-xl text-sm"
      >
        + Nueva clase
      </button>

      <KModal
        open={open}
        onClose={close}
        title="Nueva clase"
        description="Programá una clase puntual o recurrente."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldInput
              label="Fecha"
              required
              type="date"
              value={date}
              onChange={setDate}
            />
            <FieldInput
              label="Hora"
              required
              type="time"
              value={time}
              onChange={setTime}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Duración (min)"
              required
              type="number"
              value={durationMin}
              onChange={setDurationMin}
              min={15}
              max={240}
            />
            <FieldInput
              label="Capacidad"
              required
              type="number"
              value={capacity}
              onChange={setCapacity}
              min={1}
              max={50}
            />
          </div>

          <FieldSelect
            label="Coach"
            value={coachId}
            onChange={setCoachId}
            options={[
              { value: "", label: "— Sin asignar —" },
              ...coaches.map((c) => ({
                value: c.id,
                label: c.name ?? c.email,
              })),
            ]}
          />

          <FieldSelect
            label="WOD"
            value={wodId}
            onChange={setWodId}
            options={[
              { value: "", label: "— Por definir —" },
              ...wods.map((w) => ({
                value: w.id,
                label: `${w.name} · ${w.type}`,
              })),
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FieldSelect
              label="Recurrencia"
              value={recFreq}
              onChange={setRecFreq}
              options={[
                { value: "NONE", label: "Una sola vez" },
                { value: "DAILY", label: "Diaria" },
                { value: "WEEKLY", label: "Semanal" },
              ]}
            />
            {recFreq !== "NONE" ? (
              <FieldInput
                label="Repeticiones"
                type="number"
                value={recCount}
                onChange={setRecCount}
                min={1}
                max={52}
              />
            ) : (
              <div className="hidden sm:block" aria-hidden="true" />
            )}
          </div>

          {error ? (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                color: "var(--k-danger)",
                background: "rgba(255,90,90,0.08)",
                border: "1px solid rgba(255,90,90,0.25)",
              }}
            >
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="px-4 py-2.5 rounded-full font-bold text-sm border disabled:opacity-50"
              style={{
                borderColor: "var(--k-line-2)",
                color: "var(--k-t2)",
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="k-btn-grad px-5 py-2.5 rounded-full font-bold text-sm disabled:opacity-50"
            >
              {pending ? "Creando…" : "Crear clase"}
            </button>
          </div>
        </form>
      </KModal>
    </>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  required,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
        {required ? <span style={{ color: "var(--k-accent)" }}> *</span> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
        inputMode={type === "number" ? "numeric" : undefined}
        className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-elevated)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      />
    </label>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="text-xs font-mono uppercase tracking-wider"
        style={{ color: "var(--k-t3)" }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
        style={{
          background: "var(--k-elevated)",
          borderColor: "var(--k-line-2)",
          color: "var(--k-t1)",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
