import type { TourDefinition } from "../types";

export const saludTour: TourDefinition = {
  id: "salud_v1",
  storageKey: "kronos_tour_salud_v1",
  steps: [
    {
      anchor: "salud.hero",
      title: "Tu cuerpo en el tiempo",
      body: "Peso actual, delta de cambio, IMC y % grasa. Lo esencial de tu composición a primera vista.",
      placement: "bottom",
    },
    {
      anchor: "salud.chart",
      title: "Tendencia",
      body: "Tu peso en el tiempo. Si tienes una meta activa, verás la línea objetivo para guiarte.",
      placement: "auto",
    },
    {
      anchor: "salud.goal",
      title: "Tu meta",
      body: "Define un objetivo de peso o composición. Kronos te ayuda a llegar con seguimiento concreto.",
      placement: "top",
    },
    {
      anchor: "salud.register",
      title: "Registra una medición",
      body: "Cuanto más constante midas, mejor verás tu evolución. Toca aquí para sumar una entrada.",
      placement: "bottom",
    },
  ],
};
