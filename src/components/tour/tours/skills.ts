import type { TourDefinition } from "../types";

export const skillsTour: TourDefinition = {
  id: "skills_v1",
  storageKey: "kronos_tour_skills_v1",
  steps: [
    {
      anchor: "skills.hero",
      title: "Tu próxima victoria",
      body: "La skill que estás trabajando ahora con su progreso global. La meta visible en cada visita.",
      placement: "bottom",
    },
    {
      anchor: "skills.foco",
      title: "Foco de hoy",
      body: "La progresión específica de esta semana. Domínala antes de avanzar al siguiente nivel.",
      placement: "auto",
    },
    {
      anchor: "skills.progresiones",
      title: "Mapa de progresiones",
      body: "Cada paso del camino: lo que ya conquistaste, lo que estás trabajando, lo que viene.",
      placement: "top",
    },
    {
      anchor: "skills.ai-plan",
      title: "Plan de Kronos AI",
      body: "Predicciones de PR personalizadas con regresión + IA. Tu próxima marca, calculada.",
      placement: "top",
    },
  ],
};
