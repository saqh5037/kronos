import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
  description:
    "Reservas, WODs, pagos, asistencia, comunicación y admin en una sola app, en español, con tu logo y tu color. Para dueños y coaches de CrossFit en LATAM.",
  keywords: [
    "software CrossFit Box",
    "gestión gimnasio CrossFit México",
    "software gym Mercado Pago",
    "software box CrossFit LATAM",
    "Kronos para boxes",
    "sistema CrossFit white label",
  ],
  openGraph: {
    title: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
    description:
      "Software invisible para tu CrossFit Box. White-label real, pagos Stripe + Mercado Pago + OXXO. Hecho en México.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos para Boxes — Sistema operativo de tu CrossFit Box",
    description:
      "Software para CrossFit Boxes en LATAM. White-label visual real. Pagos Stripe + Mercado Pago + OXXO.",
  },
  alternates: { canonical: "/box" },
  robots: { index: true, follow: true },
};

export default function BoxLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
