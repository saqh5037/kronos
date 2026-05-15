import {
  HERO,
  BENEFIT_SKILLS,
  BENEFIT_WOD,
  TESTIMONIAL_HERO,
  WHY,
  DUAL_QUOTES,
  FINAL_CTA,
  FOOTER,
} from "@/app/(landing)/atletas/_data/copy";

export const dynamic = "force-static";
export const revalidate = 3600;

function renderMarkdown(): string {
  const lines: string[] = [];
  lines.push("# Kronos · Atletas");
  lines.push("");
  lines.push("> Tu progreso es el producto.");
  lines.push("");
  lines.push(`**${HERO.eyebrow}** — ${HERO.claimLineA} ${HERO.claimLineB}`);
  lines.push("");
  lines.push(HERO.sub);
  lines.push("");
  lines.push(`## ${BENEFIT_SKILLS.h2}`);
  lines.push("");
  lines.push(`*${BENEFIT_SKILLS.eyebrow}*`);
  lines.push("");
  lines.push(BENEFIT_SKILLS.body);
  lines.push("");
  lines.push(
    `**${BENEFIT_SKILLS.detail.label}:** ${BENEFIT_SKILLS.detail.value}`,
  );
  lines.push("");
  lines.push(`## ${BENEFIT_WOD.h2}`);
  lines.push("");
  lines.push(`*${BENEFIT_WOD.eyebrow}*`);
  lines.push("");
  lines.push(BENEFIT_WOD.body);
  lines.push("");
  lines.push(`**${BENEFIT_WOD.detail.label}:** ${BENEFIT_WOD.detail.value}`);
  lines.push("");
  lines.push("## Reseñas (ejemplos ilustrativos)");
  lines.push("");
  lines.push(`> "${TESTIMONIAL_HERO.quote}"`);
  lines.push(">");
  lines.push(`> — ${TESTIMONIAL_HERO.attribution}`);
  lines.push("");
  lines.push(`> "${DUAL_QUOTES.a.quote}"`);
  lines.push(">");
  lines.push(`> — ${DUAL_QUOTES.a.attribution}`);
  lines.push("");
  lines.push(`> "${DUAL_QUOTES.b.quote}"`);
  lines.push(">");
  lines.push(`> — ${DUAL_QUOTES.b.attribution}`);
  lines.push("");
  lines.push(`## ${WHY.h2Line1} ${WHY.h2Line2}`);
  lines.push("");
  lines.push(WHY.sub);
  lines.push("");
  lines.push(`### ${WHY.yesTitle}`);
  lines.push("");
  for (const item of WHY.yesItems) lines.push(`- ${item}`);
  lines.push("");
  lines.push(`### ${WHY.noTitle}`);
  lines.push("");
  for (const item of WHY.noItems) lines.push(`- ${item}`);
  lines.push("");
  lines.push(`## ${FINAL_CTA.h2Line1} ${FINAL_CTA.h2Line2}`);
  lines.push("");
  lines.push(FINAL_CTA.sub);
  lines.push("");
  lines.push("- Entrar: https://www.kronos-fit.com/login");
  lines.push(`- ${FINAL_CTA.ctaSecondaryLabel}: ${FINAL_CTA.ctaSecondaryHref}`);
  lines.push("");
  lines.push(`*${FINAL_CTA.footnote}*`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(FOOTER.copy);
  lines.push("");
  for (const l of FOOTER.links) {
    lines.push(`- ${l.label}: https://www.kronos-fit.com${l.href}`);
  }
  lines.push("");
  lines.push(
    `Para boxes (B2B): https://www.kronos-fit.com${FOOTER.coachLinkHref}`,
  );
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
