import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "./_components/LandingTracker";
import Nav from "./_components/Nav";
import Hero from "./_components/Hero";
import FoundingPartners from "./_components/FoundingPartners";
import SectionAtleta from "./_components/SectionAtleta";
import SectionOwner from "./_components/SectionOwner";
import SectionWhiteLabel from "./_components/SectionWhiteLabel";
import Pricing from "./_components/Pricing";
import SectionFAQ from "./_components/SectionFAQ";
import SectionLeadForm from "./_components/SectionLeadForm";
import Footer from "./_components/Footer";

export default async function LandingPage() {
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
        <Hero boxHref={boxHref} />
        <FoundingPartners />
        <SectionAtleta />
        <SectionOwner />
        <SectionWhiteLabel />
        <Pricing />
        <SectionFAQ />
        <SectionLeadForm />
      </main>
      <Footer />
    </>
  );
}
