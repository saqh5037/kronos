"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { useConfirm } from "@/lib/use-confirm";
import { formatSecondsToTime, parseTimeToSeconds } from "@/lib/event-score";
import { submitEventResult } from "@/server/actions/events";
import { dispatchToast } from "@/components/kronos/KronosToaster";

type Props = {
  entryId: string;
  eventSlug: string;
  divisions: string[];
  initialDivision: string | null;
  initialScoreSeconds: number | null;
  initialScoreText: string;
  initialNotes: string | null;
  alreadySubmitted: boolean;
};

export default function EventResultForm({
  entryId,
  eventSlug,
  divisions,
  initialDivision,
  initialScoreSeconds,
  initialScoreText,
  initialNotes,
  alreadySubmitted,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const defaultDivision = useMemo(() => {
    if (initialDivision && divisions.includes(initialDivision)) {
      return initialDivision;
    }
    return divisions[0] ?? "";
  }, [initialDivision, divisions]);

  const [division, setDivision] = useState(defaultDivision);
  const [timeInput, setTimeInput] = useState(
    initialScoreText && initialScoreText.length > 0
      ? initialScoreText
      : initialScoreSeconds !== null
        ? formatSecondsToTime(initialScoreSeconds)
        : "",
  );
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [pending, startTransition] = useTransition();

  const parsedSeconds = useMemo(
    () => parseTimeToSeconds(timeInput),
    [timeInput],
  );

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (parsedSeconds === null) {
      setError("Tiempo inválido. Usa formato mm:ss o h:mm:ss.");
      return;
    }
    if (!division) {
      setError("Elige una división.");
      return;
    }

    const file = fileRef.current?.files?.[0] ?? null;

    startTransition(async () => {
      if (alreadySubmitted) {
        const ok = await confirm({
          title: "Sobrescribir resultado",
          message:
            "Ya tienes un resultado registrado. ¿Reemplazarlo con el nuevo?",
          confirmLabel: "Sobrescribir",
          cancelLabel: "Cancelar",
          tone: "warning",
        });
        if (!ok) return;
      }

      const fd = new FormData();
      fd.append("entryId", entryId);
      fd.append("division", division);
      fd.append("scoreSeconds", String(parsedSeconds));
      fd.append("scoreText", formatSecondsToTime(parsedSeconds));
      if (notes.trim().length > 0) fd.append("notes", notes.trim());
      if (file) fd.append("media", file);

      try {
        await submitEventResult(fd);
        setSubmitted(true);
        if (fileRef.current) fileRef.current.value = "";
        dispatchToast({
          variant: "success",
          title: alreadySubmitted
            ? "Resultado actualizado"
            : "Resultado guardado",
          options: {
            description: "Tu tiempo quedó registrado correctamente.",
            duration: 4000,
          },
        });
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos guardar el resultado.",
        );
      }
    });
  }

  void eventSlug;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {divisions.length > 0 ? (
        <fieldset>
          <legend className="k-eyebrow mb-2" style={{ color: "var(--k-t2)" }}>
            División
          </legend>
          <div className="flex flex-wrap gap-2">
            {divisions.map((d) => {
              const active = d === division;
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDivision(d)}
                  className="px-3 py-2 rounded-lg border text-sm transition-colors"
                  style={{
                    borderColor: active ? "var(--k-accent)" : "var(--k-line)",
                    background: active ? "var(--k-accent-soft)" : "var(--k-bg)",
                    color: active ? "var(--k-t1)" : "var(--k-t2)",
                    fontWeight: active ? 600 : 500,
                  }}
                  aria-pressed={active}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div>
        <label
          htmlFor="event-time"
          className="k-eyebrow block mb-2"
          style={{ color: "var(--k-t2)" }}
        >
          Tiempo final · mm:ss o h:mm:ss
        </label>
        <input
          id="event-time"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="42:30"
          value={timeInput}
          onChange={(e) => setTimeInput(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border font-display text-lg"
          style={{
            background: "var(--k-bg)",
            borderColor: "var(--k-line)",
            color: "var(--k-t1)",
          }}
          required
        />
        {parsedSeconds !== null && timeInput.trim().length > 0 ? (
          <p className="text-xs mt-1" style={{ color: "var(--k-t3)" }}>
            = {formatSecondsToTime(parsedSeconds)} ({parsedSeconds} s)
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="event-notes"
          className="k-eyebrow block mb-2"
          style={{ color: "var(--k-t2)" }}
        >
          Notas (opcional)
        </label>
        <textarea
          id="event-notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Cómo estuvo, escalamientos, observaciones…"
          maxLength={1000}
          className="w-full px-4 py-3 rounded-lg border text-sm"
          style={{
            background: "var(--k-bg)",
            borderColor: "var(--k-line)",
            color: "var(--k-t1)",
          }}
        />
      </div>

      <div>
        <label
          htmlFor="event-media"
          className="k-eyebrow block mb-2"
          style={{ color: "var(--k-t2)" }}
        >
          Captura del whiteboard (opcional, máx 8 MB)
        </label>
        <input
          id="event-media"
          ref={fileRef}
          type="file"
          accept="image/*"
          className="text-sm"
          style={{ color: "var(--k-t2)" }}
        />
      </div>

      {error ? (
        <p
          className="text-sm"
          style={{ color: "var(--k-danger)" }}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="k-btn-grad w-full disabled:opacity-60"
      >
        {pending
          ? "Guardando…"
          : submitted
            ? "Actualizar resultado"
            : "Guardar resultado"}
      </button>
    </form>
  );
}
