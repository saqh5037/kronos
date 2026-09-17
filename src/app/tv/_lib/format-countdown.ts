/**
 * TV-mode countdown formatting.
 *
 * Rule (audit 2026-09-15, public-auth review): the whiteboard rendered
 * "EN 257MIN", which nobody reads as four and a quarter hours. Minutes stay
 * minutes under an hour; past that they become hours and minutes.
 */

/**
 * "en 12 min" · "en 1 h" · "en 4 h 17 min" · "ahora" when it already started.
 */
export function formatMinutesUntil(minutes: number): string {
  const rounded = Math.round(minutes);
  if (!Number.isFinite(rounded) || rounded <= 0) return "ahora";
  if (rounded < 60) return `en ${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `en ${hours} h` : `en ${hours} h ${rest} min`;
}

/** "45 min" · "1 h" · "1 h 30 min" — class duration, no "en" prefix. */
export function formatDurationMinutes(minutes: number): string {
  const rounded = Math.round(minutes);
  if (!Number.isFinite(rounded) || rounded <= 0) return "0 min";
  if (rounded < 60) return `${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const rest = rounded % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
