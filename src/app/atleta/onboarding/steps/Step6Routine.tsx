"use client";

import { RadioCard } from "@/components/kronos/forms";
import type { RoutinePreference } from "@prisma/client";

type Step6RoutineProps = {
  preference: RoutinePreference | null;
  onPreferenceChange: (pref: RoutinePreference) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step6Routine({
  preference,
  onPreferenceChange,
  onPrev,
  onNext,
  pending,
}: Step6RoutineProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Tu rutina
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          ¿Cómo prefieres que elijamos tu plan?
        </p>
      </div>

      <div className="space-y-3">
        <RadioCard
          selected={preference === "AUTO"}
          onChange={(selected) => selected && onPreferenceChange("AUTO")}
          label="IA elige lo mejor para mí"
          description="Análisis inteligente de tu perfil"
        />
        <RadioCard
          selected={preference === "RECOVERY"}
          onChange={(selected) => selected && onPreferenceChange("RECOVERY")}
          label="Enfoque en recuperación"
          description="Entrenamientos menos intensos"
        />
        <RadioCard
          selected={preference === "LIBRARY"}
          onChange={(selected) => selected && onPreferenceChange("LIBRARY")}
          label="Elegir de biblioteca"
          description="Yo quiero explorar opciones"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!preference || pending}
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
