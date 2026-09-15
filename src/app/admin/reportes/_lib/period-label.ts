/**
 * Period labels for Reportes (audit 2026-09-15, S3/S4).
 *
 * The page printed "Septiembre De 2026" — a title-cased preposition produced by
 * a CSS `capitalize` over `toLocaleDateString`. One helper, one spelling, and a
 * unit test so it cannot drift back.
 */

const MONTH_YEAR = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

/** "septiembre 2026" — no preposition, no title case. */
export function monthYearLabel(date: Date): string {
  return MONTH_YEAR.format(date).replace(/\s+de\s+/i, " ");
}

/** "Últimos 12 meses" style label for a rolling window of months. */
export function rollingMonthsLabel(months: number): string {
  return `Últimos ${months} ${months === 1 ? "mes" : "meses"}`;
}

/**
 * How many of the surveyed athletes answered, as a share.
 * Returns null when nobody was surveyed — a rate over zero people is not 0 %.
 */
export function responseRate(
  answered: number,
  surveyed: number,
): number | null {
  if (surveyed <= 0) return null;
  return answered / surveyed;
}

/** Below this share the sample is too small to publish a box-wide number. */
export const READINESS_MIN_RESPONSE_RATE = 0.2;

export function hasEnoughReadinessData(
  answered: number,
  surveyed: number,
): boolean {
  const rate = responseRate(answered, surveyed);
  return rate !== null && rate >= READINESS_MIN_RESPONSE_RATE;
}

/** "1 de 42 respondieron" / "1 de 42 respondió" */
export function responseCountLabel(answered: number, surveyed: number): string {
  return `${answered} de ${surveyed} ${answered === 1 ? "respondió" : "respondieron"}`;
}
