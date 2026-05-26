"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWOD, updateWOD } from "@/server/actions/wods";
import { wodTypes, scoreTypes } from "@/lib/validations/wod";
import { kToast } from "@/lib/toast";
import { KModal } from "@/components/kronos/KModal";
import type { WODSummary } from "@/server/actions/wods";

type Movement = {
  id: string;
  name: string;
  equipment: string[];
};

type LineItem = {
  movementId: string;
  reps: string;
  weight: string;
  notes: string;
};

const emptyLine: LineItem = {
  movementId: "",
  reps: "",
  weight: "",
  notes: "",
};

// ─── Prop shapes ──────────────────────────────────────────────────────────────

type BaseProps = {
  movements: Movement[];
};

type CreateProps = BaseProps & {
  mode?: "create";
  initialWOD?: never;
  onUpdated?: never;
  open?: never;
  onClose?: never;
};

type EditProps = BaseProps & {
  mode: "edit";
  initialWOD: WODSummary & {
    existingMovements?: {
      movementId: string;
      reps: number | null;
      weight: number | null;
      notes: string | null;
      order: number;
    }[];
  };
  onUpdated?: () => void;
  open?: boolean;
  onClose?: () => void;
};

type Props = CreateProps | EditProps;

// ─── Form component ───────────────────────────────────────────────────────────

export default function WODForm(props: Props) {
  const { movements } = props;
  const isEdit = props.mode === "edit";
  const router = useRouter();

  const [internalOpen, setInternalOpen] = useState(false);
  const open =
    isEdit && "open" in props && props.open !== undefined
      ? props.open
      : internalOpen;

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function getInitialLines(): LineItem[] {
    if (isEdit && props.initialWOD.existingMovements?.length) {
      return [...props.initialWOD.existingMovements]
        .sort((a, b) => a.order - b.order)
        .map((m) => ({
          movementId: m.movementId,
          reps: m.reps != null ? String(m.reps) : "",
          weight: m.weight != null ? String(m.weight) : "",
          notes: m.notes ?? "",
        }));
    }
    return [{ ...emptyLine }];
  }

  const [lines, setLines] = useState<LineItem[]>(getInitialLines);
  const [name, setName] = useState(isEdit ? props.initialWOD.name : "");
  const [type, setType] = useState(
    isEdit ? props.initialWOD.type : ("FORTIME" as string),
  );
  const [scoreType, setScoreType] = useState(
    isEdit ? props.initialWOD.scoreType : ("TIME" as string),
  );
  const [timeCap, setTimeCap] = useState(
    isEdit && props.initialWOD.timeCap ? String(props.initialWOD.timeCap) : "",
  );
  const [description, setDescription] = useState(
    isEdit ? (props.initialWOD.description ?? "") : "",
  );

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { ...emptyLine }]);
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  }

  function reset() {
    if (isEdit) {
      setLines(getInitialLines());
      setName(props.initialWOD.name);
      setType(props.initialWOD.type);
      setScoreType(props.initialWOD.scoreType);
      setTimeCap(
        props.initialWOD.timeCap ? String(props.initialWOD.timeCap) : "",
      );
      setDescription(props.initialWOD.description ?? "");
    } else {
      setLines([{ ...emptyLine }]);
      setName("");
      setType("FORTIME");
      setScoreType("TIME");
      setTimeCap("");
      setDescription("");
    }
    setError(null);
  }

  function close() {
    if (isPending) return;
    if (isEdit && props.onClose) {
      props.onClose();
    } else {
      setInternalOpen(false);
    }
    reset();
  }

  function buildPayload() {
    const movementsPayload = lines
      .filter((l) => l.movementId)
      .map((l, i) => ({
        movementId: l.movementId,
        reps: l.reps ? Number(l.reps) : undefined,
        weight: l.weight ? Number(l.weight) : undefined,
        notes: l.notes || undefined,
        order: i,
      }));

    return {
      name,
      type,
      scoreType,
      description: description || undefined,
      timeCap: timeCap || undefined,
      movements: movementsPayload,
    };
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const data = buildPayload();

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateWOD(props.initialWOD.id, data);
          kToast.success("WOD actualizado");
          props.onUpdated?.();
          close();
          router.refresh();
        } else {
          await createWOD(data);
          kToast.success("WOD creado");
          reset();
          setInternalOpen(false);
          router.refresh();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isEdit
              ? "Error al actualizar WOD"
              : "Error al crear WOD",
        );
      }
    });
  }

  const modalTitle = isEdit ? "Editar WOD" : "Nuevo WOD";
  const modalDescription = isEdit
    ? "Modifica nombre, tipo y movimientos de este WOD."
    : "Crea un nuevo WOD para tu biblioteca.";
  const submitLabel = isEdit
    ? isPending
      ? "Guardando…"
      : "Guardar cambios"
    : isPending
      ? "Creando…"
      : "Guardar WOD";

  return (
    <>
      {!isEdit && (
        <button
          type="button"
          onClick={() => setInternalOpen(true)}
          className="k-btn-grad px-4 py-2 rounded-xl text-sm"
        >
          + Nuevo WOD
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
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: "var(--k-t3)" }}
            >
              Nombre <span style={{ color: "var(--k-accent)" }}>*</span>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Fran"
              required
              maxLength={120}
              className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none transition-colors"
              style={{
                background: "var(--k-elevated)",
                borderColor: "var(--k-line-2)",
                color: "var(--k-t1)",
              }}
            />
          </label>

          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs">
              <span
                className="font-mono uppercase tracking-wider"
                style={{ color: "var(--k-t3)" }}
              >
                Tipo
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{
                  background: "var(--k-elevated)",
                  borderColor: "var(--k-line-2)",
                  color: "var(--k-t1)",
                }}
              >
                {wodTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span
                className="font-mono uppercase tracking-wider"
                style={{ color: "var(--k-t3)" }}
              >
                Score
              </span>
              <select
                value={scoreType}
                onChange={(e) => setScoreType(e.target.value)}
                className="px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{
                  background: "var(--k-elevated)",
                  borderColor: "var(--k-line-2)",
                  color: "var(--k-t1)",
                }}
              >
                {scoreTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span
                className="font-mono uppercase tracking-wider"
                style={{ color: "var(--k-t3)" }}
              >
                Time cap (min)
              </span>
              <input
                value={timeCap}
                onChange={(e) => setTimeCap(e.target.value)}
                type="number"
                inputMode="numeric"
                min={0}
                max={180}
                placeholder="0 = sin cap"
                className="px-3 py-2.5 rounded-xl text-sm border focus:outline-none"
                style={{
                  background: "var(--k-elevated)",
                  borderColor: "var(--k-line-2)",
                  color: "var(--k-t1)",
                }}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: "var(--k-t3)" }}
            >
              Descripción
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones del WOD (opcional)"
              rows={2}
              maxLength={2000}
              className="w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none resize-none"
              style={{
                background: "var(--k-elevated)",
                borderColor: "var(--k-line-2)",
                color: "var(--k-t1)",
              }}
            />
          </label>

          {/* Movements */}
          <div
            className="border-t pt-3 mt-1 flex flex-col gap-2"
            style={{ borderColor: "var(--k-line)" }}
          >
            <p className="k-eyebrow">Movimientos</p>

            {lines.map((line, idx) => (
              <div
                key={idx}
                className="grid grid-cols-12 gap-1 items-center"
                style={{ fontSize: "12px" }}
              >
                <select
                  value={line.movementId}
                  onChange={(e) =>
                    updateLine(idx, { movementId: e.target.value })
                  }
                  className="col-span-5 px-2 py-1.5 rounded-md border text-xs"
                  style={{
                    background: "var(--k-elevated)",
                    borderColor: "var(--k-line-2)",
                    color: "var(--k-t1)",
                  }}
                >
                  <option value="">— Movimiento —</option>
                  {movements.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <input
                  value={line.reps}
                  onChange={(e) => updateLine(idx, { reps: e.target.value })}
                  placeholder="Reps"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="col-span-2 px-2 py-1.5 rounded-md border text-xs"
                  style={{
                    background: "var(--k-elevated)",
                    borderColor: "var(--k-line-2)",
                    color: "var(--k-t1)",
                  }}
                />
                <input
                  value={line.weight}
                  onChange={(e) => updateLine(idx, { weight: e.target.value })}
                  placeholder="Peso"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={0.5}
                  className="col-span-2 px-2 py-1.5 rounded-md border text-xs"
                  style={{
                    background: "var(--k-elevated)",
                    borderColor: "var(--k-line-2)",
                    color: "var(--k-t1)",
                  }}
                />
                <input
                  value={line.notes}
                  onChange={(e) => updateLine(idx, { notes: e.target.value })}
                  placeholder="Notas"
                  className="col-span-2 px-2 py-1.5 rounded-md border text-xs"
                  style={{
                    background: "var(--k-elevated)",
                    borderColor: "var(--k-line-2)",
                    color: "var(--k-t1)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  disabled={lines.length === 1}
                  className="col-span-1 text-xs disabled:opacity-30"
                  style={{ color: "var(--k-danger)" }}
                  aria-label="Quitar movimiento"
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addLine}
              className="k-btn-ghost text-xs px-3 py-1.5 rounded-md self-start"
            >
              + Agregar movimiento
            </button>

            {movements.length === 0 && (
              <p className="text-xs" style={{ color: "var(--k-t3)" }}>
                No hay movimientos en la biblioteca. Crea uno primero.
              </p>
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
              disabled={isPending}
              className="px-4 py-2.5 rounded-full font-bold text-sm border disabled:opacity-50"
              style={{ borderColor: "var(--k-line-2)", color: "var(--k-t2)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
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
