/**
 * Dominus 23-may launch promo — feature flag central.
 *
 * El evento de dominus-mx.com el 23 de mayo es el lanzamiento oficial de
 * Kronos con una oferta limitada (lock-in de precio fundador 12 meses + plan
 * "Founding Box Dominus" + 3 meses gratis al pagar anual).
 *
 * Este helper centraliza la fecha de corte: un solo lugar para apagar la
 * promo si se cancela el evento o se decide extender. Se usa en landing,
 * emails, página de reserva, y el plan SaasPlan exclusivo.
 */

const PROMO_END = new Date("2026-05-23T23:59:59-06:00").getTime();

export const PROMO_PLAN_SLUG = "dominus-founding";
export const PROMO_EVENT_DATE = "23 de mayo de 2026";
export const PROMO_EVENT_URL = "https://dominus-mx.com";

export function isDominusPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < PROMO_END;
}

export function promoDaysLeft(now: Date = new Date()): number {
  const ms = PROMO_END - now.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}
