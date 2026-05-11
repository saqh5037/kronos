/**
 * Layout base reusable para emails transaccionales de Kronos.
 *
 * Optimizado para clients restrictivos (Outlook, Apple Mail) usando tablas
 * y estilos inline. Tokens hex hardcoded porque emails no resuelven CSS
 * variables de la app — los hex se mantienen alineados con la paleta V3
 * "Cuarto Oscuro" (lima neon #c8ff2d sobre fondos #08080a / #14141a).
 */

import {
  isDominusPromoActive,
  promoDaysLeft,
  PROMO_EVENT_DATE,
} from "@/lib/dominus-promo";

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailLayoutInput = {
  preheader: string;
  body: string;
  /** Cuando true (default), inserta banner Dominus si la promo está activa. */
  showPromoBanner?: boolean;
};

export function renderEmailLayout(input: EmailLayoutInput): string {
  const { preheader, body, showPromoBanner = true } = input;
  const promo = showPromoBanner && isDominusPromoActive();
  const days = promoDaysLeft();

  const promoBanner = promo
    ? `
    <tr><td style="padding:0 24px 16px 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#1a1a08;border:1px solid #c8ff2d;border-radius:12px;">
        <tr><td style="padding:14px 18px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.5;color:#f5f5f7;">
          <div style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#c8ff2d;margin-bottom:4px;">Founding Box Dominus · ${days} día${days === 1 ? "" : "s"}</div>
          Oferta de lanzamiento válida solo el ${PROMO_EVENT_DATE} · lock-in de precio 12 meses + 3 meses gratis al pagar anual.
        </td></tr>
      </table>
    </td></tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>Kronos</title>
</head>
<body style="margin:0;padding:0;background:#08080a;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#f5f5f7;-webkit-font-smoothing:antialiased;">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#08080a;opacity:0;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#08080a;">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#0f1014;border:1px solid #1c1c24;border-radius:20px;overflow:hidden;">

      <tr><td style="padding:28px 28px 8px 28px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:22px;font-weight:700;letter-spacing:0.04em;color:#c8ff2d;">KRONOS</td>
            <td align="right" style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#54545c;">tu Box, tu sistema</td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:8px 28px 0 28px;"><div style="height:1px;background:#1c1c24;"></div></td></tr>

      ${promoBanner}

      <tr><td style="padding:24px 28px 8px 28px;">
        ${body}
      </td></tr>

      <tr><td style="padding:0 28px;"><div style="height:1px;background:#1c1c24;margin-top:24px;"></div></td></tr>

      <tr><td style="padding:18px 28px 28px 28px;font-family:'Inter',Arial,sans-serif;font-size:11px;line-height:1.6;color:#54545c;">
        <strong style="color:#8a8a94;">Kronos</strong> · kronos-fit.com · México<br>
        Recibes este correo porque alguien (esperamos que tú) lo solicitó desde Kronos. Si no fuiste tú, puedes ignorarlo sin preocupación.
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;
}
