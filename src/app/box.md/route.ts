import {
  HERO_META,
  PRICING,
  FAQ_ITEMS,
  WHITE_LABEL_PALETTES,
} from "@/app/(landing)/_data/mock";
import {
  CTA_TRIAL_HREF,
  CTA_TRIAL_LABEL,
  CTA_WHATSAPP_HREF,
  CTA_WHATSAPP_LABEL,
  TRIAL_DAYS,
} from "@/app/(landing)/_data/cta";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const dynamic = "force-static";
export const revalidate = 3600;

const SITE = "https://www.kronos-fit.com";

/**
 * A markdown document has no page to anchor into, so a relative href or a bare
 * `#section-form` fragment — which is what the WhatsApp CTA falls back to when
 * the support number is not configured — is a link nothing can follow. Every
 * link here resolves against the site origin.
 */
function absolute(href: string): string {
  if (/^(https?:\/\/|mailto:)/.test(href)) return href;
  return href.startsWith("#") ? `${SITE}/box${href}` : `${SITE}${href}`;
}

function renderMarkdown(): string {
  const lines: string[] = [];
  lines.push("# Kronos para Boxes");
  lines.push("");
  lines.push("> Software invisible para tu CrossFit Box.");
  lines.push("");
  lines.push(
    "Reservas, WODs, pagos, asistencia, comunicación y admin en una sola app, en español, con tu logo y tu color. Diseñada para CrossFit en LATAM.",
  );
  lines.push("");
  lines.push(`*${HERO_META.strip}*`);
  lines.push("");
  lines.push("## Planes");
  lines.push("");
  for (const tier of PRICING) {
    lines.push(
      `### ${tier.name} — ${tier.price} ${tier.unit}${tier.featured ? " · Recomendado" : ""}`,
    );
    lines.push("");
    lines.push(tier.desc);
    lines.push("");
    for (const f of tier.features) lines.push(`- ${f}`);
    lines.push("");
    lines.push(`**CTA:** ${tier.cta}`);
    lines.push("");
  }
  lines.push("## White-label");
  lines.push("");
  lines.push(
    "Tu logo, color y nombre aparecen en la app en todos los planes. Dominio propio, correos desde tu dominio y apps publicadas con tu nombre están en el roadmap; hoy no se venden como incluidos.",
  );
  lines.push("");
  lines.push("### Paletas demo");
  lines.push("");
  for (const p of WHITE_LABEL_PALETTES) {
    lines.push(`- **${p.name}** (\`${p.hex}\`) — ${p.caption}`);
  }
  lines.push("");
  lines.push("## Preguntas frecuentes");
  lines.push("");
  for (const f of FAQ_ITEMS) {
    lines.push(`### ${f.question}`);
    lines.push("");
    lines.push(f.answer);
    lines.push("");
  }
  // Same two actions the page offers, same labels, same trial length. The
  // section used to be titled "Reservar demo" and pointed at a demo desk and a
  // sales inbox that do not exist for a self-serve product; it also quoted 30
  // trial days against the 14 the product grants (audit 2026-09-15).
  lines.push("## Empezar");
  lines.push("");
  lines.push(
    `${TRIAL_DAYS} días sin cargo. Sin tarjeta. Sin contrato anual. Te das de alta tú mismo y el Box queda listo en minutos.`,
  );
  lines.push("");
  lines.push(`- ${CTA_TRIAL_LABEL}: ${absolute(CTA_TRIAL_HREF)}`);
  lines.push(`- ${CTA_WHATSAPP_LABEL}: ${absolute(CTA_WHATSAPP_HREF)}`);
  lines.push(`- Escríbenos: mailto:${SUPPORT_EMAIL}`);
  lines.push("");
  lines.push("*TU DATA ES TUYA POR CONTRATO*");
  lines.push("");
  return lines.join("\n");
}

export function GET() {
  return new Response(renderMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
}
