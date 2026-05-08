import type { Metadata } from "next";
import "./landing.css";
import AnalyticsProvider from "./_components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "Kronos — Software para CrossFit Boxes en LATAM",
  description:
    "Reservas, WODs, pagos y racha en una app y un admin que viven con tu logo y tu color. White-label visual real. Pagos Stripe + Mercado Pago + OXXO. Construido en CDMX.",
  keywords: [
    "software CrossFit Box",
    "gestión gimnasio CrossFit México",
    "alternativa Wodify",
    "software gym Mercado Pago",
    "software box CrossFit LATAM",
    "PushPress alternativa",
    "Boxmagic alternativa",
  ],
  authors: [{ name: "Kronos" }],
  openGraph: {
    title: "Kronos — Tu Box arriba. Nuestro motor abajo.",
    description:
      "Software para CrossFit Boxes en LATAM. White-label visual real. Pagos Stripe + Mercado Pago + OXXO.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos — Tu Box arriba. Nuestro motor abajo.",
    description:
      "Software para CrossFit Boxes en LATAM. White-label visual real. Pagos LATAM nativos.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="lp-root lp-grain">
      <AnalyticsProvider />
      {children}
    </div>
  );
}
