"use client";

const MUSCLES = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
  "Antebrazos",
  "Abdominales",
  "Core",
  "Cuádriceps",
  "Isquiotibiales",
  "Glúteos",
  "Pantorrillas",
  "Caderas",
  "Muñecas",
  "Codos",
  "Rodillas",
];

type Step7ExcludedMusclesProps = {
  excluded: string[];
  onExcludedChange: (excluded: string[]) => void;
  onPrev: () => void;
  onNext: () => void;
  pending: boolean;
};

export function Step7ExcludedMuscles({
  excluded,
  onExcludedChange,
  onPrev,
  onNext,
  pending,
}: Step7ExcludedMusclesProps) {
  const toggleMuscle = (muscle: string) => {
    if (excluded.includes(muscle)) {
      onExcludedChange(excluded.filter((m) => m !== muscle));
    } else if (excluded.length < 4) {
      onExcludedChange([...excluded, muscle]);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-[-0.01em]">
          Áreas a evitar
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--k-t2)" }}>
          Selecciona hasta 4 músculos a evitar por lesión o preferencia.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MUSCLES.map((muscle) => {
          const isSelected = excluded.includes(muscle);
          const isDisabled = excluded.length >= 4 && !isSelected && pending;

          return (
            <button
              key={muscle}
              type="button"
              onClick={() => toggleMuscle(muscle)}
              disabled={isDisabled}
              className="px-3 py-2 rounded-lg border text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                background: isSelected ? "var(--k-accent)" : "transparent",
                borderColor: isSelected ? "var(--k-accent)" : "var(--k-line-2)",
                color: isSelected ? "var(--k-accent-on)" : "var(--k-t1)",
              }}
            >
              {muscle}
            </button>
          );
        })}
      </div>

      {excluded.length > 0 && (
        <div
          className="px-3 py-2 rounded-lg text-xs"
          style={{
            background: "var(--k-accent-soft)",
            borderLeft: "3px solid var(--k-accent)",
            color: "var(--k-t1)",
          }}
        >
          {excluded.length} de 4 excluidos: {excluded.join(", ")}
        </div>
      )}

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={pending}
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
