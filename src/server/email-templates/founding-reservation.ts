import { TRIAL_DAYS } from "@/app/(landing)/_data/cta";
import { SUPPORT_EMAIL } from "@/lib/contact";
import { renderEmailLayout, escapeHtml } from "./_layout";
import { formatDateFull } from "@/lib/format";

function formatMxn(cents: number): string {
  const pesos = cents / 100;
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(pesos);
}

export function renderFoundingReservationEmail(args: {
  ownerName: string;
  email: string;
  boxName: string;
  slug: string;
  billingCycle: "monthly" | "annual";
  priceMxnCents: number;
  trialEndsAt: Date;
}): string {
  const monthly = formatMxn(args.priceMxnCents);
  const annualBeforeBonus = formatMxn(args.priceMxnCents * 12);
  const isAnnual = args.billingCycle === "annual";
  const cycleLabel = isAnnual
    ? `Anual upfront — ${annualBeforeBonus} (15 meses, 3 gratis)`
    : `Mensual — ${monthly}/mes con lock-in 12 meses`;

  const body = `
    <h1 style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:24px;font-weight:700;letter-spacing:-0.01em;color:#f5f5f7;margin:0 0 12px 0;">Listo, ${escapeHtml(args.ownerName)}.</h1>
    <p style="font-family:'Inter',Arial,sans-serif;font-size:15px;line-height:1.6;color:#8a8a94;margin:0 0 20px 0;">
      Tu <strong style="color:#c8ff2d;">Founding Box Dominus</strong> quedó reservado. El precio queda lockeado por 12 meses sin importar cuándo proceses el pago.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#14141a;border:1px solid #1c1c24;border-radius:12px;margin:0 0 24px 0;">
      <tr><td style="padding:18px 20px;font-family:'Inter',Arial,sans-serif;font-size:13px;line-height:1.7;color:#8a8a94;">
        <div style="font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#7d7d87;margin-bottom:8px;">Tu reserva</div>
        <div style="margin-bottom:6px;"><span style="color:#7d7d87;">Box</span> &nbsp; <strong style="color:#f5f5f7;">${escapeHtml(args.boxName)}</strong></div>
        <div style="margin-bottom:6px;"><span style="color:#7d7d87;">Identificador</span> &nbsp; <strong style="color:#f5f5f7;">${escapeHtml(args.slug)}</strong></div>
        <div style="margin-bottom:6px;"><span style="color:#7d7d87;">Plan</span> &nbsp; <strong style="color:#f5f5f7;">${cycleLabel}</strong></div>
        <div><span style="color:#7d7d87;">Trial activo hasta</span> &nbsp; <strong style="color:#f5f5f7;">${formatDateFull(args.trialEndsAt)}</strong></div>
      </td></tr>
    </table>

    <p style="font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:1.6;color:#f5f5f7;margin:0 0 12px 0;font-weight:600;">¿Qué sigue?</p>
    <ol style="font-family:'Inter',Arial,sans-serif;font-size:14px;line-height:1.7;color:#8a8a94;margin:0 0 24px 0;padding-left:20px;">
      <li><strong style="color:#f5f5f7;">Vas a recibir un magic link</strong> en otro correo para entrar a tu Box. Ya puedes explorar el sistema ${TRIAL_DAYS} días gratis.</li>
      <li><strong style="color:#f5f5f7;">El 23 de mayo</strong> te mandamos el link de pago de MercadoPago. El precio se mantiene lockeado.</li>
      <li><strong style="color:#f5f5f7;">Onboarding 1-a-1</strong>: vamos a coordinar una sesión privada para configurar tu Box (horarios, atletas, plan de membresías).</li>
    </ol>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px 0;">
      <tr><td style="background:#c8ff2d;border-radius:999px;">
        <a href="https://www.kronos-fit.com/admin" target="_blank" style="display:inline-block;padding:14px 28px;font-family:'Inter',Arial,sans-serif;font-size:14px;font-weight:700;color:#08080a;text-decoration:none;letter-spacing:0.01em;">Entrar a mi Box</a>
      </td></tr>
    </table>

    <p style="font-family:'Inter',Arial,sans-serif;font-size:12px;line-height:1.6;color:#7d7d87;margin:0;">
      ¿Dudas? Responde este correo y te contestamos directo. También puedes escribirnos a <a href="mailto:${SUPPORT_EMAIL}" style="color:#8a8a94;text-decoration:underline;">${SUPPORT_EMAIL}</a>.
    </p>
  `;

  return renderEmailLayout({
    preheader: `${args.boxName} reservado · ${cycleLabel} · trial ${TRIAL_DAYS} días gratis.`,
    body,
  });
}
