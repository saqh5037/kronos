/**
 * Single source of truth for the trial length, the two site-wide CTAs and the
 * one contact address.
 *
 * Rule (audit 2026-09-15, public-auth review): the surface had five CTA labels
 * for two actions and quoted 14 days in the hero against 30 days in pricing.
 * Every trial mention and every CTA label on the public surface now comes from
 * here, so the number can never drift again.
 */

/** The one trial length. Self-serve, no card. */
export const TRIAL_DAYS = 14;

/** Lead-form anchor on /box — the fallback target when WhatsApp is not wired. */
export const LEAD_FORM_ANCHOR = "#section-form";

/** The one contact address (matches the `LEADS_EMAIL` default in the API). */
export const CONTACT_EMAIL = "hola@kronos-fit.com";

/** Primary CTA: self-serve trial. The only label allowed for `/signup`. */
export const CTA_TRIAL_LABEL = `Empezar prueba de ${TRIAL_DAYS} días`;

/** Primary CTA target. */
export const CTA_TRIAL_HREF = "/signup";

/** Secondary CTA: assisted path. The only label allowed for the WhatsApp link. */
export const CTA_WHATSAPP_LABEL = "Hablar por WhatsApp";

/**
 * Builds the `wa.me` URL from a raw phone value.
 *
 * Returns `null` when the input has no digits, so callers can fall back to the
 * lead-form anchor instead of rendering a broken link.
 */
export function buildWhatsappUrl(
  rawNumber: string | undefined | null,
  message?: string,
): string | null {
  const digits = (rawNumber ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * The secondary CTA target: WhatsApp when `NEXT_PUBLIC_WHATSAPP_SUPPORT` is
 * configured, otherwise the lead form on the same page.
 */
export function whatsappHrefOrAnchor(
  rawNumber: string | undefined | null,
  message?: string,
): string {
  return buildWhatsappUrl(rawNumber, message) ?? LEAD_FORM_ANCHOR;
}

/** Read at module scope so the client bundle inlines the public env var. */
export const WHATSAPP_SUPPORT = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT ?? "";

/** Resolved secondary CTA href for the box landing. */
export const CTA_WHATSAPP_HREF = whatsappHrefOrAnchor(
  WHATSAPP_SUPPORT,
  "Hola, tengo un box y quiero probar Kronos.",
);
