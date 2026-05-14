import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import LandingTracker from "../_components/LandingTracker";
import NavAtletas from "./_components/NavAtletas";
import AtletaHero from "./_components/AtletaHero";
import BenefitSection from "./_components/BenefitSection";
import TestimonialHero from "./_components/TestimonialHero";
import AtletaSiNo from "./_components/AtletaSiNo";
import DualQuotes from "./_components/DualQuotes";
import AtletaClosingCTA from "./_components/AtletaClosingCTA";
import FooterMinimal from "./_components/FooterMinimal";
import { BENEFIT_SKILLS, BENEFIT_WOD } from "./_data/copy";

export default async function AtletasLanding() {
  const session = await getServerSession(authOptions);
  const boxHref = session?.user
    ? session.user.role === "ATHLETE"
      ? "/atleta"
      : "/admin"
    : null;
  const ctaHref = boxHref ?? "/login";

  return (
    <>
      <a href="#main" className="lp-skip">
        Saltar al contenido
      </a>
      <LandingTracker />
      <NavAtletas boxHref={boxHref} />
      <main id="main">
        {/* 1 — Hero */}
        <AtletaHero boxHref={boxHref} />

        {/* 2 — Benefit Skills */}
        <BenefitSection
          anchor="skills"
          eyebrow={BENEFIT_SKILLS.eyebrow}
          h2={BENEFIT_SKILLS.h2}
          body={BENEFIT_SKILLS.body}
          detail={BENEFIT_SKILLS.detail}
          phoneSrc={BENEFIT_SKILLS.phoneSrc}
          phoneAlt={BENEFIT_SKILLS.phoneAlt}
          trackLocation="atletas_benefit_skills"
          ctaHref={ctaHref}
        />

        {/* 3 — Benefit WOD auto-PR */}
        <BenefitSection
          anchor="wod"
          eyebrow={BENEFIT_WOD.eyebrow}
          h2={BENEFIT_WOD.h2}
          body={BENEFIT_WOD.body}
          detail={BENEFIT_WOD.detail}
          phoneSrc={BENEFIT_WOD.phoneSrc}
          phoneAlt={BENEFIT_WOD.phoneAlt}
          flip
          trackLocation="atletas_benefit_wod"
          ctaHref={ctaHref}
        />

        {/* 4 — Testimonial destacado */}
        <TestimonialHero />

        {/* 5 — Por qué Kronos (SÍ / NO) */}
        <AtletaSiNo />

        {/* 6 — Dual quotes */}
        <DualQuotes />

        {/* 7 — CTA final */}
        <AtletaClosingCTA boxHref={boxHref} />
      </main>
      <FooterMinimal />
    </>
  );
}
