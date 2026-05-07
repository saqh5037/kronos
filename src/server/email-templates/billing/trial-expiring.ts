function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderTrialExpiringEmail(args: {
  boxName: string;
  ownerName: string | null;
  ctaUrl: string;
  daysRemaining: number;
}): string {
  const greeting = args.ownerName
    ? `Hola ${escapeHtml(args.ownerName)},`
    : "Hola,";
  const box = escapeHtml(args.boxName);
  const daysLabel =
    args.daysRemaining === 1 ? "1 día" : `${args.daysRemaining} días`;
  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <p style="font-size: 12px; color: #3aa3ff; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Trial por terminar</p>
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">${greeting}</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      Tu trial de Kronos para <strong>${box}</strong> termina en <strong>${daysLabel}</strong>. Activá una suscripción ahora y mantené tu Box online sin interrupciones.
    </p>
    <p style="margin: 24px 0;">
      <a href="${args.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #3aa3ff, #19f08b); color: #0b0d0f; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Activar suscripción
      </a>
    </p>
    <p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
      Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
      <a href="${args.ctaUrl}" style="color: #3aa3ff;">${args.ctaUrl}</a>
    </p>
    <p style="font-size: 12px; color: #777; margin-top: 24px;">¿Tenés dudas sobre los planes? Respondé este email y te ayudamos a elegir.</p>
  </div>
</body></html>
`;
}
