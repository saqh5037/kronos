import {
  HERO_META,
  PRICING,
  FAQ_ITEMS,
  WHITE_LABEL_PALETTES,
} from "@/app/(landing)/_data/mock";

export const dynamic = "force-static";
export const revalidate = 3600;

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
    "Tu logo, color y nombre dominan la app en todos los tiers. Titanio elimina toda marca Kronos: dominio propio, emails propios y apps publicadas con tu nombre.",
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
  lines.push("## Reservar demo");
  lines.push("");
  lines.push(
    "30 días sin cargo. Sin tarjeta. Sin contrato anual. Te llamamos en menos de 24 horas hábiles para entender tu Box y armar el setup.",
  );
  lines.push("");
  lines.push("- Reservar demo: mailto:demo@kronos-fit.com");
  lines.push("- Hablar con ventas: mailto:ventas@kronos-fit.com");
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
