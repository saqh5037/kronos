import type { Metadata } from "next";
import "./landing.css";
import AnalyticsProvider from "./_components/AnalyticsProvider";

export const metadata: Metadata = {
  title: "Kronos — Software invisible para CrossFit Boxes en México",
  description:
    "Reservas, WODs, pagos, racha y admin en una sola app, en español, con tu logo y tu color. Diseñada para CrossFit en México.",
  keywords: [
    "software CrossFit Box",
    "gestión gimnasio CrossFit México",
    "software gym Mercado Pago",
    "software box CrossFit México",
  ],
  authors: [{ name: "Kronos" }],
  openGraph: {
    title: "Kronos — Software invisible para CrossFit Boxes",
    description:
      "Software invisible para tu CrossFit Box. White-label real, cobranza con Mercado Pago y efectivo. Hecho en México.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos — Software invisible para CrossFit Boxes",
    description:
      "Software para CrossFit Boxes en México. White-label visual real. Cobranza con Mercado Pago y efectivo.",
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
