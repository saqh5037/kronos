"use client";

import { useTransition } from "react";
import { cancelClass } from "@/server/actions/classes";
import { kToast } from "@/lib/toast";
import { useConfirm } from "@/lib/use-confirm";

export default function CancelClassButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleClick() {
    const ok = await confirm({
      title: "¿Cancelar esta clase?",
      message:
        "Los atletas reservados serán notificados y se liberarán todos los lugares.",
      confirmLabel: "Cancelar clase",
      tone: "danger",
    });
    if (!ok) return;
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
      style={{ color: "var(--k-danger)" }}
      title="Cancelar clase"
    >
      {isPending ? "…" : "Cancelar"}
    </button>
  );
}
