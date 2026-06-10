/** Pure helpers for the /atleta/plan page — exported separately to allow unit tests
 *  without importing the Next.js page module (which triggers server-action checks). */

export function goalMetricLabel(metric: string): string {
  switch (metric) {
    case "PR":
      return "PR";
    case "TONNAGE":
      return "Tonelaje";
    case "ATTENDANCE":
      return "Asistencia";
    case "BODY_COMPOSITION":
      return "Composición corporal";
    default:
      return "objetivo";
  }
}

export function formatDeadline(date: Date): string {
  return date.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Normalizes a raw goalId param: trims whitespace, returns null if empty. */
export function normalizeGoalId(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
