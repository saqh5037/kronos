import { NextResponse } from "next/server";
import {
  HERO_META,
  PRICING,
  FAQ_ITEMS,
  WHITE_LABEL_PALETTES,
  OWNER_KPIS,
} from "@/app/(landing)/_data/mock";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  const payload = {
    page: "/box",
    audience: "box-owner",
    locale: "es-MX",
    updatedAt: new Date().toISOString(),
    brand: {
      name: "Kronos",
      url: "https://www.kronos-fit.com",
      tagline: "Software invisible para tu CrossFit Box.",
    },
    hero: {
      claim: "Software invisible para tu CrossFit Box.",
      sub: "Reservas, WODs, pagos, racha y admin en una sola app, en español, con tu logo y tu color. Diseñada para CrossFit en México.",
      strip: HERO_META.strip,
    },
    ownerKpisExample: OWNER_KPIS,
    pricing: PRICING.map((tier) => ({
      name: tier.name,
      price: tier.price,
      unit: tier.unit,
      currency: "MXN",
      billingPeriod: "month",
      description: tier.desc,
      featured: tier.featured ?? false,
      features: tier.features,
    })),
    whiteLabel: {
      summary:
        "Tu logo, color y nombre dominan la app en todos los tiers. Titanio elimina toda marca Kronos.",
      palettesExamples: WHITE_LABEL_PALETTES,
    },
    faq: FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer })),
    cta: {
      primary: { label: "Reservar demo", href: "mailto:demo@kronos.app" },
      secondary: {
        label: "Hablar con ventas",
        href: "mailto:ventas@kronos.app",
      },
      trial: "30 días sin cargo. Sin tarjeta. Sin contrato anual.",
    },
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "index, follow",
    },
  });
}
