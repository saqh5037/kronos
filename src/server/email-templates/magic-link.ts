function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMagicLinkEmail(args: {
  email: string;
  url: string;
}): string {
  const email = escapeHtml(args.email);
  const url = args.url;

  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">Tu enlace para entrar a Kronos</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0; color: #c0c0c0;">
      Hola, recibimos una solicitud para iniciar sesión como <strong>${email}</strong>.
    </p>
    <p style="margin: 24px 0;">
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #c8ff2d, #a8d726); color: #08080a; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Entrar a Kronos
      </a>
    </p>
    <p style="font-size: 13px; color: #888; line-height: 1.5; margin: 24px 0 0 0;">
      Este enlace expira en 24 horas y solo se puede usar una vez. Si no fuiste vos, podés ignorar este correo — nadie va a entrar sin hacer clic acá.
    </p>
    <p style="font-size: 12px; color: #666; word-break: break-all; margin: 16px 0 0 0;">
      ¿No funciona el botón? Pegá este link en tu navegador:<br>${url}
    </p>
  </div>
</body></html>
  `.trim();
}

export function renderMagicLinkText(args: {
  email: string;
  url: string;
}): string {
  return [
    `Tu enlace para entrar a Kronos`,
    ``,
    `Hola, recibimos una solicitud para iniciar sesión como ${args.email}.`,
    ``,
    `Entrá con este enlace (expira en 24h, un solo uso):`,
    args.url,
    ``,
    `Si no fuiste vos, ignorá este correo.`,
  ].join("\n");
}
