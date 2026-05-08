import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import Nav from "./_components/Nav";
import Hero from "./_components/Hero";
import SocialProof from "./_components/SocialProof";
import SectionAtleta from "./_components/SectionAtleta";
import SectionOwner from "./_components/SectionOwner";
import SectionWhiteLabel from "./_components/SectionWhiteLabel";
import Pricing from "./_components/Pricing";
import CtaTail from "./_components/CtaTail";
import Footer from "./_components/Footer";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = preview === "1";

  if (!isPreview) {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      redirect(session.user.role === "ATHLETE" ? "/atleta" : "/admin");
    }
  }

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <SocialProof />
        <SectionAtleta />
        <SectionOwner />
        <SectionWhiteLabel />
        <Pricing />
        <CtaTail />
      </main>
      <Footer />
    </>
  );
}
