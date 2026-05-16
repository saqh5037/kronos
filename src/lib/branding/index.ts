/**
 * Branding por disciplina — copy/SEO/heading que cambia según el deporte
 * que la landing está atrayendo (CrossFit, Hyrox, futuro yoga/pilates).
 *
 * Fuente única de verdad para todo el copy "vertical-specific" de la
 * landing pública `/box`. Los componentes (Hero, Pricing, SectionFAQ)
 * reciben este objeto como prop y lo renderizan; NO hardcodean copy
 * de disciplina.
 *
 * Default = crossfit (audiencia primaria + retrocompat con landing live
 * antes de F1.3).
 */

export type DisciplineBrandingSlug = "crossfit" | "hyrox";

export interface DisciplineBrandingFAQItem {
  q: string;
  a: string;
}

export interface DisciplineBranding {
  slug: DisciplineBrandingSlug;
  /** Nombre legible para metadata/title y references inline. */
  name: string;
  /** Title metadata SEO de la landing. */
  metaTitle: string;
  /** Description metadata SEO de la landing. */
  metaDescription: string;
  /** Heading principal del hero. Split por <br/> en el render. */
  heroTitleLine1: string;
  heroTitleLine2: string;
  /** Subtítulo del hero. */
  heroSubtitle: string;
  /** Copy del eyebrow "PILOTO PRIVADO · MÉXICO · CUPO LIMITADO" (mismo en todas las disciplinas por ahora, parametrizable a futuro). */
  heroEyebrow: string;
  /** Tagline corto que aparece en pricing card / footer / OG image. */
  productTagline: string;
  /** Items extras de FAQ específicos de la disciplina, que se mergean con FAQ genéricas. */
  faqExtras: DisciplineBrandingFAQItem[];
}

const CROSSFIT_BRANDING: DisciplineBranding = {
  slug: "crossfit",
  name: "CrossFit",
  metaTitle: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
  metaDescription:
    "Software invisible para CrossFit Boxes en LATAM. White-label real, multi-tenant, pagos Stripe + Mercado Pago + OXXO. Tus atletas usan la app gratis incluida.",
  heroTitleLine1: "Software invisible",
  heroTitleLine2: "para tu CrossFit Box.",
  heroSubtitle:
    "Reservas, WODs, pagos, racha y admin en una sola app, en español, con tu logo y tu color. Diseñada para CrossFit en México.",
  heroEyebrow: "PILOTO PRIVADO · MÉXICO · CUPO LIMITADO",
  productTagline: "El sistema operativo de tu CrossFit Box",
  faqExtras: [],
};

const HYROX_BRANDING: DisciplineBranding = {
  slug: "hyrox",
  name: "Hyrox",
  metaTitle:
    "Kronos para Hyrox — Programación, race format y atletas en una app",
  metaDescription:
    "Software para gyms Hyrox en LATAM. Stations + race format integrados. White-label, multi-tenant, pagos Stripe + Mercado Pago + OXXO. App atleta gratis incluida.",
  heroTitleLine1: "Software invisible",
  heroTitleLine2: "para tu gym Hyrox.",
  heroSubtitle:
    "Stations, race format, tiempos, reservas y admin en una sola app, en español, con tu logo y tu color. Diseñada para Hyrox en LATAM.",
  heroEyebrow: "PILOTO PRIVADO · MÉXICO · CUPO LIMITADO",
  productTagline: "El sistema operativo de tu gym Hyrox",
  faqExtras: [
    {
      q: "¿Kronos soporta el race format de Hyrox?",
      a: "Sí. Los WODs en boxes Hyrox usan estructura stations + tiempos: 8 ejercicios funcionales intercalados con 1 km de remo/run cada uno. El editor de WODs renderiza esa estructura de manera nativa y los atletas registran sus splits directamente.",
    },
    {
      q: "¿Pueden mis atletas registrar PRs por station individual?",
      a: "Sí. Cada station (SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, RowErg, Farmers Carry, Sandbag Lunges, Wall Balls) tiene su propio PR tracking + leaderboard por gym.",
    },
  ],
};

const BRANDING_BY_SLUG: Record<DisciplineBrandingSlug, DisciplineBranding> = {
  crossfit: CROSSFIT_BRANDING,
  hyrox: HYROX_BRANDING,
};

/**
 * Resuelve la config de branding por slug. Si el slug no es válido
 * (ej: query param `?discipline=foo`), retorna crossfit (fallback seguro
 * para landing pública).
 */
export function getDisciplineBranding(
  slug: string | null | undefined,
): DisciplineBranding {
  if (slug === "hyrox") return HYROX_BRANDING;
  return CROSSFIT_BRANDING;
}

/**
 * Indica si un slug arbitrario es una disciplina soportada hoy.
 * Útil para validar query params antes de renderizar.
 */
export function isSupportedDiscipline(
  slug: string | null | undefined,
): slug is DisciplineBrandingSlug {
  return slug === "crossfit" || slug === "hyrox";
}

export const DEFAULT_DISCIPLINE_BRANDING = CROSSFIT_BRANDING;

export { BRANDING_BY_SLUG };
