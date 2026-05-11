import { existsSync } from "fs";
import { join } from "path";

export type Audience = "AMBOS" | "BOX PERSONAL" | "ATLETA DE BOX";

export type Screen = {
  id: string;
  label: string;
  title: string;
  lead: string;
  audience: Audience;
  imageSrc: string;
  imageAlt: string;
  actions: string[];
  deepLink: string | null;
};

export const SCREENS: Screen[] = [
  {
    id: "onboarding",
    label: "Onboarding",
    title: "Onboarding · cuatro inputs y listo.",
    lead: "Antes de tu primer WOD: nombre, foto, nivel y unidad de peso. Sin wizard infinito, sin tutorial in-app de 12 pantallas. Cuatro inputs y entras.",
    audience: "BOX PERSONAL",
    imageSrc: "/manual/atleta/onboarding.png",
    imageAlt:
      "Pantalla de onboarding con 4 pasos: nombre, foto, nivel y unidad de peso",
    actions: [
      "Cargar nombre y apellido",
      "Foto de perfil (opcional)",
      "Elegir nivel inicial: principiante · escalado · RX",
      "Unidad de peso preferida (kg / lb)",
    ],
    deepLink: null,
  },
  {
    id: "inicio",
    label: "Inicio",
    title: "Inicio · tu próxima victoria.",
    lead: "El home no es un dashboard. Es la pantalla que abres antes de entrar al box: próxima clase, racha, último PR. Lo que importa hoy, sin notificaciones de relleno.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/home.png",
    imageAlt:
      "Pantalla de inicio con racha de 23 días, próxima clase y leaderboard del WOD",
    actions: [
      "Ver tu próxima clase reservada y cancelarla en 1 tap",
      "Responder check-in rápido (cómo te sientes hoy, no-bloqueante)",
      "Ver racha actual y trofeo del mes curado por IA",
      "Tap rápido al leaderboard del WOD del día",
      "Ver tu último PR registrado y tu último score",
    ],
    deepLink: "/atleta",
  },
  {
    id: "wod",
    label: "WOD",
    title: "WOD del día · score automático.",
    lead: "Detalle completo del WOD con video por movimiento. Anotas score manual o subes foto del pizarrón. Auto-detect de PR con confetti cuando bajas tu marca.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/wod.png",
    imageAlt:
      "Pantalla de WOD del día mostrando movimientos, time cap, leaderboard y CTA de registrar score",
    actions: [
      "Ver el WOD del día con peso por movimiento",
      "Anotar score manual (tiempo · reps · peso)",
      "Subir foto del pizarrón → OCR detecta tu marca",
      "Ver tu mejor histórico + sparkline de últimos 5 intentos",
      "Comparar contra el leaderboard completo del box",
    ],
    deepLink: "/atleta/wod",
  },
  {
    id: "reservar",
    label: "Reservar",
    title: "Reservar · 7 días, 1 tap.",
    lead: "Strip de 7 días con todas las clases. Cupos en tiempo real. Si la clase está llena, lista de espera FIFO con tu posición visible — cuando alguien cancela, push automático.",
    audience: "ATLETA DE BOX",
    imageSrc: "/manual/atleta/reservar.png",
    imageAlt:
      "Pantalla de reservas con strip de 7 días y lista de clases del día seleccionado",
    actions: [
      "Navegar los próximos 7 días",
      "Reservar clase en 1 tap (CTA en color del box)",
      "Cancelar reserva (sin formulario, sin culpa)",
      "Entrar a waitlist con tu posición FIFO visible",
      "Recibir push si alguien cancela y entra tu lugar",
    ],
    deepLink: "/atleta/reservar",
  },
  {
    id: "programa",
    label: "Programa",
    title: "Programa semanal · tu propio WOD.",
    lead: "Carga manual de WODs día por día. Subes foto del pizarrón del box, del gym o de tu garage; OCR Gemini lo lee; tú editas y guardas. Cargado una vez, queda en tu historial para siempre.",
    audience: "BOX PERSONAL",
    imageSrc: "/manual/atleta/programa.png",
    imageAlt:
      "Pantalla de programa semanal con 7 días de WODs cargados manualmente",
    actions: [
      "Ver tu programa de los próximos 7 días",
      "Subir foto del pizarrón (1 WOD por foto)",
      "Editar el WOD detectado por OCR antes de guardar",
      "Registrar resultado directamente desde el programa",
    ],
    deepLink: "/atleta/programa",
  },
  {
    id: "skills",
    label: "Skills",
    title: "Skills · coach virtual con IA.",
    lead: "Eliges skill (snatch, muscle-up, pistol, handstand walk). Kronos calcula tus progresiones según tu nivel real, no según un PDF genérico. Las completadas se marcan, las bloqueadas te dicen por qué.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/skills.png",
    imageAlt:
      "Pantalla de skills con catálogo de movimientos y progresiones del coach virtual",
    actions: [
      "Activar el skill que quieres mejorar",
      "Ver progresiones desbloqueables (logradas · actual · bloqueadas)",
      "Leer cards del coach IA personalizadas a tu progreso",
      "Tap a un movimiento → técnica completa + PR + historia",
      "Ver predicción IA de tus próximos pasos",
    ],
    deepLink: "/atleta/skills",
  },
  {
    id: "perfil",
    label: "Perfil",
    title: "Perfil · datos duros de 90 días.",
    lead: "Radar de capacidades vs el promedio del box. Mapa de calor de asistencia tipo GitHub. Timeline de scores normalizados. Top 6 PRs. Si llevas 3 meses estancado, lo ves.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/perfil.png",
    imageAlt:
      "Pantalla de perfil con radar de capacidades, gráfica de progresión y mapa de calor de asistencia",
    actions: [
      "Ver tu radar de fuerza · cardio · core · olímpico",
      "Navegar timeline de 90 días de scores normalizados",
      "Ver mapa de calor de asistencia tipo GitHub",
      "Registrar medición corporal (peso · grasa · talla)",
      "Tap a Top PRs y a Movimientos más entrenados",
    ],
    deepLink: "/atleta/perfil",
  },
  {
    id: "movimientos",
    label: "Movimientos",
    title: "Movimientos · top 50 de 90 días.",
    lead: "Tu biblioteca técnica. Top 50 movimientos entrenados en los últimos 90 días con frecuencia, días desde el último intento y PR actual.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/movimientos.png",
    imageAlt:
      "Pantalla de movimientos con ranking por frecuencia y métricas por movimiento",
    actions: [
      "Ver ranking de tus 50 movimientos más entrenados",
      "Tap a un movimiento → técnica + PR + progresión histórica",
      "Filtrar y buscar en el catálogo completo",
    ],
    deepLink: "/atleta/movimientos",
  },
  {
    id: "logros",
    label: "Logros",
    title: "Logros · skill tree real.",
    lead: "Trofeos con condiciones reales: «Primer muscle-up estricto», «Doble peso corporal en back squat», «Guerrero RX». Nivel atleta global con XP. Lo que desbloqueas te costó.",
    audience: "AMBOS",
    imageSrc: "/manual/atleta/logros.png",
    imageAlt:
      "Pantalla de logros con grid de badges desbloqueables y nivel atleta",
    actions: [
      "Ver badges desbloqueados con la fecha",
      "Ver badges por desbloquear con tu progreso (%)",
      "Tap a un badge → condición exacta para desbloquearlo",
      "Ver nivel atleta global + XP hacia el próximo nivel",
    ],
    deepLink: "/atleta/logros",
  },
];

const PUBLIC_DIR = join(process.cwd(), "public");

export function imageExists(srcPath: string): boolean {
  if (!srcPath.startsWith("/")) return false;
  return existsSync(join(PUBLIC_DIR, srcPath));
}
