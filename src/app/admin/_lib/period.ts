/**
 * Period label for page subtitles (audit 2026-09-15, systemic issue S4).
 *
 * `/admin/asistencia` printed "Últimos 7 días · 170 asistencias" while its
 * filter said "Últimos 30 días": the subtitle was a literal, not the active
 * filter. Every number that belongs to a range must be labelled by the SAME
 * range object the query used, through this function.
 */
import { RANGE_PRESET_LABELS, type DateRange } from "@/lib/dates";
import { formatDateShort } from "@/lib/format";

/** "Últimos 30 días" for a preset, "1 sep – 15 sep" for a custom range. */
export function periodLabel(range: DateRange, timeZone?: string): string {
  if (range.preset && range.preset in RANGE_PRESET_LABELS) {
    return RANGE_PRESET_LABELS[range.preset];
  }
  return `${formatDateShort(range.from, timeZone)} – ${formatDateShort(range.to, timeZone)}`;
}

/**
 * "Últimos 30 días · 170 asistencias" — the period always leads, so a KPI can
 * never be read without the range it was computed for.
 */
export function periodSubtitle(
  range: DateRange,
  count: number,
  singular: string,
  plural: string = `${singular}s`,
  timeZone?: string,
): string {
  const noun = count === 1 ? singular : plural;
  return `${periodLabel(range, timeZone)} · ${count} ${noun}`;
}
