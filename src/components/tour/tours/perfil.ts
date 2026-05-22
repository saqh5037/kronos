import type { TourDefinition } from "../types";

export const perfilTour: TourDefinition = {
  id: "perfil_v1",
  storageKey: "kronos_tour_perfil_v1",
  steps: [
    {
      anchor: "perfil.hero",
      title: "Tu identidad atleta",
      body: "Avatar, nombre y estado. Toca el engrane arriba a la derecha para ajustes y privacidad.",
      placement: "bottom",
    },
    {
      anchor: "perfil.racha",
      title: "Racha activa",
      body: "Días consecutivos entrenando. Mantenerla es la forma más rápida de ver progreso real.",
      placement: "bottom",
    },
    {
      anchor: "perfil.stats",
      title: "Tus KPIs",
      body: "Asistencias semanales, PRs totales, racha y scores. Tu progreso resumido en cuatro números.",
      placement: "auto",
    },
    {
      anchor: "perfil.explorar",
      title: "Explorar el ecosistema",
      body: "Atajos al resto de la app: movimientos, ranking, historial, plan IA, pagos y ajustes.",
      placement: "top",
    },
  ],
};
