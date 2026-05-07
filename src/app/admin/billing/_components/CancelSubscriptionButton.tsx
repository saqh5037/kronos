"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/lib/use-confirm";
import { kToast } from "@/lib/toast";
import { cancelSaasSubscription } from "@/server/actions/saas-billing";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const confirm = useConfirm();
  const [pending, setPending] = useState(false);

  const handleCancel = async () => {
    const ok = await confirm({
      title: "¿Cancelar suscripción?",
      message:
        "Tu Box quedará en modo lectura al final del período actual. Podés reactivar cuando quieras y los datos se mantienen.",
      confirmLabel: "Sí, cancelar",
      cancelLabel: "Volver",
      tone: "danger",
    });
    if (!ok) return;

    setPending(true);
    try {
      const res = await cancelSaasSubscription();
      if (!res.ok) {
        kToast.error(res.message);
        return;
      }
      kToast.success("Suscripción cancelada");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={pending}
      className="inline-block k-btn-ghost px-5 py-2.5 rounded-full font-bold text-sm text-[var(--pr)] hover:bg-[var(--pr)]/10 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Cancelando…" : "Cancelar suscripción"}
    </button>
  );
}
