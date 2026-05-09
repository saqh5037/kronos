import { renderEmailLayout, escapeHtml } from "./_layout";

export function renderMagicLinkEmail(args: {
  email: string;
  url: string;
  code: string;
}): string {
  const email = escapeHtml(args.email);
  const url = args.url;
  const code = escapeHtml(args.code);
  // Formato visual "123 456" para que sea más fácil de leer y dictar.
  const codePretty = `${code.slice(0, 3)} ${code.slice(3, 6)}`;

  const body = `
    <h1 style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:-0.01em;color:#f5f5f7;margin:0 0 12px 0;">Tu enlace para entrar</h1>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.6;color:#8a8a94;margin:0 0 24px 0;">
      Recibimos una solicitud para iniciar sesión como <strong style="color:#f5f5f7;">${email}</strong>. Tocá el botón para entrar a Kronos.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
      <tr><td style="background:#c8ff2d;border-radius:999px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#08080a;text-decoration:none;letter-spacing:0.01em;">Entrar a Kronos →</a>
      </td></tr>
    </table>
    <div style="margin:0 0 24px 0;padding:16px 20px;background:#0f1014;border:1px solid #1c1c24;border-radius:12px;">
      <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.5;color:#8a8a94;margin:0 0 8px 0;">
        ¿El botón no funciona? Usá este código en la pantalla "Usar código en su lugar":
      </p>
      <p style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:28px;font-weight:700;letter-spacing:0.15em;color:#c8ff2d;margin:0;text-align:center;">
        ${codePretty}
      </p>
    </div>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.6;color:#54545c;margin:0 0 12px 0;">
      El enlace y el código expiran en 24 horas y solo se pueden usar una vez. Si no fuiste vos, ignorá este correo — nadie va a entrar sin tu código ni tu link.
    </p>
    <p style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:1.5;color:#54545c;margin:16px 0 0 0;word-break:break-all;">
      ¿No funciona el botón? Pegá este link en tu navegador:<br><a href="${url}" style="color:#8a8a94;text-decoration:underline;">${url}</a>
    </p>
  `;

  return renderEmailLayout({
    preheader: `Tu código: ${codePretty}. O tocá el enlace para entrar a Kronos como ${args.email}.`,
    body,
  });
}

export function renderMagicLinkText(args: {
  email: string;
  url: string;
  code: string;
}): string {
  const codePretty = `${args.code.slice(0, 3)} ${args.code.slice(3, 6)}`;
  return [
    `Tu enlace para entrar a Kronos`,
    ``,
    `Hola, recibimos una solicitud para iniciar sesión como ${args.email}.`,
    ``,
    `Entrá con este enlace (expira en 24h, un solo uso):`,
    args.url,
    ``,
    `O usá este código si el link no funciona: ${codePretty}`,
    ``,
    `Si no fuiste vos, ignorá este correo.`,
    ``,
    `— Kronos · kronos-fit.com`,
  ].join("\n");
}
