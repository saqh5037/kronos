import type { TourDefinition } from "../types";

export const wodTour: TourDefinition = {
  id: "wod_v1",
  storageKey: "kronos_tour_wod_v1",
  steps: [
    {
      anchor: "wod.hero",
      title: "El WOD de hoy",
      body: "Tipo, nombre y los datos clave: dificultad, time cap y cómo se mide el score.",
      placement: "bottom",
    },
    {
      anchor: "wod.movements",
      title: "Movimientos",
      body: "El detalle del entrenamiento: reps por movimiento. Toca un movimiento para ver técnica, escalas y videos.",
      placement: "auto",
    },
    {
      anchor: "wod.score-form",
      title: "Registra tu score",
      body: "Al terminar, captura tu resultado. Kronos detecta si fue PR automáticamente y lo suma al ranking.",
      placement: "top",
    },
    {
      anchor: "wod.leaderboard",
      title: "Ver ranking",
      body: "Compárate con el resto del box en este mismo WOD. Competencia sana, motivación garantizada.",
      placement: "top",
    },
  ],
};
