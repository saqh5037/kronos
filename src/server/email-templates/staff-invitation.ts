function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">${greeting}</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      ${box} te invitó a sumarte como <strong>${roleLabel}</strong> en <strong>Kronos</strong> — la plataforma que usan para programar clases, registrar PRs y manejar el día a día del Box.
    </p>
    <p style="margin: 24px 0;">
      <a href="${link}" style="display: inline-block; background: linear-gradient(135deg, #3aa3ff, #19f08b); color: #0b0d0f; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Activar mi cuenta
      </a>
    </p>
    <p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
      Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
      <a href="${link}" style="color: #3aa3ff;">${link}</a>
    </p>
    <p style="font-size: 12px; color: #777; margin-top: 24px;">El link expira en 14 días.</p>
  </div>
</body></html>
`;
}
