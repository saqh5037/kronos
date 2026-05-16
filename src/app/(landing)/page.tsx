import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "./_components/LandingTracker";
import RouterSplit from "./_components/router/RouterSplit";

export const metadata: Metadata = {
  title: "Kronos — Tu CrossFit en una app. Gratis para atletas.",
  description:
    "App gratuita de CrossFit para atletas + sistema operativo para Boxes. Tus PRs, tu racha, reservas, WODs y pagos en una sola app, en español, hecha en LATAM.",
  alternates: {
    canonical: "https://www.kronos-fit.com",
  },
  openGraph: {
    title: "Kronos — Tu CrossFit en una app",
    description:
      "Gratis para atletas. Premium para Boxes. App nativa, white-label real, pagos LATAM nativos.",
    url: "https://www.kronos-fit.com",
    type: "website",
    locale: "es_MX",
    siteName: "Kronos",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kronos — Tu CrossFit en una app",
    description:
      "App de CrossFit gratis para atletas. Sistema operativo white-label para Boxes. Hecha en LATAM.",
  },
};

export default async function HomeRouter() {
  const session = await getServerSession(authOptions);

  // Sesión activa → ir directo al surface correcto
  if (session?.user) {
    const target = session.user.role === "ATHLETE" ? "/atleta" : "/admin";
    redirect(target);
  }

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <RouterSplit />
    </>
  );
}
