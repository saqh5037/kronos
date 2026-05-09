import { renderEmailLayout, escapeHtml } from "./_layout";

export function renderStaffInvitationEmail(args: {
  boxName: string;
  name: string | null;
  role: "COACH" | "STAFF";
  link: string;
}): string {
  const greeting = args.name ? `Hola ${escapeHtml(args.name)},` : "Hola,";
  const box = escapeHtml(args.boxName);
  const roleLabel = args.role === "COACH" ? "coach" : "staff";
  const link = args.link;

  const body = `
    <h1 style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:22px;font-weight:700;letter-spacing:-0.01em;color:#f5f5f7;margin:0 0 12px 0;">${greeting}</h1>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.6;color:#8a8a94;margin:0 0 24px 0;">
      <strong style="color:#f5f5f7;">${box}</strong> te invitó a sumarte como <strong style="color:#c8ff2d;">${roleLabel}</strong> en Kronos — la plataforma para programar clases, registrar PRs y manejar el día a día del Box.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
      <tr><td style="background:#c8ff2d;border-radius:999px;">
        <a href="${link}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#08080a;text-decoration:none;letter-spacing:0.01em;">Activar mi cuenta →</a>
      </td></tr>
    </table>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.6;color:#54545c;margin:0 0 12px 0;">
      El link expira en 14 días.
    </p>
    <p style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;line-height:1.5;color:#54545c;margin:16px 0 0 0;word-break:break-all;">
      ¿No funciona el botón? Pegá este link en tu navegador:<br><a href="${link}" style="color:#8a8a94;text-decoration:underline;">${link}</a>
    </p>
  `;

  return renderEmailLayout({
    preheader: `${args.boxName} te invitó a Kronos como ${roleLabel}.`,
    body,
  });
}
