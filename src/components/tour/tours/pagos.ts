import type { TourDefinition } from "../types";

export const pagosTour: TourDefinition = {
  id: "pagos_v1",
  storageKey: "kronos_tour_pagos_v1",
  steps: [
    {
      anchor: "pagos.header",
      title: "Mis membresías",
      body: "Todas tus membresías activas, pausadas o pendientes. Cuotas, vencimientos y comprobantes en un solo lugar.",
      placement: "bottom",
    },
    {
      anchor: "pagos.membresia-card",
      title: "Cada membresía",
      body: "Plan, tipo, fechas y estado actual. El chip te dice si está activa, pausada o requiere pago.",
      placement: "auto",
    },
    {
      anchor: "pagos.cta-pagar",
      title: "Pagar pendiente",
      body: "Si hay cuota pendiente, paga directo desde aquí. Tu reserva queda lista en segundos.",
      placement: "top",
    },
    {
      anchor: "pagos.historial",
      title: "Historial",
      body: "Todos los comprobantes anteriores: fecha, monto, gateway y estado. Útil para tu contabilidad o resguardo personal.",
      placement: "top",
    },
  ],
};
