/**
 * Copy centralizado de la landing /atletas.
 * Español mexicano neutro — sin voseo argentino.
 *
 * Las placas de testimonios llevan `· EJEMPLO ILUSTRATIVO` hasta que
 * Samuel reemplace con consentimiento firmado de atletas reales.
 */

export const CTA_LABEL = "ENTRAR" as const;

export const HERO = {
  eyebrow: "KRONOS · ATLETAS",
  claimLineA: "Tu progreso",
  claimLineB: "es el producto.",
  sub: "Tu racha. Tus PRs. Tu WOD. Sin spam, sin gamificación cringe, sin influencers.",
  ctaTertiary: "¿No la tienes? Pídela a tu coach.",
} as const;

export const BENEFIT_SKILLS = {
  eyebrow: "/01 · SKILLS",
  h2: "Aprende. Perfecciona. Domina.",
  body: "Eliges el skill — snatch, muscle-up, pistol, handstand walk. Kronos calcula las progresiones que te tocan hoy según tu nivel, no según un PDF genérico. Las que ya dominaste se marcan; las bloqueadas te dicen exactamente por qué.",
  detail: { label: "PROGRESIÓN", value: "27%" },
  phoneSrc: "/manual/atleta/skills.png",
  phoneAlt:
    "Pantalla de Skills mostrando el catálogo de movimientos con coach virtual y progresiones desbloqueables",
} as const;

export const BENEFIT_WOD = {
  eyebrow: "/02 · WOD DEL DÍA",
  h2: "El WOD de hoy. El PR que no viste.",
  body: "Tomas foto del pizarrón al terminar. Kronos lee el nombre, los movimientos y tu marca. Si bajaste 34 segundos en Helen, lo sabes al instante — no porque el coach se acordó tres días después.",
  detail: { label: "ÚLTIMO HELEN", value: "−0:34" },
  phoneSrc: "/tutorials/wod-del-dia/screenshots/01-wod.png",
  phoneAlt:
    "Pantalla del WOD del día con movimientos, time cap y CTA de registrar score",
} as const;

export const TESTIMONIAL_HERO = {
  eyebrow: "RESEÑAS · EJEMPLO ILUSTRATIVO",
  quote:
    "Después de 3 años usando Excel, ver mi heatmap de 90 días me rompió. No me había dado cuenta de cuánto había entrenado.",
  attribution: "DANIEL R. · 6:00 AM · IRON HANDS CROSSFIT, CDMX",
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
    "Skills con coach IA y progresiones desbloqueables",
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

export const DUAL_QUOTES = {
  eyebrow: "MÁS RESEÑAS · EJEMPLO ILUSTRATIVO",
  a: {
    quote: "Mi racha sobrevivió a 2 mudanzas y un cambio de box.",
    attribution: "MARIANA V. · 5 AM · CDMX",
  },
  b: {
    quote:
      "El día que el sistema me gritó «nuevo PR en back squat» en media clase, lloré. Neta.",
    attribution: "RICARDO H. · ACAPULCO",
  },
} as const;

export const FINAL_CTA = {
  eyebrow: "EMPIEZA HOY · SIN TARJETA · SIN LETRA CHICA",
  h2Line1: "Entra",
  h2Line2: "o pídela.",
  sub: "Si tu box ya usa Kronos, entras con tu correo. Si no, pásale el link a tu coach — la decisión es de él, pero ya tienes argumentos.",
  ctaSecondaryLabel: "Que mi box la pida",
  ctaSecondaryHref:
    "mailto:hola@kronos-fit.com?subject=Quiero%20Kronos%20en%20mi%20box",
  footnote: "TU DATA ES TUYA · SIN ANUNCIANTES",
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
