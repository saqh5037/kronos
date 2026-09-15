/**
 * TimelineSection — intentionally not rendered.
 *
 * Audit 2026-09-15 (P1 dataviz, /atleta/perfil): "PROGRESO · ÚLTIMOS 90 DÍAS"
 * plotted kilograms and mm:ss on one line, "normalizados 0–100", with bars and
 * a line double-encoding the same series. A number that mixes a 120 kg squat
 * and a 41:20 Murph on one axis is not a trend, it is noise — and it was the
 * only "progress" chart on the profile, so it actively misinformed.
 *
 * Per-metric charts are the phase-2 replacement (one chart per movement /
 * per WOD, in the movement's own unit). Until those exist, the profile shows
 * nothing here rather than something untrue: `ScoresSection` already carries
 * the honest per-day activity chart, and `PRsSection` the real records.
 *
 * The component is kept (rather than deleted) so the route's Suspense layout
 * and any external import stay valid; `perfil/page.tsx` no longer mounts it.
 */

export async function TimelineSection() {
  return null;
}
