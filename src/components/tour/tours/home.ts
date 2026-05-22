import type { TourDefinition } from "../types";

export const homeTour: TourDefinition = {
  id: "home_v1",
  storageKey: "kronos_tour_home_v1",
  steps: [
    {
      anchor: "home.hero",
      title: "Bienvenido a Kronos",
      body: "Tu inicio de cada día. Mira tu racha, próxima clase y atajos al WOD y reserva.",
      placement: "bottom",
    },
    {
      anchor: "home.stats",
      title: "Tus números rápidos",
      body: "Racha activa + KPIs de la semana: asistencias, PRs y progreso. Lo importante a primera vista.",
      placement: "bottom",
    },
    {
      anchor: "home.next-booking",
      title: "Tu próxima clase",
      body: "Día, hora y coach de tu siguiente reserva. Si no tienes ninguna, te sugerimos una.",
      placement: "auto",
    },
    {
      anchor: "home.week-strip",
      title: "Tu semana",
      body: "L–D con tus clases reservadas. Mantén la consistencia — la racha cuenta.",
      placement: "top",
    },
  ],
};
