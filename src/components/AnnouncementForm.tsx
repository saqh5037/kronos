"use client";

import { useState, useTransition } from "react";
import {
  createAnnouncement,
  sendAnnouncement,
} from "@/server/actions/announcements";
import {
  announcementAudiences,
  announcementChannels,
} from "@/lib/validations/announcement";

export default function AnnouncementForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(action: "draft" | "send") {
    return (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setFeedback(null);
      const form = e.currentTarget;
      const fd = new FormData(form);
      const scheduledRaw = fd.get("scheduledAt") as string;
      const data = {
        title: fd.get("title"),
        body: fd.get("body"),
        audience: fd.get("audience"),
        channel: fd.get("channel"),
        scheduledAt: scheduledRaw || undefined,
      };
      startTransition(async () => {
        try {
          const result = await createAnnouncement(data);
          if (action === "send") {
            const sent = await sendAnnouncement(result.id);
            setFeedback(`Enviado a ${sent.recipientCount} destinatarios`);
          } else {
            setFeedback("Borrador guardado");
          }
          form.reset();
          setOpen(false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Error al crear");
        }
      });
    };
  }

  if (!open) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={() => setOpen(true)}
          className="k-btn-grad px-4 py-2 rounded-xl text-sm"
        >
          + Nuevo anuncio
        </button>
        {feedback && (
          <p className="text-xs" style={{ color: "var(--k-accent)" }}>
            {feedback}
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={submit("send")}
      className="k-card p-4 flex flex-col gap-3 w-full max-w-xl"
    >
      <p className="k-eyebrow">Nuevo anuncio</p>
      <input
        name="title"
        placeholder="Título"
        required
        maxLength={120}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent"
        style={{ borderColor: "var(--line)" }}
      />
      <textarea
        name="body"
        placeholder="Mensaje (multiline OK)"
        required
        rows={6}
        maxLength={5000}
        className="px-3 py-2 rounded-lg text-sm border bg-transparent resize-none"
        style={{ borderColor: "var(--line)" }}
      />
      <div className="grid grid-cols-3 gap-2">
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Audiencia</span>
          <select
            name="audience"
            defaultValue="ALL"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {announcementAudiences.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Canal</span>
          <select
            name="channel"
            defaultValue="IN_APP"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {announcementChannels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span style={{ color: "var(--k-t2)" }}>Programar (opcional)</span>
          <input
            name="scheduledAt"
            type="datetime-local"
            className="px-3 py-2 rounded-lg text-sm border bg-transparent"
            style={{ borderColor: "var(--line)" }}
          />
        </label>
      </div>
      {error && (
        <p className="text-xs" style={{ color: "var(--k-danger)" }}>
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="k-btn-grad flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {isPending ? "Enviando…" : "Crear y enviar"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            const form = e.currentTarget.form;
            if (form)
              submit("draft")({
                preventDefault: () => {},
                currentTarget: form,
              } as React.FormEvent<HTMLFormElement>);
          }}
          disabled={isPending}
          className="k-btn-ghost flex-1 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          Guardar borrador
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="k-btn-ghost px-3 py-2 rounded-lg text-sm"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
