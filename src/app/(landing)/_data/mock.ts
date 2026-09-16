// Datos de la landing pública.
//
// Regla de verdad (audit 2026-09-15): cada viñeta de plan mapea a algo que el
// producto YA hace hoy. Los términos de servicio §3 dicen que los precios están
// publicados en la landing, así que estas viñetas son contractuales. Lo que está
// planeado vive SOLO en ROADMAP, en un bloque rotulado "En el roadmap".
//
// Pagos reales hoy: Mercado Pago (tarjeta) y efectivo registrado en el admin.
// Nada de Stripe, OXXO, SPEI, CFDI, nómina, apps en stores, API pública ni SSO.
//
// Direccionamiento hoy: un solo dominio. `Box` no tiene campo de dominio ni de
// subdominio, `src/middleware.ts` no rutea por host y `src/lib/email.ts` manda
// todo desde un `from` global. Por eso "tubox.kronos.app", "app.tubox.mx" y los
// correos desde el dominio del Box viven en ROADMAP, no en las viñetas.

import { CTA_TRIAL_HREF, CTA_TRIAL_LABEL, CTA_WHATSAPP_LABEL } from "./cta";

// HERO_META — strip verificable bajo el hero. Sin números inventados.
export const HERO_META = {
  strip:
    "White-label real · Multi-tenant cross-Box · Mercado Pago (tarjeta) y efectivo · Hecho en México",
};

// SOCIAL_PROOF_BOXES — vacío hasta firmar pilotos con consentimiento.
// Si hay piloto firmado, agregar { name, city }.
export const SOCIAL_PROOF_BOXES: Array<{ name: string; city: string }> = [];

// Paletas demo del white-label. Los captions son ejemplos neutros: no hay Boxes
// reales atribuidos hasta tener consentimiento firmado de un piloto.
export const WHITE_LABEL_PALETTES = [
  {
    name: "Lima Neon",
    hex: "#C8FF2D",
    caption: "Tu box · ejemplo",
    glow: true,
  },
  {
    name: "Naranja Brasa",
    hex: "#FF5A1F",
    caption: "Tu box · ejemplo",
  },
  {
    name: "Cobalto",
    hex: "#6B89FF",
    caption: "Tu box · ejemplo",
  },
  {
    name: "Sangre",
    hex: "#E84545",
    caption: "Tu box · ejemplo",
  },
];

export type PriceTier = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
};

// Precios planos por plan en MXN. Nombres metálicos (CrossFit = barra = metal).
export const PRICING: PriceTier[] = [
  {
    name: "Hierro",
    price: "$2,500",
    unit: "MXN · al mes",
    desc: "Para Boxes independientes hasta 80 atletas activos. El motor base para operar como profesional desde el día uno.",
    features: [
      "App del atleta GRATIS para todos tus miembros — sin costo por usuario",
      "App del atleta con tu logo, color y nombre del Box",
      "Reservas con lista de espera FIFO",
      "WOD del día + biblioteca de movimientos con video",
      "Control de asistencia (QR + manual)",
      "Membresías y cobranza con Mercado Pago (tarjeta) y efectivo",
      "PRs por movimiento y rachas",
      "Exportación de toda tu data en CSV",
      "Hasta 2 coaches en el admin",
      "Soporte por correo · 48 hrs hábiles",
      "Alta por tu cuenta, sin llamadas",
    ],
    cta: CTA_TRIAL_LABEL,
    ctaHref: CTA_TRIAL_HREF,
  },
  {
    name: "Acero",
    price: "$3,500",
    unit: "MXN · al mes",
    desc: "Para Boxes consolidados hasta 200 atletas. La operación profesional para los que ya escalaron y necesitan dejar de perder atletas.",
    features: [
      "App del atleta GRATIS para todos tus miembros — sin costo por usuario",
      "Todo lo de Hierro, más:",
      "Panel con ingresos del mes, bajas y ocupación por hora",
      "Constructor de WODs con RX y escalado",
      "Rankings del Box por WOD y por asistencia",
      "Pantalla para la TV del Box (pizarrón en vivo)",
      "Avisos y notificaciones push a tus atletas",
      "Reportes de operación e ingresos",
      "Coaches ilimitados en el admin",
      "Soporte por WhatsApp · 4 hrs hábiles",
      "Acompañamiento de alta si lo quieres (opcional)",
    ],
    cta: CTA_TRIAL_LABEL,
    ctaHref: CTA_TRIAL_HREF,
    featured: true,
  },
  {
    name: "Titanio",
    price: "$5,000",
    unit: "MXN · al mes",
    desc: "Para multi-sede, franquicias y redes de Boxes. Atletas activos sin límite y multi-tenant cross-Box. Un atleta, varias ciudades, una sola racha.",
    features: [
      "App del atleta GRATIS para todos tus miembros — sin costo por usuario",
      "Todo lo de Acero, más:",
      "Atletas activos sin límite",
      "Multi-tenant cross-Box (racha unificada)",
      "Consolidado de todas las sedes en un solo panel",
      "Cambio de sede desde el admin",
      "Acompañamiento de alta y migración de tu data",
      "Paleta y logo por sede",
    ],
    cta: CTA_WHATSAPP_LABEL,
    // Resuelto en el componente: WhatsApp si hay número, si no el formulario.
    ctaHref: "",
  },
];

/**
 * ROADMAP — lo único que puede nombrar features no lanzadas, y solo aquí.
 * NUNCA moverlas a `PRICING.features`: esas viñetas son contractuales.
 */
export const ROADMAP: string[] = [
  "Facturación electrónica MX (CFDI)",
  "Pagos en efectivo por convenio y transferencia con referencia",
  "Programación de bloques de varias semanas",
  "Apps publicadas en tiendas con el nombre del Box",
  "Subdominio por Box (tubox.kronos.app)",
  "Dominio propio del Box y correos desde tu dominio",
  "Integraciones con terceros",
];

export type OwnerKpi = {
  label: string;
  /** Valor estático de demo. No se anima: un "$0K" en la captura es peor que no tener número. */
  value: string;
  delta: string;
  up?: boolean;
};

// Datos de ejemplo del panel admin que se muestra en /02. NO es tracción de
// Kronos ni de ningún Box real: son cifras plausibles de un Box de ~400 atletas.
export const OWNER_KPIS: OwnerKpi[] = [
  {
    label: "Ingresos del mes",
    value: "$184,000",
    delta: "+12 % vs mes pasado",
    up: true,
  },
  {
    label: "Atletas activos",
    value: "412",
    delta: "+28 netos",
    up: true,
  },
  {
    label: "Bajas del mes",
    value: "3.1 %",
    delta: "−0.4 pts vs mes pasado",
  },
];

// Datos de ejemplo — 14 días, valor 0-100. Lima si activo, gris si fin de semana.
export const OWNER_OCCUPANCY: Array<{ value: number; weekend?: boolean }> = [
  { value: 65 },
  { value: 78 },
  { value: 82 },
  { value: 70 },
  { value: 60 },
  { value: 35, weekend: true },
  { value: 28, weekend: true },
  { value: 88 },
  { value: 92 },
  { value: 75 },
  { value: 80 },
  { value: 95 },
  { value: 40, weekend: true },
  { value: 32, weekend: true },
];

export const FOOTER_LINKS = {
  producto: [
    { label: "App del atleta", href: "#section-atleta" },
    { label: "Panel del dueño", href: "#section-owner" },
    { label: "White-label", href: "#section-whitelabel" },
    { label: "Multi-tenant cross-Box", href: "#section-atleta" },
    { label: "Pagos", href: "#section-owner" },
    { label: "Precios", href: "#section-pricing" },
  ],
  recursos: [
    { label: "Manual del atleta", href: "/atletas/manual" },
    { label: "Kronos para atletas", href: "/atletas" },
    { label: "Pantalla para la TV del Box", href: "/tv" },
  ],
  kronos: [
    { label: "Contacto", href: "mailto:hola@kronos-fit.com" },
    { label: "Términos", href: "/legal/terminos" },
    { label: "Privacidad", href: "/legal/privacidad" },
  ],
};

// FAQ data
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "¿Cuánto tarda darse de alta?",
    answer:
      "Creas tu Box en minutos desde la página de registro: tu nombre, tu correo, el nombre del Box y su identificador. Migrar atletas, reservas y programación toma unas horas más y lo puedes hacer tú con el template CSV, o nosotros te acompañamos si lo prefieres.",
  },
  {
    id: 2,
    question: "¿Migran mi data desde Wodify, PushPress, SugarWOD o Boxmagic?",
    answer:
      "Sí. En Titanio la migración va acompañada. En Hierro y Acero te damos el template CSV y un instructivo paso a paso para que la subas tú. Si te atoras, soporte te ayuda.",
  },
  {
    id: 3,
    question: "¿Qué pasa si no me convence?",
    answer:
      'Te exportamos toda tu data en CSV (atletas, asistencias, PRs, pagos, programación) y cancelas cuando quieras. Sin penalidad, sin "cláusulas de salida". Tu data es tuya por contrato.',
  },
  {
    id: 4,
    question: "¿Cómo cobro las mensualidades y cobran comisión?",
    answer:
      "Hoy cobras con Mercado Pago (tarjeta) desde la app del atleta, y registras el efectivo en el admin para que ningún pago se pierda. Kronos no cobra comisión sobre tus ingresos: las únicas tarifas son las de Mercado Pago, directas con ellos y auditables por ti.",
  },
  {
    id: 5,
    question: "¿Qué tan blanco es el white-label?",
    answer:
      "Hoy es tu marca sobre nuestra dirección. Cargas tu logo y tu color al dar de alta el Box, y salen en la pantalla de TV, en las invitaciones que reciben atletas y coaches, y en el panel. La app corre en kronos-fit.com en todos los planes y los correos salen desde no-reply@kronos-fit.com firmados por el Box. El dominio propio y los correos desde tu dominio están en el roadmap y te avisamos cuando salgan; hoy no te los vendemos como incluidos.",
  },
  {
    id: 6,
    question: "¿Mis datos están seguros?",
    answer:
      "Base de datos en Postgres con cifrado en reposo. Cada Box es un tenant aislado: nadie de otro Box puede ver tu información, ni siquiera por error de sistema. Respaldos diarios, retención de 30 días. No usamos tu data para entrenar modelos de IA ni la vendemos a terceros.",
  },
];

// Currency (legacy, kept for CurrencySwitcher)
export const FX_RATES = {
  asOf: "2026-05-08",
  base: "MXN" as const,
  rates: {
    MXN: 1,
    USD: 1 / 20,
    COP: 220,
    ARS: 60,
    PEN: 0.18,
  },
} as const;

export type CurrencyCode = keyof typeof FX_RATES.rates;

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  MXN: "MXN",
  USD: "USD",
  COP: "COP",
  ARS: "ARS",
  PEN: "PEN",
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  MXN: "$",
  USD: "US$",
  COP: "$",
  ARS: "$",
  PEN: "S/",
};

// Lead form options
export const ATHLETES_OPTIONS = [
  { value: "less_than_50", label: "Menos de 50" },
  { value: "50_100", label: "50–100" },
  { value: "100_200", label: "100–200" },
  { value: "200_500", label: "200–500" },
  { value: "more_than_500", label: "Más de 500" },
];

export const SOFTWARE_OPTIONS = [
  { value: "wodify", label: "Wodify" },
  { value: "pushpress", label: "PushPress" },
  { value: "sugarwod", label: "SugarWOD" },
  { value: "boxmagic", label: "Boxmagic" },
  { value: "excel", label: "Excel + WhatsApp" },
  { value: "other", label: "Otro" },
  { value: "none", label: "Ninguno" },
];

export const PLAN_OPTIONS = [
  { value: "hierro", label: "Hierro ($2,500 MXN)" },
  { value: "acero", label: "Acero ($3,500 MXN)" },
  { value: "titanio", label: "Titanio ($5,000 MXN)" },
  { value: "unsure", label: "No estoy seguro todavía" },
];
