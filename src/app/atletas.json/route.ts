import { NextResponse } from "next/server";
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
    testimonials: [
      {
        quote: TESTIMONIAL_HERO.quote,
        attribution: TESTIMONIAL_HERO.attribution,
        note: "Ejemplo ilustrativo",
      },
      {
        quote: DUAL_QUOTES.a.quote,
        attribution: DUAL_QUOTES.a.attribution,
        note: "Ejemplo ilustrativo",
      },
      {
        quote: DUAL_QUOTES.b.quote,
        attribution: DUAL_QUOTES.b.attribution,
        note: "Ejemplo ilustrativo",
      },
    ],
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
