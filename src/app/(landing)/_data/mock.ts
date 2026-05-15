// Datos de la landing pública. Donde aparezca @mock es porque es ilustrativo
// (preview del producto), no claim de tracción.

// HERO_META — strip verificable bajo el hero. Sin números inventados.
export const HERO_META = {
  strip:
    "White-label real · Multi-tenant cross-Box · Stripe + Mercado Pago + OXXO · Hecho en LATAM",
};

// SOCIAL_PROOF_BOXES — vacío hasta firmar pilotos con consentimiento.
// Si hay piloto firmado, agregar { name, city }.
export const SOCIAL_PROOF_BOXES: Array<{ name: string; city: string }> = [];

// Paletas demo del white-label. Sin atribuir a Boxes específicos hasta tener
// pilotos reales. "Lima Neon" es el default del sistema.
export const WHITE_LABEL_PALETTES = [
  {
    name: "Lima Neon",
    hex: "#C8FF2D",
    caption: "Califa CrossFit · CO",
    glow: true,
  },
  {
    name: "Naranja Brasa",
    hex: "#FF5A1F",
    caption: "Iron Hands · MX",
  },
  {
    name: "Cobalto",
    hex: "#6B89FF",
    caption: "Alpha Box · PE",
  },
  {
    name: "Sangre",
    hex: "#E84545",
    caption: "Húsares · MX",
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

// Pricing flat tiered en MXN. Nombres metálicos (CrossFit = barbell = metal).
export const PRICING: PriceTier[] = [
  {
    name: "Hierro",
    price: "$2,500",
    unit: "MXN · al mes",
    desc: "Para Boxes independientes hasta 80 atletas activos. El motor base para operar como profesional desde el día uno.",
    features: [
      "App del atleta con tu logo, color y nombre del Box",
      "Subdominio tubox.kronos.app",
      "Reservas con waitlist FIFO",
      "WOD del día + biblioteca con video",
      "Control de asistencia (QR + manual)",
      "Hero racha + PRs por movimiento",
      "Stripe + Mercado Pago",
      "Cobranza automatizada",
      "Hasta 2 coaches en el admin",
      "Soporte email · 48 hrs hábiles",
      "Onboarding self-service",
    ],
    cta: "Empezar con Hierro →",
    ctaHref: "#section-form",
  },
  {
    name: "Acero",
    price: "$3,500",
    unit: "MXN · al mes",
    desc: "Para Boxes consolidados hasta 200 atletas. La operación profesional para los que ya escalaron y necesitan dejar de perder atletas.",
    features: [
      "Todo lo de Hierro, más:",
      "Admin completo con MRR, churn y ocupación",
      "Programación de bloques (12 semanas)",
      "WODs builder con RX y scaled",
      "Leaderboards del Box",
      "Multi-coach + nómina automática",
      "Push notifications + announcements",
      "Apps móviles cobranded (tu logo, sub-marca Kronos)",
      "Facturación electrónica MX (CFDI 4.0)",
      "OXXO + SPEI nativos",
      "Reportes financieros",
      "Soporte WhatsApp · 4 hrs hábiles",
    ],
    cta: "Probar Acero 30 días →",
    ctaHref: "#section-form",
    featured: true,
  },
  {
    name: "Titanio",
    price: "$5,000",
    unit: "MXN · al mes",
    desc: "Para multi-sede, franquicias y redes de Boxes. Atletas activos sin límite, white-label total y multi-tenant cross-Box. Un atleta, varias ciudades, una sola racha.",
    features: [
      "Todo lo de Acero, más:",
      "White-label completo · dominio propio (app.tubox.mx)",
      "Cero marca Kronos en pantalla, footer ni emails",
      "Apps con tu nombre en App Store y Play Store",
      "Multi-tenant cross-Box (racha unificada)",
      "BI consolidado de todas las sedes",
      "Switcher de sede para owners",
      "API pública + webhooks",
      "SSO (Google Workspace, Microsoft Entra)",
      "Onboarding asistido + migración",
      "SLA 99.9% · soporte 24/7",
      "Brand kit por sede",
    ],
    cta: "Hablar con ventas →",
    ctaHref: "#section-form",
  },
];

export type OwnerKpi = {
  label: string;
  /** Display fallback string (no-JS / reduce-motion render). */
  value: string;
  /** Number to count to when entering viewport. */
  displayTo: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Static percent suffix shown next to the counter (e.g. " %" for Churn). */
  pct?: string;
  delta: string;
  up?: boolean;
};

// @mock — KPIs ilustrativos del admin dashboard preview en /02. NO son tracción real de Kronos.
export const OWNER_KPIS: OwnerKpi[] = [
  {
    label: "MRR",
    value: "$184K",
    displayTo: 184,
    prefix: "$",
    suffix: "K",
    delta: "↑12% MoM",
    up: true,
  },
  {
    label: "Atletas",
    value: "412",
    displayTo: 412,
    delta: "↑28 neto",
  },
  {
    label: "Churn",
    value: "3.1",
    displayTo: 3.1,
    decimals: 1,
    pct: "%",
    delta: "↓0.4% MoM",
  },
];

// @mock — bars 14 days, valor 0-100. Lima si activo, gris si fin de semana.
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
    { label: "Admin del owner", href: "#section-owner" },
    { label: "White-label", href: "#section-whitelabel" },
    { label: "Multi-tenant cross-Box", href: "#section-atleta" },
    { label: "Pagos", href: "#section-owner" },
    { label: "Pricing", href: "#section-pricing" },
  ],
  recursos: [
    { label: "Documentación", href: "#", comingSoon: true },
    { label: "Estado del sistema", href: "#", comingSoon: true },
    { label: "Changelog", href: "#", comingSoon: true },
  ],
  kronos: [
    { label: "Contacto", href: "mailto:hola@kronos.app" },
    { label: "Términos", href: "/legal/terminos" },
    { label: "Privacidad", href: "/legal/privacidad" },
  ],
};

// FAQ data
export const FAQ_ITEMS = [
  {
    id: 1,
    question: "¿Cuánto tarda el onboarding?",
    answer:
      "72 horas hábiles para Hierro y Acero. Migras reservas, atletas activos, mandatos de pago y programación sin perder un día de operación. Titanio incluye onboarding presencial; el plazo depende del tamaño de la red.",
  },
  {
    id: 2,
    question: "¿Migran mi data desde Wodify, PushPress, SugarWOD o Boxmagic?",
    answer:
      "Sí. En Acero y Titanio la migración está incluida. En Hierro te damos el template CSV y un instructivo paso a paso para que la subas tú. Si te atoras, soporte te ayuda.",
  },
  {
    id: 3,
    question: "¿Qué pasa si no me convence?",
    answer:
      'Te exportamos toda tu data en CSV (atletas, asistencias, PRs, pagos, programación) y cancelas cuando quieras. Sin penalidad, sin "cláusulas de salida". Tu data es tuya por contrato.',
  },
  {
    id: 4,
    question: "¿Cobran comisión sobre los pagos de mis atletas?",
    answer:
      "No cobramos comisión sobre tus ingresos. Las únicas tarifas son las de Stripe y Mercado Pago, que son directas con ellos y tú puedes ver y auditar. Nosotros no metemos mano ahí.",
  },
  {
    id: 5,
    question: "¿Qué tan blanco es el white-label?",
    answer:
      "Hierro y Acero: tu logo, color y nombre dominan la app, en un subdominio tubox.kronos.app con un footer discreto 'Powered by Kronos'. Los emails llegan desde no-reply@kronos.app firmados por el Box. En Acero, además, apps móviles cobranded (tu logo + sub-marca Kronos). Titanio: dominio propio (app.tubox.mx), emails desde tu dominio, apps publicadas con tu nombre en App Store y Play Store, sin Kronos en ninguna pantalla. El atleta de Titanio nunca lee Kronos.",
  },
  {
    id: 6,
    question: "¿Mis datos están seguros?",
    answer:
      "Base de datos en Postgres con encryption at rest. Cada Box es un tenant aislado: nadie de otro Box puede ver tu información, ni siquiera por error de sistema. Backups diarios, retención de 30 días. No usamos tu data para entrenar modelos de IA ni la vendemos a terceros.",
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
