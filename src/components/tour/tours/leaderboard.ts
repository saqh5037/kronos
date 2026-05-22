import type { TourDefinition } from "../types";

export const leaderboardTour: TourDefinition = {
  id: "leaderboard_v1",
  storageKey: "kronos_tour_leaderboard_v1",
  steps: [
    {
      anchor: "leaderboard.header",
      title: "Tabla de rankings",
      body: "El top del box. Compárate con tus compañeros en WODs, movimientos y asistencia.",
      placement: "bottom",
    },
    {
      anchor: "leaderboard.tabs",
      title: "Tres formas de competir",
      body: "WOD, Movimiento o Asistencia. Cada tab tiene su propia tabla. Elige según lo que quieras medir.",
      placement: "bottom",
    },
    {
      anchor: "leaderboard.filters",
      title: "Elige el WOD",
      body: "Selecciona un WOD o movimiento específico para ver el ranking detallado.",
      placement: "auto",
    },
    {
      anchor: "leaderboard.ranking",
      title: "Tu posición",
      body: "Aquí ves el orden completo. Búscate, márcate la meta y subí lugares entrenamiento tras entrenamiento.",
      placement: "top",
    },
  ],
};
