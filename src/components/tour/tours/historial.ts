import type { TourDefinition } from "../types";

export const historialTour: TourDefinition = {
  id: "historial_v1",
  storageKey: "kronos_tour_historial_v1",
  steps: [
    {
      anchor: "historial.header",
      title: "Tu historial",
      body: "Todos los scores que has registrado, en orden cronológico. Tu trayectoria completa en un solo lugar.",
      placement: "bottom",
    },
    {
      anchor: "historial.filtros",
      title: "Filtra el historial",
      body: "Acota por WOD específico o por escalado (RX, scaled, principiante). Útil para comparar marcas en el mismo entrenamiento.",
      placement: "bottom",
    },
    {
      anchor: "historial.lista",
      title: "Cada score",
      body: "Nombre del WOD, fecha, escalado y valor. Tocá para ver detalles o subir al perfil completo.",
      placement: "auto",
    },
    {
      anchor: "historial.paginacion",
      title: "Explora más",
      body: "Navega entre páginas para ver scores más antiguos. Cuanto más constante registres, más rica tu historia.",
      placement: "top",
    },
  ],
};
