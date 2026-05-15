"use client";

import { RadioCard } from "@/components/kronos/forms";
import type { FitnessExperience } from "@prisma/client";

type Step3ExperienceProps = {
  experience: FitnessExperience | null;
  onExperienceChange: (experience: FitnessExperience) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step3Experience({
  experience,
  onExperienceChange,
  onPrev,
  onNext,
  pending,
}: Step3ExperienceProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Tu experiencia
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          ¿Cuánto llevas entrenando?
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          selected={experience === "NONE"}
          onChange={(selected) => selected && onExperienceChange("NONE")}
          label="Sin experiencia"
          description="Es mi primer año"
        />
        <RadioCard
          selected={experience === "BEGINNER"}
          onChange={(selected) => selected && onExperienceChange("BEGINNER")}
          label="Principiante"
          description="1-2 años de entrenamiento"
        />
        <RadioCard
          selected={experience === "INTERMEDIATE"}
          onChange={(selected) =>
            selected && onExperienceChange("INTERMEDIATE")
          }
          label="Intermedio"
          description="2-5 años de entrenamiento"
        />
        <RadioCard
          selected={experience === "ADVANCED"}
          onChange={(selected) => selected && onExperienceChange("ADVANCED")}
          label="Avanzado"
          description="Más de 5 años"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!experience || pending}
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
