import { PRICING, FAQ_ITEMS } from "@/app/(landing)/_data/mock";

const BASE = "https://www.kronos-fit.com";

function priceToNumber(price: string): number {
  // "$2,500" -> 2500
  return Number(price.replace(/[^0-9]/g, ""));
}

export default function BoxJsonLd() {
  const offers = PRICING.map((tier) => ({
    "@type": "Offer",
    name: tier.name,
    description: tier.desc,
    price: priceToNumber(tier.price),
    priceCurrency: "MXN",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: priceToNumber(tier.price),
      priceCurrency: "MXN",
      unitText: "MONTH",
      billingIncrement: 1,
    },
    availability: "https://schema.org/InStock",
    url: `${BASE}/box#pricing-${tier.name.toLowerCase()}`,
  }));

  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${BASE}/box#webpage`,
      url: `${BASE}/box`,
      name: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
      description:
        "Reservas, WODs, pagos, asistencia y admin en una sola app, en español, con tu logo y tu color. Para dueños de CrossFit Box en LATAM.",
      inLanguage: "es-MX",
      isPartOf: { "@id": `${BASE}/#website` },
      about: { "@id": `${BASE}/box#software` },
      breadcrumb: { "@id": `${BASE}/box#breadcrumbs` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${BASE}/box#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
        {
          "@type": "ListItem",
          position: 2,
          name: "Para Boxes",
          item: `${BASE}/box`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "@id": `${BASE}/box#software`,
      name: "Kronos para Boxes",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Gym Management Software",
      operatingSystem: "Web, iOS, Android",
      url: `${BASE}/box`,
      description:
        "Software invisible para CrossFit Boxes: reservas con waitlist, WODs, pagos (Stripe, Mercado Pago, OXXO, SPEI), asistencia, admin de operación y white-label real.",
      featureList: [
        "Reservas con waitlist FIFO",
        "WOD del día + biblioteca",
        "Control de asistencia (QR + manual)",
        "Pagos Stripe + Mercado Pago + OXXO + SPEI",
        "Cobranza automatizada",
        "White-label visual",
        "Multi-tenant cross-Box",
        "Admin con MRR, churn y ocupación",
      ],
      offers: offers,
      provider: { "@id": `${BASE}/#org` },
      inLanguage: "es-MX",
      audience: { "@type": "Audience", audienceType: "CrossFit Box Owner" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "@id": `${BASE}/box#product`,
      name: "Kronos para Boxes",
      brand: { "@id": `${BASE}/#org` },
      category: "Software/CrossFit/GymManagement",
      offers: {
        "@type": "AggregateOffer",
        offerCount: PRICING.length,
        lowPrice: Math.min(...PRICING.map((p) => priceToNumber(p.price))),
        highPrice: Math.max(...PRICING.map((p) => priceToNumber(p.price))),
        priceCurrency: "MXN",
        offers,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${BASE}/box#faq`,
      mainEntity: FAQ_ITEMS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
