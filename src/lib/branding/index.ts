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
  /** Copy del eyebrow "PILOTO PRIVADO · MÉXICO" (mismo en todas las disciplinas por ahora, parametrizable a futuro). */
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
    "Software invisible para CrossFit Boxes en México. Multi-tenant, con tu logo y tu color, pagos con Mercado Pago (tarjeta) y efectivo. App del atleta gratis.",
  heroTitleLine1: "Software invisible",
  heroTitleLine2: "para tu CrossFit Box.",
  heroSubtitle:
    "Reservas, WODs, pagos, racha y admin en una sola app, en español, con tu logo y tu color. Diseñada para CrossFit en México.",
  heroEyebrow: "PILOTO PRIVADO · MÉXICO",
  productTagline: "El sistema operativo de tu CrossFit Box",
  faqExtras: [],
};

const HYROX_BRANDING: DisciplineBranding = {
  slug: "hyrox",
  name: "Hyrox",
  metaTitle:
    "Kronos para Hyrox — Programación, reservas y atletas en una sola app",
  metaDescription:
    "Software para gyms Hyrox en México. Multi-tenant, con tu logo y tu color, pagos con Mercado Pago (tarjeta) y efectivo. App del atleta gratis.",
  heroTitleLine1: "Software invisible",
  heroTitleLine2: "para tu gym Hyrox.",
  heroSubtitle:
    "Programación, tiempos, reservas y admin en una sola app, en español, con tu logo y tu color. Diseñada para gyms Hyrox en México.",
  heroEyebrow: "PILOTO PRIVADO · MÉXICO",
  productTagline: "El sistema operativo de tu gym Hyrox",
  // Las dos respuestas prometían un editor nativo de estaciones y un
  // leaderboard por estación. `HyroxWODFormPlaceholder` es lo que existe: un
  // stub que manda al editor estándar. Mientras eso siga así, la FAQ lo dice.
  faqExtras: [
    {
      q: "¿Kronos soporta el race format de Hyrox?",
      a: "Todavía no de forma nativa. Hoy cargas la sesión en el editor estándar, en formato libre: escribes las ocho estaciones con su distancia o carga y el kilómetro entre cada una, y tus atletas registran su tiempo total. El editor con estaciones y splits por estación está en el roadmap; escríbenos si lo necesitas y te avisamos cuando salga.",
    },
    {
      q: "¿Pueden mis atletas registrar PRs por estación individual?",
      a: "Por ahora no hay ranking por estación. Los PRs y los rankings del gym funcionan por movimiento y por WOD, así que puedes dar de alta cada estación (SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps, RowErg, Farmers Carry, Sandbag Lunges, Wall Balls) como movimiento y seguir el progreso de cada atleta ahí.",
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
