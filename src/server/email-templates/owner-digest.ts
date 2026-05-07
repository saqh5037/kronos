import type { AthleteAtRiskRow } from "../owner-digest/compute";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatPriceMxn(cents: number): string {
  if (cents === 0) return "$0 MXN";
  const pesos = cents / 100;
  return `$${pesos.toLocaleString("es-MX", { maximumFractionDigits: 0 })} MXN`;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function deltaLabel(delta: number): string {
  if (delta > 0) return `+${delta} esta semana`;
  if (delta < 0) return `${delta} esta semana`;
  return "Sin cambios esta semana";
}

function deltaColor(delta: number): string {
  if (delta > 0) return "#19f08b"; // recovery green
  if (delta < 0) return "#ff5e5e"; // pr red
  return "#aaa";
}

function severityChip(severity: "high" | "med" | "low"): string {
  const map = {
    high: { bg: "#ff5e5e22", color: "#ff5e5e", label: "Alto riesgo" },
    med: { bg: "#ffa53d22", color: "#ffa53d", label: "Riesgo medio" },
    low: { bg: "#3aa3ff22", color: "#3aa3ff", label: "Riesgo bajo" },
  } as const;
  const s = map[severity];
  return `<span style="display: inline-block; padding: 2px 8px; border-radius: 999px; background: ${s.bg}; color: ${s.color}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${s.label}</span>`;
}

export function renderOwnerDigestEmail(args: {
  boxName: string;
  ownerName: string | null;
  monthlyRevenueCents: number;
  invoiceCount: number;
  activeAthletesCount: number;
  activeAthletesDelta: number;
  bookingsLastWeek: number;
  athletesAtRisk: AthleteAtRiskRow[];
  nextBillingDate: Date | null;
  ctaUrl: string;
}): string {
  const greeting = args.ownerName
    ? `Hola ${escapeHtml(args.ownerName)},`
    : "Hola,";
  const box = escapeHtml(args.boxName);

  const riskListHtml =
    args.athletesAtRisk.length === 0
      ? `<p style="font-size: 14px; color: #19f08b; margin: 0;">✓ Ningún atleta en riesgo esta semana.</p>`
      : args.athletesAtRisk
          .map(
            (r) => `
        <div style="padding: 12px 0; border-bottom: 1px solid #34393e;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px;">
            <strong style="font-size: 14px; color: #eaeaea;">${escapeHtml(r.name)}</strong>
            ${severityChip(r.severity)}
          </div>
          <p style="font-size: 12px; color: #aaa; margin: 4px 0 0 0;">
            ${r.reasons.map((reason) => escapeHtml(reason)).join(" · ")}
          </p>
        </div>`,
          )
          .join("");

  const nextBillingHtml = args.nextBillingDate
    ? `<p style="font-size: 13px; color: #aaa; margin: 16px 0 0 0;">
         Próxima facturación: <strong style="color: #eaeaea;">${formatDateShort(args.nextBillingDate)}</strong>
       </p>`
    : "";

  return `
<!DOCTYPE html>
<html><body style="font-family: system-ui, sans-serif; background: #1a1d20; color: #eaeaea; padding: 24px; margin: 0;">
  <div style="max-width: 560px; margin: 0 auto;">

    <div style="margin-bottom: 24px;">
      <p style="font-size: 12px; color: #3aa3ff; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Resumen semanal · Kronos</p>
      <h1 style="font-size: 26px; margin: 0 0 4px 0; color: #eaeaea;">${greeting}</h1>
      <p style="font-size: 15px; color: #aaa; margin: 0;">Esto fue lo que pasó en <strong style="color: #eaeaea;">${box}</strong> esta semana.</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="background: #2a2f33; border-radius: 12px; padding: 16px;">
        <p style="font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0;">Ingresos del mes</p>
        <p style="font-size: 22px; font-weight: 800; color: #19f08b; margin: 0;">${formatPriceMxn(args.monthlyRevenueCents)}</p>
        <p style="font-size: 12px; color: #aaa; margin: 4px 0 0 0;">${args.invoiceCount} cobro${args.invoiceCount === 1 ? "" : "s"}</p>
      </div>
      <div style="background: #2a2f33; border-radius: 12px; padding: 16px;">
        <p style="font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0;">Atletas activos</p>
        <p style="font-size: 22px; font-weight: 800; color: #eaeaea; margin: 0;">${args.activeAthletesCount}</p>
        <p style="font-size: 12px; color: ${deltaColor(args.activeAthletesDelta)}; margin: 4px 0 0 0;">${deltaLabel(args.activeAthletesDelta)}</p>
      </div>
    </div>

    <div style="background: #2a2f33; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
      <p style="font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 6px 0;">Asistencias últimos 7 días</p>
      <p style="font-size: 22px; font-weight: 800; color: #3aa3ff; margin: 0;">${args.bookingsLastWeek}</p>
    </div>

    <div style="background: #2a2f33; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 11px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 12px 0;">Atletas en riesgo</p>
      ${riskListHtml}
    </div>

    <p style="text-align: center; margin: 24px 0;">
      <a href="${args.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #3aa3ff, #19f08b); color: #0b0d0f; padding: 14px 28px; border-radius: 999px; font-weight: 700; text-decoration: none;">
        Abrir Kronos
      </a>
    </p>

    ${nextBillingHtml}

    <p style="font-size: 11px; color: #777; text-align: center; margin-top: 24px;">
      Este resumen llega cada lunes. ¿Querés frenar estos emails? Respondé este mensaje.
    </p>
  </div>
</body></html>
`;
}
