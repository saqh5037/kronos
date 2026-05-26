"use client";

import { useTransition } from "react";
import {
  archivePlan,
  reactivatePlan,
  type PlanRow,
} from "@/server/actions/plans";
import { kToast } from "@/lib/toast";
import { useConfirm } from "@/lib/use-confirm";

export function PlanCard({ p }: { p: PlanRow }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleArchive() {
    const ok = await confirm({
      title: "¿Archivar este plan?",
      message: `El plan "${p.name}" dejará de estar disponible para nuevas asignaciones. Las membresías existentes no se ven afectadas.`,
      confirmLabel: "Archivar",
      tone: "danger",
    });
    if (!ok) return;
    startTransition(async () => {
      try {
        await archivePlan(p.id);
        kToast.info(`Plan "${p.name}" archivado`);
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al archivar");
      }
    });
  }

  function handleReactivate() {
    startTransition(async () => {
      try {
        await reactivatePlan(p.id);
        kToast.success(`Plan "${p.name}" reactivado`);
      } catch (err) {
        kToast.error(err instanceof Error ? err.message : "Error al reactivar");
      }
    });
  }

  return (
    <div className="k-card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-bold">{p.name}</h3>
        <div className="flex items-center gap-2">
          <span className="k-chip k-chip-strain text-[10px]">{p.type}</span>
          {!p.isActive && (
            <span className="k-chip k-chip-ghost text-[10px]">Archivado</span>
          )}
        </div>
      </div>
      <p
        className="font-display mt-3 text-3xl font-bold"
        style={{
          background: "var(--k-accent)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        ${p.price.toLocaleString("es-MX")}
        <span
          className="ml-1 font-mono text-xs font-normal"
          style={{ color: "var(--k-t3)" }}
        >
          {p.currency}
        </span>
      </p>
      <div
        className="mt-2 flex items-center gap-3 text-xs"
        style={{ color: "var(--k-t3)" }}
      >
        {p.classesPerMonth && <span>{p.classesPerMonth} clases/mes</span>}
        {p.durationDays && <span>{p.durationDays} días</span>}
      </div>
      <div
        className="mt-3 flex items-center justify-between border-t pt-3 text-xs"
        style={{ borderColor: "var(--k-line)", color: "var(--k-t2)" }}
      >
        <span>
          {p.activeMembershipCount} membership
          {p.activeMembershipCount === 1 ? "" : "s"} activa
          {p.activeMembershipCount === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-1">
          {p.isActive ? (
            <button
              onClick={handleArchive}
              disabled={isPending}
              className="text-xs px-2 py-1 rounded-md disabled:opacity-50 transition-colors"
              style={{ color: "var(--k-danger)" }}
              title="Archivar plan"
            >
              {isPending ? "…" : "Archivar"}
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              disabled={isPending}
              className="text-xs px-2 py-1 rounded-md disabled:opacity-50 transition-colors"
              style={{ color: "var(--k-accent)" }}
              title="Reactivar plan"
            >
              {isPending ? "…" : "Reactivar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
