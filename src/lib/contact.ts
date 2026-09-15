/**
 * The one address a person writes to when they need a human at Kronos.
 *
 * The 2026-09-15 audit found five addresses across the surface —
 * `hola@`, `contacto@`, `demo@`, `ventas@` and `soporte@` — handed out by
 * whichever screen happened to render first. Three of them were pure
 * invention: there is no demo desk and there is no sales team, so a `mailto:`
 * promising one is a dead end dressed up as a channel.
 *
 * From here on every product surface imports `SUPPORT_EMAIL`. It matches the
 * `LEADS_EMAIL` default in `src/app/api/leads/route.ts` and `CONTACT_EMAIL` in
 * `src/app/(landing)/_data/cta.ts`, which is the same address by design: one
 * inbox, one promise.
 */
export const SUPPORT_EMAIL = "hola@kronos-fit.com";

/** `mailto:` for `SUPPORT_EMAIL`, with an optional pre-filled subject. */
export function supportMailto(subject?: string): string {
  const base = `mailto:${SUPPORT_EMAIL}`;
  return subject ? `${base}?subject=${encodeURIComponent(subject)}` : base;
}
