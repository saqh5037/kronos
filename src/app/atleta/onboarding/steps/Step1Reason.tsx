"use client";

import { RadioCard } from "@/components/kronos/forms";
import type { FitnessReason } from "@prisma/client";

type Step1ReasonProps = {
  reason: FitnessReason | null;
  onReasonChange: (reason: FitnessReason) => void;
  onNext: () => void;
  pending: boolean;
};

export function Step1Reason({
  reason,
  onReasonChange,
  onNext,
  pending,
}: Step1ReasonProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          ¿Por qué empiezas ahora?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Esto nos ayuda a personalizar tu experiencia.
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          selected={reason === "BEGINNER_START"}
          onChange={(selected) => selected && onReasonChange("BEGINNER_START")}
          label="Soy principiante"
          description="Quiero empezar desde cero en fitness"
        />
        <RadioCard
          selected={reason === "IMPROVE_ROUTINE"}
          onChange={(selected) => selected && onReasonChange("IMPROVE_ROUTINE")}
          label="Mejorar mi rutina"
          description="Ya entreno, quiero evolucionar"
        />
        <RadioCard
          selected={reason === "BORED_CURRENT"}
          onChange={(selected) => selected && onReasonChange("BORED_CURRENT")}
          label="Estoy aburrido de lo actual"
          description="Necesito nuevos retos"
        />
        <RadioCard
          selected={reason === "OPTIMAL_PLAN"}
          onChange={(selected) => selected && onReasonChange("OPTIMAL_PLAN")}
          label="Plan óptimo personalizado"
          description="Quiero el máximo potencial"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!reason || pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
