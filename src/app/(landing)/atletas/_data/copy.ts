/**
 * Copy centralizado de la landing /atletas.
 * Español mexicano neutro — sin voseo argentino.
 *
 * Regla de verdad (audit 2026-09-15): NO hay testimonios en esta página. Las
 * placas "RESEÑAS · EJEMPLO ILUSTRATIVO" se eliminaron: una reseña inventada,
 * aunque esté rotulada como ejemplo, cuesta más confianza que una sección
 * vacía. Cuando haya citas de atletas con consentimiento firmado, se agregan
 * aquí como `TESTIMONIALS` y se vuelve a montar la sección.
 */

import { CONTACT_EMAIL } from "../../_data/cta";

export const CTA_LABEL = "Empezar gratis" as const;

export const HERO = {
  eyebrow: "GRATIS PARA SIEMPRE · NO NECESITAS QUE TU BOX USE KRONOS",
  claimLineA: "Tu progreso",
  claimLineB: "es el producto.",
  sub: "Tu racha, tus PRs, tu WOD del día. Crea tu cuenta gratis en 30 segundos. Sin tarjeta, sin spam y sin frases motivacionales de relleno.",
  ctaTertiary: "Aunque tu Box todavía no use Kronos, tú ya puedes empezar.",
} as const;

export const BENEFIT_SKILLS = {
  eyebrow: "/01 · HABILIDADES",
  h2: "Aprende. Perfecciona. Domina.",
  body: "Eliges la habilidad — snatch, muscle-up, pistol, handstand walk. Kronos calcula las progresiones que te tocan hoy según tu nivel, no según un PDF genérico. Las que ya dominaste se marcan; las bloqueadas te dicen exactamente por qué.",
  detail: {
    label: "PROGRESIÓN",
    value: "27 %",
  },
  phoneSrc: "/manual/atleta/skills.png",
  phoneAlt:
    "Pantalla de Habilidades mostrando el catálogo de movimientos con coach virtual y progresiones desbloqueables",
} as const;

export const BENEFIT_WOD = {
  eyebrow: "/02 · WOD DEL DÍA",
  h2: "El WOD de hoy. El PR que no viste.",
  body: "Tomas foto del pizarrón al terminar. Kronos lee el nombre, los movimientos y tu marca. Si bajaste 34 segundos en Helen, lo sabes al instante — no porque el coach se acordó tres días después.",
  detail: { label: "ÚLTIMO HELEN", value: "−0:34" },
  phoneSrc: "/tutorials/wod-del-dia/screenshots/01-wod.png",
  phoneAlt:
    "Pantalla del WOD del día con movimientos, time cap y botón para registrar tu score",
} as const;

export const WHY = {
  eyebrow: "/03 · POR QUÉ KRONOS",
  h2Line1: "Honestidad",
  h2Line2: "antes que venta.",
  sub: "Te decimos qué no hace Kronos para que sepas si es para ti. Si lo que necesitas está en la columna derecha, hay otras apps mejores.",
  yesTitle: "Lo que la app hace.",
  noTitle: "Lo que no hace.",
  yesItems: [
    "Trackear tus PRs y ver tu progresión real",
    "Reservar clase en tu box (si tu box usa Kronos)",
    "Foto del pizarrón → score automático",
    "Habilidades con coach de IA y progresiones desbloqueables",
    "Comparar tu rendimiento contra el promedio del box",
    "Leer tu propio histórico sin vender tus datos",
  ],
  noItems: [
    "Reemplaza a tu coach humano (no arma planes, no corrige técnica)",
    "Es app de fitness genérica (no caminas, no cuentas macros, no hay yoga)",
    "Es red social (no hay feed de extraños, no hay influencers)",
    "Funciona sin tu box (en Box Personal tú cargas los WODs)",
    "Te da motivación falsa (cero «¡tú puedes!», cero emojis de fuego)",
    "Te vende a anunciantes (tu data no entrena modelos de terceros)",
  ],
} as const;

/**
 * @deprecated No hay testimonios. Se conservan vacíos SOLO porque
 * `src/app/atletas.json/route.ts` y `src/app/atletas.md/route.ts` los importan;
 * esos dos endpoints deben dejar de emitir la sección de reseñas (quedan fuera
 * del alcance de este cambio). No vuelvas a llenarlos con citas inventadas: si
 * hay citas reales con consentimiento firmado, se crea `TESTIMONIALS` y se
 * remonta la sección en la página.
 */
export const TESTIMONIAL_HERO = {
  eyebrow: "",
  quote: "",
  attribution: "",
} as const;

/** @deprecated Ver `TESTIMONIAL_HERO`. */
export const DUAL_QUOTES = {
  eyebrow: "",
  a: { quote: "", attribution: "" },
  b: { quote: "", attribution: "" },
} as const;

export const FINAL_CTA = {
  eyebrow: "EMPIEZA HOY · GRATIS · SIN TARJETA · SIN LETRA CHICA",
  h2Line1: "Crea tu cuenta",
  h2Line2: "gratis hoy.",
  sub: "30 segundos. Sin tarjeta. Sin pedirle permiso a tu Box. Si tu Box ya usa Kronos, todo se cablea solo. Si no, tú empiezas a llevar tu progreso desde ya.",
  ctaSecondaryLabel: "Quiero Kronos en mi box",
  ctaSecondaryHref: `mailto:${CONTACT_EMAIL}?subject=Quiero%20Kronos%20en%20mi%20box`,
  footnote: "TU DATA ES TUYA · SIN ANUNCIANTES · GRATIS PARA SIEMPRE",
} as const;

export const FOOTER = {
  copy: "© 2026 KRONOS · ATLETAS · HECHO EN MÉXICO",
  links: [
    { label: "Términos", href: "/legal/terminos" },
    { label: "Privacidad", href: "/legal/privacidad" },
    { label: "Manual", href: "/atletas/manual" },
  ],
  coachLine: "¿Eres coach?",
  coachLinkLabel: "Kronos para boxes",
  coachLinkHref: "/box",
} as const;
