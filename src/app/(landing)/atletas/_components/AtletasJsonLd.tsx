import { HERO, BENEFIT_SKILLS, BENEFIT_WOD, WHY } from "../_data/copy";

const BASE = "https://www.kronos-fit.com";

export default function AtletasJsonLd() {
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE}/#org`,
      name: "Kronos",
      url: BASE,
      logo: `${BASE}/icon-512.png`,
      slogan: "Tu progreso es el producto.",
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      url: BASE,
      name: "Kronos",
      inLanguage: "es-MX",
      publisher: { "@id": `${BASE}/#org` },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${BASE}/atletas#webpage`,
      url: `${BASE}/atletas`,
      name: "Kronos Atletas — La app de CrossFit que entrena contigo",
      description: HERO.sub,
      inLanguage: "es-MX",
      isPartOf: { "@id": `${BASE}/#website` },
      about: { "@id": `${BASE}/atletas#service` },
      breadcrumb: { "@id": `${BASE}/atletas#breadcrumbs` },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${BASE}/atletas#breadcrumbs`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: BASE },
        {
          "@type": "ListItem",
          position: 2,
          name: "Atletas",
          item: `${BASE}/atletas`,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${BASE}/atletas#service`,
      name: "Kronos para Atletas de CrossFit",
      provider: { "@id": `${BASE}/#org` },
      areaServed: ["MX", "CO", "PE", "AR"],
      serviceType: "Fitness tracking app",
      audience: { "@type": "Audience", audienceType: "CrossFit Athlete" },
      description:
        "App gratuita para atletas de CrossFit: track de PRs, reservas en tu box, skills con coach IA y foto del pizarrón con detección automática de score. Funciona aunque tu Box todavía no use Kronos.",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "MXN",
        availability: "https://schema.org/InStock",
        eligibleRegion: ["MX", "CO", "PE", "AR"],
        category: "Free",
        url: `${BASE}/atleta-signup`,
      },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Funciones para atletas",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: BENEFIT_SKILLS.h2,
              description: BENEFIT_SKILLS.body,
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: BENEFIT_WOD.h2,
              description: BENEFIT_WOD.body,
            },
          },
        ],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${BASE}/atletas#faq`,
      mainEntity: [
        {
          "@type": "Question",
          name: "¿Qué hace Kronos por mí como atleta?",
          acceptedAnswer: {
            "@type": "Answer",
            text: WHY.yesItems.join(". ") + ".",
          },
        },
        {
          "@type": "Question",
          name: "¿Qué NO hace Kronos?",
          acceptedAnswer: {
            "@type": "Answer",
            text: WHY.noItems.join(". ") + ".",
          },
        },
      ],
    },
  ];

  return (
    <script
      type="application/ld+json"
      // Schema.org payload — server-rendered, safe to dangerouslySetInnerHTML.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
