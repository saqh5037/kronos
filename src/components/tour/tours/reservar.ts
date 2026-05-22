import type { TourDefinition } from "../types";

export const reservarTour: TourDefinition = {
  id: "reservar_v1",
  storageKey: "kronos_tour_reservar_v1",
  steps: [
    {
      anchor: "reservar.week-strip",
      title: "Tu semana",
      body: "Desliza horizontal para cambiar de día. El punto lima indica que ya tienes reserva.",
      placement: "bottom",
    },
    {
      anchor: "reservar.time-filter",
      title: "Filtra por franja",
      body: "Acota el listado por mañana, mediodía o tarde según cuándo te queda mejor entrenar.",
      placement: "bottom",
    },
    {
      anchor: "reservar.class-card",
      title: "Cada clase",
      body: "Aquí ves coach, capacidad y waitlist en tiempo real. La barra lima indica qué tan llena está.",
      placement: "auto",
    },
    {
      anchor: "reservar.book-button",
      title: "Reserva en un toque",
      body: "Toca para apartar tu lugar. Si la clase está llena, entras a waitlist automáticamente.",
      placement: "top",
    },
  ],
};
