"use client";

import { useTransition } from "react";
import { cancelClass } from "@/server/actions/classes";
import { kToast } from "@/lib/toast";

export default function CancelClassButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (
      !confirm(
        "¿Cancelar esta clase? Los atletas reservados serán notificados.",
      )
    )
      return;
    startTransition(async () => {
      try {
        await cancelClass(id);
        kToast.info("Clase cancelada — atletas notificados");
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md disabled:opacity-50"
      style={{ color: "var(--pr)" }}
      title="Cancelar clase"
    >
      {isPending ? "…" : "Cancelar"}
    </button>
  );
}
