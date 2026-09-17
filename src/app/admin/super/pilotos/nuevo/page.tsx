import type { Metadata } from "next";
import { db } from "@/server/db";
import { PilotOnboardingForm } from "./PilotOnboardingForm";

export const metadata: Metadata = {
  title: "Nuevo box piloto · Kronos super-admin",
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
        padding: "32px 24px 48px",
        color: "var(--k-t1)",
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "var(--k-t1)",
            margin: "0 0 8px",
            lineHeight: 1.1,
          }}
        >
          Crear box piloto
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
          Da de alta un box a mano: disciplina, ciudad, exclusividad y las
          funciones que quieras dejarle encendidas. Antes de crearlo verás un
          resumen para confirmar. Al crearlo, le mandamos al dueño un enlace de
          acceso por correo.
        </p>
      </header>

      <PilotOnboardingForm disciplines={disciplines} />
    </main>
  );
}
