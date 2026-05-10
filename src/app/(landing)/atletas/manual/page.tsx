import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "../../_components/LandingTracker";
import Nav from "../../_components/Nav";
import Footer from "../../_components/Footer";
import ManualHero from "../_components/ManualHero";
import ManualTOC from "../_components/ManualTOC";
import ManualScreen from "../_components/ManualScreen";
import AtletaClosingCTA from "../_components/AtletaClosingCTA";
import { SCREENS } from "../_data/screens";

export const metadata: Metadata = {
  title: "Manual Kronos Atletas — Guía completa pantalla por pantalla",
  description:
    "Cómo usar Kronos Atletas: home, WOD, reservas, skills, perfil, logros. 9 pantallas documentadas con capturas reales y acciones por pantalla.",
  alternates: { canonical: "/atletas/manual" },
  robots: { index: true, follow: true },
};

export default async function ManualPage() {
  const session = await getServerSession(authOptions);
  const boxHref = session?.user
    ? session.user.role === "ATHLETE"
      ? "/atleta"
      : "/admin"
    : null;
  const showDeepLink = session?.user?.role === "ATHLETE";

  const tocItems = SCREENS.map((s) => ({ id: s.id, label: s.label }));

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <Nav boxHref={boxHref} />
      <main id="main">
        <ManualHero />
        <div className="manual-shell">
          <ManualTOC items={tocItems} />
          <div>
            {SCREENS.map((s, i) => (
              <ManualScreen
                key={s.id}
                screen={s}
                index={i + 1}
                showDeepLink={showDeepLink}
              />
            ))}
          </div>
        </div>
        <AtletaClosingCTA boxHref={boxHref} />
      </main>
      <Footer />
    </>
  );
}
