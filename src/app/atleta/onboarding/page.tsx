import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
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

  const box = await prismaBase.box.findUnique({
    where: { id: session.user.tenantId },
    select: {
      slug: true,
      name: true,
      users: {
        where: { role: "COACH" },
        select: { name: true },
        take: 1,
      },
    },
  });

  const isB2B = box ? !isPersonalBoxSlug(box.slug) : false;
  const coachName = box?.users[0]?.name ?? null;

  return (
    <main
      className="min-h-screen flex items-start justify-center p-4 pt-12"
      style={{ background: "var(--k-bg)" }}
    >
      <OnboardingWizard
        isB2B={isB2B}
        boxName={box?.name ?? ""}
        coachName={coachName}
      />
    </main>
  );
}
