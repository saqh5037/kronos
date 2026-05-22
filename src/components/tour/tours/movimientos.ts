import type { TourDefinition } from "../types";

export const movimientosTour: TourDefinition = {
  id: "movimientos_v1",
  storageKey: "kronos_tour_movimientos_v1",
  steps: [
    {
      anchor: "movimientos.header",
      title: "Biblioteca técnica",
      body: "Todos los movimientos que has entrenado y los disponibles. Acá vives tu tecnique.",
      placement: "bottom",
    },
    {
      anchor: "movimientos.lista-personal",
      title: "Lo que has trabajado",
      body: 'Tus movimientos por frecuencia. El badge "SIN ENTRENAR" te avisa qué retomar para no perder.',
      placement: "auto",
    },
    {
      anchor: "movimientos.catalogo",
      title: "Catálogo completo",
      body: "Biblioteca completa del box: fuerza, gimnasia, olímpico, cardio, accesorio. Filtra por categoría o busca por nombre.",
      placement: "auto",
    },
    {
      anchor: "movimientos.card-movimiento",
      title: "Detalle del movimiento",
      body: "Toca una card para abrir el detalle: técnica, escalas, videos y cómo progresar.",
      placement: "top",
    },
  ],
};
