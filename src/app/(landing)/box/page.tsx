import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { isDominusPromoActive } from "@/lib/dominus-promo";
import { getDisciplineBranding } from "@/lib/branding";
import LandingTracker from "../_components/LandingTracker";
import Nav from "../_components/Nav";
import Hero from "../_components/Hero";
import FoundingPartners from "../_components/FoundingPartners";
import SectionOwner from "../_components/SectionOwner";
import SectionWhiteLabel from "../_components/SectionWhiteLabel";
import Pricing from "../_components/Pricing";
import SectionFAQ from "../_components/SectionFAQ";
import SectionLeadForm from "../_components/SectionLeadForm";
import CtaTail from "../_components/CtaTail";
import Footer from "../_components/Footer";
import DominusPromoBanner from "../_components/DominusPromoBanner";
import BoxJsonLd from "./_components/BoxJsonLd";

type BoxLandingSearchParams = Promise<{ discipline?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: BoxLandingSearchParams;
}): Promise<Metadata> {
  const { discipline } = await searchParams;
  const branding = getDisciplineBranding(discipline);
  // Canonical = /box (crossfit) o /box?discipline=hyrox para que Google
  // no indexe duplicado.
  const canonicalPath =
    branding.slug === "crossfit" ? "/box" : `/box?discipline=${branding.slug}`;
  const url = `https://www.kronos-fit.com${canonicalPath}`;

  return {
    title: branding.metaTitle,
    description: branding.metaDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: branding.metaTitle,
      description: branding.metaDescription,
      url,
      type: "website",
      locale: "es_MX",
      siteName: "Kronos",
    },
    twitter: {
      card: "summary_large_image",
      title: branding.metaTitle,
      description: branding.metaDescription,
    },
  };
}

export default async function BoxLanding({
  searchParams,
}: {
  searchParams: BoxLandingSearchParams;
}) {
  const [{ discipline }, session] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
  ]);
  const branding = getDisciplineBranding(discipline);
  const boxHref = session?.user
    ? session.user.role === "ATHLETE"
      ? "/atleta"
      : "/admin"
    : null;
  const dominusActive = isDominusPromoActive();

  return (
    <>
      <BoxJsonLd />
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <DominusPromoBanner />
      <Nav boxHref={boxHref} />
      <main id="main">
        <Hero
          boxHref={boxHref}
          dominusActive={dominusActive}
          branding={branding}
        />
        <FoundingPartners />
        <SectionOwner />
        <SectionWhiteLabel />
        <Pricing />
        <CtaTail />
        <SectionFAQ branding={branding} />
        <SectionLeadForm />
      </main>
      <Footer />
    </>
  );
}
