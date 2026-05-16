import type { Metadata } from "next";
import { db } from "@/server/db";
import { PilotOnboardingForm } from "./PilotOnboardingForm";

export const metadata: Metadata = {
  title: "Onboarding Pilot Box · Kronos super-admin",
  robots: { index: false, follow: false },
};

export default async function NuevoPilotoPage() {
  const disciplines = await db.discipline.findMany({
    where: { isActive: true },
    select: { slug: true, name: true },
    orderBy: { slug: "asc" },
  });

  return (
    <main
      id="main"
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
        color: "var(--k-t1)",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <p
          className="lp-eyebrow"
          style={{ color: "var(--k-accent)", letterSpacing: "0.22em" }}
        >
          <span className="lp-dot" />
          SUPER-ADMIN · ONBOARDING PILOTO
        </p>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "12px 0 8px",
            lineHeight: 1.1,
          }}
        >
          Crear Box piloto
        </h1>
        <p
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 15,
            color: "var(--k-t2)",
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Onboarding manual de Box piloto con disciplina, geo, exclusividad y
          feature flags. El owner recibirá magic link después del submit.
        </p>
      </header>

      <PilotOnboardingForm disciplines={disciplines} />
    </main>
  );
}
