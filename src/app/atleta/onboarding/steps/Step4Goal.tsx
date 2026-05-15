"use client";

import { RadioCard } from "@/components/kronos/forms";
import type { FitnessGoal } from "@prisma/client";

type Step4GoalProps = {
  goal: FitnessGoal | null;
  onGoalChange: (goal: FitnessGoal) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step4Goal({
  goal,
  onGoalChange,
  onPrev,
  onNext,
  pending,
}: Step4GoalProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          ¿Cuál es tu objetivo?
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Personalizamos el plan para tu meta principal.
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          selected={goal === "GROW_TONE"}
          onChange={(selected) => selected && onGoalChange("GROW_TONE")}
          label="Ganar masa / Tonificar"
          description="Cambios en mi cuerpo"
        />
        <RadioCard
          selected={goal === "GENERAL_FITNESS"}
          onChange={(selected) => selected && onGoalChange("GENERAL_FITNESS")}
          label="Estar en forma general"
          description="Salud y bienestar"
        />
        <RadioCard
          selected={goal === "CONDITIONING"}
          onChange={(selected) => selected && onGoalChange("CONDITIONING")}
          label="Mejor condición física"
          description="Resistencia y energía"
        />
        <RadioCard
          selected={goal === "CROSSFIT_PRS"}
          onChange={(selected) => selected && onGoalChange("CROSSFIT_PRS")}
          label="Mejorar mis WODs y PRs"
          description="Dominance en CrossFit"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!goal || pending}
          className="k-btn-grad w-full py-3 rounded-xl font-bold text-sm disabled:opacity-50"
        >
          Siguiente
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={pending}
          className="text-xs underline disabled:opacity-50"
          style={{ color: "var(--k-t3)" }}
        >
          ← Atrás
        </button>
      </div>
    </div>
  );
}
