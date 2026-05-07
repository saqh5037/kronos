function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderPaymentFailedEmail(args: {
  boxName: string;
  ownerName: string | null;
  ctaUrl: string;
  graceDays: number;
}): string {
  const greeting = args.ownerName
    ? `Hola ${escapeHtml(args.ownerName)},`
    : "Hola,";
  const box = escapeHtml(args.boxName);
  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 32px;">
  <div style="max-width: 480px; margin: 0 auto; background: #2a2f33; border-radius: 16px; padding: 32px;">
    <p style="font-size: 12px; color: #ffa53d; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Pago pendiente</p>
    <h1 style="font-size: 22px; margin: 0 0 16px 0;">${greeting}</h1>
    <p style="font-size: 16px; line-height: 1.5; margin: 0 0 16px 0;">
      No pudimos cobrar tu suscripción a Kronos para <strong>${box}</strong>. Tenés <strong>${args.graceDays} días</strong> para actualizar tu método de pago antes de que el Box quede bloqueado.
    </p>
    <p style="margin: 24px 0;">
      <a href="${args.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #ffa53d, #ff5e5e); color: #0b0d0f; padding: 14px 24px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Actualizar método de pago
      </a>
    </p>
    <p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
      Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
      <a href="${args.ctaUrl}" style="color: #3aa3ff;">${args.ctaUrl}</a>
    </p>
    <p style="font-size: 12px; color: #777; margin-top: 24px;">¿Necesitás ayuda? Respondé este email y te acompañamos.</p>
  </div>
</body></html>
`;
}
