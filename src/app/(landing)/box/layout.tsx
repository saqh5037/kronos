import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
  description:
    "Reservas, WODs, pagos, asistencia, comunicación y admin en una sola app, en español, con tu logo y tu color. Para dueños y coaches de CrossFit en México.",
  keywords: [
    "software CrossFit Box",
    "gestión gimnasio CrossFit México",
    "software gym Mercado Pago",
    "software box CrossFit México",
    "Kronos para boxes",
    "sistema CrossFit white label",
  ],
  openGraph: {
    title: "Kronos para Boxes — El sistema operativo de tu CrossFit Box",
    description:
      "Software invisible para tu CrossFit Box. White-label real, cobranza con Mercado Pago y efectivo. Hecho en México.",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos para Boxes — Sistema operativo de tu CrossFit Box",
    description:
      "Software para CrossFit Boxes en México. White-label visual real. Cobranza con Mercado Pago y efectivo.",
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
