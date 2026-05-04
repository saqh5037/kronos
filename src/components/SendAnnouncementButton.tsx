"use client";

import { useTransition } from "react";
import {
  sendAnnouncement,
  deleteAnnouncement,
} from "@/server/actions/announcements";

export function SendButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          try {
            await sendAnnouncement(id);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Error");
          }
        })
      }
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--recovery)" }}
    >
      {isPending ? "Enviando…" : "Enviar ahora"}
    </button>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("¿Borrar este anuncio?")) return;
        startTransition(async () => {
          await deleteAnnouncement(id);
        });
      }}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--text-3)" }}
    >
      {isPending ? "…" : "Borrar"}
    </button>
  );
}
