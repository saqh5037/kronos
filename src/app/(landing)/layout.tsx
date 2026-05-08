import type { Metadata } from "next";
import "./landing.css";
import AnalyticsProvider from "./_components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "Kronos — Software invisible para CrossFit Boxes en LATAM",
  description:
    "Reservas, WODs, pagos, racha y admin en una app que vive en tu dominio, con tu logo. El atleta nunca lee Kronos en pantalla.",
  keywords: [
    "software CrossFit Box",
    "gestión gimnasio CrossFit México",
    "software gym Mercado Pago",
    "software box CrossFit LATAM",
  ],
  authors: [{ name: "Kronos" }],
  openGraph: {
    title: "Kronos — Software invisible para CrossFit Boxes",
    description:
      "Tu Box arriba. Nuestro motor abajo. Software para CrossFit Boxes en MX, CO, PE.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos — Software invisible para CrossFit Boxes",
    description:
      "Software para CrossFit Boxes en LATAM. White-label visual real. Pagos Stripe + Mercado Pago + OXXO.",
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
