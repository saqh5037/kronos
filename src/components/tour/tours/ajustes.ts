import type { TourDefinition } from "../types";

export const ajustesTour: TourDefinition = {
  id: "ajustes_v1",
  storageKey: "kronos_tour_ajustes_v1",
  steps: [
    {
      anchor: "ajustes.header",
      title: "Tus ajustes",
      body: "Cuenta, privacidad, preferencias y sesión. Configura cómo se comporta Kronos contigo.",
      placement: "bottom",
    },
    {
      anchor: "ajustes.user-card",
      title: "Tu cuenta",
      body: "Avatar, nombre y email registrados. Si necesitas cambiar algo crítico, pídele al coach del box.",
      placement: "auto",
    },
    {
      anchor: "ajustes.preferencias",
      title: "Preferencias",
      body: "Ajusta el tema visual. Más opciones llegarán pronto: idioma, notificaciones, unidades.",
      placement: "auto",
    },
    {
      anchor: "ajustes.sesion",
      title: "Cerrar sesión",
      body: "Cierra de forma segura. Si compartes el dispositivo, hazlo siempre antes de salir.",
      placement: "top",
    },
  ],
};
