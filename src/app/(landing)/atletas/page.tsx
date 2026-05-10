import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "../_components/LandingTracker";
import Nav from "../_components/Nav";
import Footer from "../_components/Footer";
import AtletaHero from "./_components/AtletaHero";
import AtletaForWho from "./_components/AtletaForWho";
import AtletaHits from "./_components/AtletaHits";
import AtletaSiNo from "./_components/AtletaSiNo";
import AtletaManualPreview from "./_components/AtletaManualPreview";
import AtletaClosingCTA from "./_components/AtletaClosingCTA";

export default async function AtletasLanding() {
  const session = await getServerSession(authOptions);
  const boxHref = session?.user
    ? session.user.role === "ATHLETE"
      ? "/atleta"
      : "/admin"
    : null;

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <Nav boxHref={boxHref} />
      <main id="main">
        <AtletaHero boxHref={boxHref} />
        <AtletaForWho />
        <AtletaHits />
        <AtletaSiNo />
        <AtletaManualPreview />
        <AtletaClosingCTA boxHref={boxHref} />
      </main>
      <Footer />
    </>
  );
}
