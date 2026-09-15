import { NextResponse } from "next/server";
import {
  HERO,
  BENEFIT_SKILLS,
  BENEFIT_WOD,
  WHY,
  FINAL_CTA,
  FOOTER,
} from "@/app/(landing)/atletas/_data/copy";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const payload = {
    page: "/atletas",
    audience: "athlete",
    locale: "es-MX",
    updatedAt: new Date().toISOString(),
    brand: {
      name: "Kronos",
      url: "https://www.kronos-fit.com",
      tagline: "Tu progreso es el producto.",
    },
    hero: {
      eyebrow: HERO.eyebrow,
      claim: `${HERO.claimLineA} ${HERO.claimLineB}`,
      sub: HERO.sub,
    },
    benefits: [
      {
        slug: "skills",
        eyebrow: BENEFIT_SKILLS.eyebrow,
        title: BENEFIT_SKILLS.h2,
        body: BENEFIT_SKILLS.body,
        detail: BENEFIT_SKILLS.detail,
      },
      {
        slug: "wod",
        eyebrow: BENEFIT_WOD.eyebrow,
        title: BENEFIT_WOD.h2,
        body: BENEFIT_WOD.body,
        detail: BENEFIT_WOD.detail,
      },
    ],
    // No `testimonials` key. There are no real athlete quotes with signed
    // consent, and the invented ones were emptied out upstream — which left
    // this endpoint publishing three blank quotes under an "ejemplo
    // ilustrativo" note (audit 2026-09-15, public-truth review). An absent key
    // is honest; an empty array of fake reviews is not. When real quotes exist,
    // add `TESTIMONIALS` to the copy module and read it here.
    why: {
      title: `${WHY.h2Line1} ${WHY.h2Line2}`,
      sub: WHY.sub,
      does: WHY.yesItems,
      doesNot: WHY.noItems,
    },
    finalCta: {
      claim: `${FINAL_CTA.h2Line1} ${FINAL_CTA.h2Line2}`,
      sub: FINAL_CTA.sub,
      primary: { label: "Entrar", href: "/login" },
      secondary: {
        label: FINAL_CTA.ctaSecondaryLabel,
        href: FINAL_CTA.ctaSecondaryHref,
      },
      footnote: FINAL_CTA.footnote,
    },
    footer: {
      copy: FOOTER.copy,
      links: FOOTER.links,
      crossLink: { label: FOOTER.coachLinkLabel, href: FOOTER.coachLinkHref },
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
}
