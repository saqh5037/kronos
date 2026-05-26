"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClass, updateClass } from "@/server/actions/classes";
import { kToast } from "@/lib/toast";
import { KModal } from "@/components/kronos/KModal";
import type { ClassRow } from "@/server/actions/classes";

type Coach = { id: string; name: string | null; email: string };
type WOD = { id: string; name: string; type: string };

type BaseProps = {
  coaches: Coach[];
  wods: WOD[];
};

type CreateProps = BaseProps & {
  mode?: "create";
  defaultDate?: string;
  initialClass?: never;
};

type EditProps = BaseProps & {
  mode: "edit";
  initialClass: ClassRow;
  defaultDate?: never;
  /** Called after a successful update so the parent can close/refresh */
  onUpdated?: () => void;
  /** Whether to render the trigger button or be driven externally via open prop */
  open?: boolean;
  onClose?: () => void;
};

type Props = CreateProps | EditProps;

export default function ClassForm(props: Props) {
  const { coaches, wods } = props;
  const isEdit = props.mode === "edit";
  const router = useRouter();

  // For edit mode, the modal may be controlled externally (ClassCard handles open state)
  // For create mode, this component owns the open state
  const [internalOpen, setInternalOpen] = useState(false);
  const open =
    isEdit && "open" in props && props.open !== undefined
      ? props.open
      : internalOpen;

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Derive initial values from initialClass or defaults
  function getInitialDate(): string {
    if (isEdit && props.initialClass) {
      return props.initialClass.startsAt.toISOString().slice(0, 10);
    }
    return (
      (props as CreateProps).defaultDate ??
      new Date().toISOString().slice(0, 10)
    );
  }

  function getInitialTime(): string {
    if (isEdit && props.initialClass) {
      const d = props.initialClass.startsAt;
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return "07:00";
  }

  const [date, setDate] = useState(getInitialDate);
  const [time, setTime] = useState(getInitialTime);
  const [durationMin, setDurationMin] = useState(
    isEdit && props.initialClass
      ? String(props.initialClass.durationMin)
      : "60",
  );
  const [capacity, setCapacity] = useState(
    isEdit && props.initialClass ? String(props.initialClass.capacity) : "16",
  );
  const [coachId, setCoachId] = useState(
    isEdit && props.initialClass ? (props.initialClass.coach?.id ?? "") : "",
  );
  const [wodId, setWodId] = useState(
    isEdit && props.initialClass ? (props.initialClass.wod?.id ?? "") : "",
  );
  // Recurrence only in create mode
  const [recFreq, setRecFreq] = useState("NONE");
  const [recCount, setRecCount] = useState("8");

  function reset() {
    if (isEdit && props.initialClass) {
      setDate(props.initialClass.startsAt.toISOString().slice(0, 10));
      const d = props.initialClass.startsAt;
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
      );
      setDurationMin(String(props.initialClass.durationMin));
      setCapacity(String(props.initialClass.capacity));
      setCoachId(props.initialClass.coach?.id ?? "");
      setWodId(props.initialClass.wod?.id ?? "");
    } else {
      const defaultDate = (props as CreateProps).defaultDate;
      setDate(defaultDate ?? new Date().toISOString().slice(0, 10));
      setTime("07:00");
      setDurationMin("60");
      setCapacity("16");
      setCoachId("");
      setWodId("");
      setRecFreq("NONE");
      setRecCount("8");
    }
    setError(null);
  }

  function close() {
    if (pending) return;
    if (isEdit && props.onClose) {
      props.onClose();
    } else {
      setInternalOpen(false);
    }
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
        !isEdit && recFreq && recFreq !== "NONE"
          ? { freq: recFreq, count: recCount || 8 }
          : { freq: "NONE" },
    };

    startTransition(async () => {
      try {
        if (isEdit && props.initialClass) {
          await updateClass(props.initialClass.id, data);
          kToast.success("Clase actualizada");
          props.onUpdated?.();
          close();
          router.refresh();
        } else {
          await createClass(data);
          kToast.success("Clase creada");
          reset();
          setInternalOpen(false);
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isEdit
              ? "Error al actualizar clase"
              : "Error al crear clase",
        );
      }
    });
  }

  const modalTitle = isEdit ? "Editar clase" : "Nueva clase";
  const modalDescription = isEdit
    ? "Modifica los datos de esta clase. Solo afecta esta instancia."
    : "Programa una clase puntual o recurrente.";
  const submitLabel = isEdit
    ? pending
      ? "Guardando…"
      : "Guardar cambios"
    : pending
      ? "Creando…"
      : "Crear clase";

  return (
    <>
      {!isEdit && (
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          className="k-btn-grad px-4 py-2 rounded-xl text-sm"
        >
          + Nueva clase
        </button>
      )}

      <KModal
        open={open}
        onClose={close}
        title={modalTitle}
        description={modalDescription}
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

          {!isEdit && (
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
          )}

          {isEdit && (
            <p
              className="text-xs px-3 py-2 rounded-lg"
              style={{
                color: "var(--k-t3)",
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line)",
              }}
            >
              Solo se edita esta clase. Las demás instancias de la recurrencia
              no se ven afectadas.
            </p>
          )}

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
              {submitLabel}
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
