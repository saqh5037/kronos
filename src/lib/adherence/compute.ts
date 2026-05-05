/**
 * Pure helpers for adherence ratios. No DB, no auth.
 *
 * Adherence is "did the athlete commit and show up" — a continuous signal
 * (vs binary streak). Three complementary ratios:
 *
 * - bookingRate     = booked / offered      (engagement: are they reserving?)
 * - attendanceRate  = attended / offered    (raw consistency)
 * - showUpRate      = attended / booked     (commitment: do they honor reservations?)
 *
 * `offered` = classes available in the period (filter is up to the caller —
 * typically all active classes of the box in window).
 */

export type AdherenceInput = {
  booked: number;
  attended: number;
  offered: number;
};

export type AdherenceRatios = {
  attendanceRate: number;
  bookingRate: number;
  showUpRate: number;
};

function safeRatio(num: number, den: number): number {
  if (den <= 0) return 0;
  const r = num / den;
  return Math.round(r * 1000) / 1000;
}

export function computeAdherence(input: AdherenceInput): AdherenceRatios {
  return {
    attendanceRate: safeRatio(input.attended, input.offered),
    bookingRate: safeRatio(input.booked, input.offered),
    showUpRate: safeRatio(input.attended, input.booked),
  };
}

/**
 * Delta in percentage points between two periods.
 * Useful for the MetricDelta chip already used in the UI.
 */
export function adherenceDelta(
  current: AdherenceRatios,
  previous: AdherenceRatios,
): AdherenceRatios {
  return {
    attendanceRate:
      Math.round((current.attendanceRate - previous.attendanceRate) * 1000) /
      1000,
    bookingRate:
      Math.round((current.bookingRate - previous.bookingRate) * 1000) / 1000,
    showUpRate:
      Math.round((current.showUpRate - previous.showUpRate) * 1000) / 1000,
  };
}
