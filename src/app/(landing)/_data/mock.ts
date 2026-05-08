// Datos de la landing pública. Donde aparezca @mock es porque es ilustrativo
// (preview del producto), no claim de tracción.

// HERO_META — strip verificable bajo el hero. Sin números inventados.
export const HERO_META = {
  uptime: "99.9%",
  payments: "Stripe · Mercado Pago · OXXO",
  language: "Español nativo",
  region: "LATAM · MX · CO · PE",
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
    caption: "Default del sistema",
    glow: true,
  },
  {
    name: "Naranja Brasa",
    hex: "#FF5A1F",
    caption: "Para Boxes con identidad cálida",
  },
  {
    name: "Cobalto",
    hex: "#6B89FF",
    caption: "Para Boxes con identidad técnica",
  },
  {
    name: "Sangre",
    hex: "#E84545",
    caption: "Para Boxes con identidad agresiva",
  },
];

export type PriceTier = {
  name: string;
  price: string;
  unit: string;
  desc: string;
  features: Array<string | { text: string; soon: true }>;
  cta: string;
  ctaHref: string;
  featured?: boolean;
};

// Pricing flat tiered en MXN + IVA. Nombres metálicos (CrossFit = barbell = metal).
// Features con `soon: true` se muestran como "próximamente Q3 2026".
export const PRICING: PriceTier[] = [
  {
    name: "Hierro",
    price: "$2,000",
    unit: "MXN + IVA · al mes",
    desc: "El motor base. Todo Box arranca con hierro. Para afiliados que necesitan operar como pro desde el primer WOD.",
    features: [
      "App del atleta · web + PWA instalable",
      "Reservas + waitlist FIFO",
      "WOD del día + benchmarks (Helen, Murph, Fran)",
      "Hero racha + PRs por movimiento",
      "Admin dashboard · KPIs del día",
      "Hasta 100 atletas activos",
      "Soporte email · respuesta 48h hábiles",
    ],
    cta: "Empezar →",
    ctaHref: "/signup?plan=hierro",
  },
  {
    name: "Acero",
    price: "$3,500",
    unit: "MXN + IVA · al mes",
    desc: "Aleación más fuerte. Tu marca arriba, nuestro motor abajo. Para Boxes que ya escalaron y necesitan dejar de perder atletas.",
    features: [
      "Todo de Hierro, más:",
      "White-label visual · tu logo, tu color de acento",
      "Admin avanzado · MRR, churn, atletas en riesgo",
      "Multi-coach · roles separados owner/coach/staff",
      "Programación de bloques · 12 semanas",
      "Hasta 300 atletas activos",
      "Soporte WhatsApp · 24h hábiles",
    ],
    cta: "Reservar demo →",
    ctaHref: "/signup?plan=acero&intent=demo",
    featured: true,
  },
  {
    name: "Titanio",
    price: "$5,000",
    unit: "MXN + IVA · al mes",
    desc: "Material aeroespacial. Para Boxes que cobran como SaaS — automático, facturado y sin perseguir a nadie.",
    features: [
      "Todo de Acero, más:",
      "Cobranza automática · Stripe + Mercado Pago + OXXO",
      { text: "Facturación electrónica · CFDI 4.0", soon: true },
      {
        text: "Email transaccional desde tu dominio (no-reply@tubox.mx)",
        soon: true,
      },
      "Atletas ilimitados",
      "Soporte prioritario · contacto directo · 4h",
      "API + webhooks documentados",
    ],
    cta: "Hablar con ventas →",
    ctaHref: "mailto:ventas@kronos.app?subject=Plan%20Titanio",
  },
];

// Tipo de cambio MXN → otras monedas. Actualizar mensualmente.
// "asOf" se muestra al usuario como nota de transparencia.
export const FX_RATES = {
  asOf: "2026-05-08",
  base: "MXN" as const,
  // 1 MXN = X destination
  rates: {
    MXN: 1,
    USD: 1 / 20, // 1 USD ≈ 20 MXN
    COP: 220, // 1 MXN ≈ 220 COP
    ARS: 60, // 1 MXN ≈ 60 ARS (alta inflación, validar mensualmente)
    PEN: 0.18, // 1 MXN ≈ 0.18 PEN
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

// @mock — KPIs ilustrativos del admin dashboard preview en /02. NO son tracción real de Kronos.
export const OWNER_KPIS = [
  { label: "MRR", value: "$184K", delta: "↑ 12% MoM", up: true },
  { label: "Atletas", value: "412", delta: "↑ 28 neto" },
  { label: "Churn", value: "3.1", pct: "%", delta: "−0.4% MoM" },
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
    { label: "Para atletas", href: "#atleta" },
    { label: "Para owners", href: "#owner" },
    { label: "White-label", href: "#white-label" },
    { label: "Precios", href: "#pricing" },
  ],
  empresa: [
    { label: "Contacto", href: "mailto:hola@kronos.app" },
    { label: "Ventas", href: "mailto:ventas@kronos.app" },
  ],
  legal: [
    { label: "Términos", href: "/legal/terminos" },
    { label: "Privacidad", href: "/legal/privacidad" },
  ],
};
