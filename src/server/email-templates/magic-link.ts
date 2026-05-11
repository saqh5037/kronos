import { renderEmailLayout, escapeHtml } from "./_layout";

/**
 * Email primario de auth atleta — código OTP de 6 dígitos como hero,
 * magic link tradicional como fallback secundario.
 *
 * Decisiones:
 *  - El código vive 1h y es reusable los primeros 5 min post-primer-uso —
 *    eso resuelve la fricción cross-browser en iPhone (Chrome ↔ Safari/PWA).
 *  - El link "Copiar código y abrir Kronos →" abre /atleta/otp-redirect, que
 *    copia el código al portapapeles y completa el login automáticamente.
 *  - El plain text incluye una línea con formato `@<host> #<code>` (Apple
 *    Origin-bound One-Time Codes) para que iOS Mail/Safari ofrezcan el código
 *    en la barra del teclado al tocar un input con autocomplete="one-time-code".
 */

function deriveOriginFromUrl(url: string): {
  origin: string;
  host: string;
} {
  try {
    const u = new URL(url);
    return { origin: u.origin, host: u.host };
  } catch {
    return { origin: "https://kronos-fit.com", host: "kronos-fit.com" };
  }
}

function buildOtpRedirectUrl(
  origin: string,
  email: string,
  code: string,
): string {
  const params = new URLSearchParams({ code, email });
  return `${origin}/login/otp?${params.toString()}`;
}

export function renderMagicLinkEmail(args: {
  email: string;
  url: string;
  code: string;
}): string {
  const email = escapeHtml(args.email);
  const url = args.url;
  const code = escapeHtml(args.code);
  const codePretty = `${code.slice(0, 3)} ${code.slice(3, 6)}`;
  const { origin } = deriveOriginFromUrl(url);
  const otpRedirect = buildOtpRedirectUrl(origin, args.email, args.code);

  const body = `
    <h1 style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:-0.01em;color:#f5f5f7;margin:0 0 12px 0;">Tu código para entrar</h1>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.6;color:#8a8a94;margin:0 0 24px 0;">
      Pedimos un acceso para <strong style="color:#f5f5f7;">${email}</strong>. Usa el código de abajo o toca el botón.
    </p>
    <a href="${otpRedirect}" target="_blank" style="display:block;text-decoration:none;margin:0 0 20px 0;padding:24px 20px;background:#0f1014;border:1px solid #c8ff2d;border-radius:16px;text-align:center;">
      <span style="display:block;font-family:'Inter',Arial,sans-serif;font-size:11px;line-height:1.4;color:#8a8a94;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Tu código</span>
      <span style="display:block;font-family:'IBM Plex Mono',Consolas,monospace;font-size:40px;font-weight:700;letter-spacing:0.18em;color:#c8ff2d;line-height:1;">${codePretty}</span>
    </a>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px 0;width:100%;">
      <tr><td align="center" style="background:#c8ff2d;border-radius:999px;">
        <a href="${otpRedirect}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#08080a;text-decoration:none;letter-spacing:0.01em;">Copiar código y abrir Kronos →</a>
      </td></tr>
    </table>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.6;color:#8a8a94;margin:0 0 16px 0;text-align:center;">
      O pega el código manualmente en la pantalla de inicio de sesión.
    </p>
    <div style="margin:24px 0 16px 0;padding:14px 16px;background:#0a0a0c;border:1px solid #1c1c24;border-radius:10px;">
      <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.5;color:#8a8a94;margin:0 0 6px 0;">
        ¿Prefieres un link tradicional?
      </p>
      <a href="${url}" target="_blank" style="font-family:'Inter',Arial,sans-serif;font-size:13px;color:#c8ff2d;text-decoration:underline;word-break:break-all;">Entrar con magic link</a>
    </div>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.6;color:#54545c;margin:0 0 12px 0;">
      El código vive 1 hora. Después del primer uso puedes meterlo en otro navegador (Chrome, Safari) durante 5 minutos — útil si tienes la PWA instalada en Safari pero abres el correo en Chrome.
    </p>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:11px;line-height:1.6;color:#54545c;margin:0;">
      Si no fuiste tú, ignora este correo — nadie va a entrar sin tu código.
    </p>
  `;

  return renderEmailLayout({
    preheader: `Tu código: ${codePretty}. Toca para copiar y entrar a Kronos como ${args.email}.`,
    body,
  });
}

export function renderMagicLinkText(args: {
  email: string;
  url: string;
  code: string;
}): string {
  const codePretty = `${args.code.slice(0, 3)} ${args.code.slice(3, 6)}`;
  const { origin, host } = deriveOriginFromUrl(args.url);
  const otpRedirect = buildOtpRedirectUrl(origin, args.email, args.code);

  return [
    `Tu código para entrar a Kronos: ${codePretty}`,
    ``,
    `Hola, recibimos una solicitud para iniciar sesión como ${args.email}.`,
    ``,
    `Código: ${codePretty}`,
    `(válido 1h. Reusable los primeros 5 min en otro navegador.)`,
    ``,
    `Toca para copiar y entrar:`,
    otpRedirect,
    ``,
    `O usa el magic link tradicional:`,
    args.url,
    ``,
    `Si no fuiste tú, ignora este correo.`,
    ``,
    `— Kronos · kronos-fit.com`,
    ``,
    // Apple Origin-bound One-Time Codes (RFC 8959-ish): iOS Mail/Safari
    // detecta esta línea cuando el host matchea y ofrece el código en la
    // barra del teclado al tocar un input con autocomplete="one-time-code".
    `@${host} #${args.code}`,
  ].join("\n");
}
