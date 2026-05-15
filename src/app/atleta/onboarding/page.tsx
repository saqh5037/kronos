import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { readPrefs } from "@/lib/atleta-prefs";
import OnboardingWizard from "./Wizard";

export const metadata = { title: "Kronos — Bienvenido" };

export default async function AtletaOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/login");
  }

  const athlete = await prismaBase.athlete.findFirst({
    where: { tenantId: session.user.tenantId, userId: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      tags: true,
      photoUrl: true,
      onboardingCompletedAt: true,
    },
  });

  // Defensa: middleware ya redirige si athleteOnboardedAt=true, pero por si el
  // JWT está rezagado, doble check aquí evita render del wizard.
  if (athlete?.onboardingCompletedAt) redirect("/atleta");

  const prefs = athlete ? readPrefs(athlete.tags) : { unit: null, level: null };

  return (
    <main
      className="min-h-screen flex items-start justify-center p-4 pt-12"
      style={{ background: "var(--k-bg)" }}
    >
      <OnboardingWizard
        initialFirstName={athlete?.firstName ?? ""}
        initialLastName={athlete?.lastName ?? ""}
        initialUnit={prefs.unit}
        initialLevel={prefs.level}
        initialPhotoUrl={athlete?.photoUrl ?? null}
      />
    </main>
  );
}
