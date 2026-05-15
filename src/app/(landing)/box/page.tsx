import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { isDominusPromoActive } from "@/lib/dominus-promo";
import LandingTracker from "../_components/LandingTracker";
import Nav from "../_components/Nav";
import Hero from "../_components/Hero";
import FoundingPartners from "../_components/FoundingPartners";
import SectionOwner from "../_components/SectionOwner";
import SectionWhiteLabel from "../_components/SectionWhiteLabel";
import Pricing from "../_components/Pricing";
import SectionFAQ from "../_components/SectionFAQ";
import SectionLeadForm from "../_components/SectionLeadForm";
import Footer from "../_components/Footer";
import DominusPromoBanner from "../_components/DominusPromoBanner";

export default async function BoxLanding() {
  const session = await getServerSession(authOptions);
  const boxHref = session?.user
    ? session.user.role === "ATHLETE"
      ? "/atleta"
      : "/admin"
    : null;
  const dominusActive = isDominusPromoActive();

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <DominusPromoBanner />
      <Nav boxHref={boxHref} />
      <main id="main">
        <Hero boxHref={boxHref} dominusActive={dominusActive} />
        <FoundingPartners />
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
