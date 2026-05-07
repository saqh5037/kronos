function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderSubscriptionExpiredEmail(args: {
  boxName: string;
  ownerName: string | null;
  ctaUrl: string;
}): string {
  const greeting = args.ownerName
    ? `Hola ${escapeHtml(args.ownerName)},`
    : "Hola,";
  const box = escapeHtml(args.boxName);
  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <p style="font-size: 12px; color: #ff5e5e; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Acceso bloqueado</p>
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">${greeting}</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      Tu suscripción a Kronos para <strong>${box}</strong> expiró. Tu Box quedó en modo lectura — tus atletas no pueden reservar ni hacer check-in hasta que reactives.
    </p>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      <strong>Tus datos siguen acá esperándote.</strong> Reactivá cuando quieras y todo vuelve a la normalidad.
    </p>
    <p style="margin: 24px 0;">
      <a href="${args.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #3aa3ff, #19f08b); color: #0b0d0f; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Reactivar suscripción
      </a>
    </p>
    <p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
      Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
      <a href="${args.ctaUrl}" style="color: #3aa3ff;">${args.ctaUrl}</a>
    </p>
  </div>
</body></html>
`;
}
