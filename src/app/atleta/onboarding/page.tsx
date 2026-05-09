import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { db as prismaBase } from "@/server/db";
import { isPersonalBoxSlug } from "@/lib/personal-box";
import { readPrefs } from "@/lib/atleta-prefs";
import OnboardingWizard from "./Wizard";

export const metadata = { title: "Kronos — Bienvenido" };

export default async function AtletaOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) {
    redirect("/login");
  }

  const [box, athlete] = await Promise.all([
    prismaBase.box.findUnique({
      where: { id: session.user.tenantId },
      select: { slug: true, onboardingCompletedAt: true },
    }),
    prismaBase.athlete.findFirst({
      where: { tenantId: session.user.tenantId, userId: session.user.id },
      select: { firstName: true, lastName: true, tags: true, photoUrl: true },
    }),
  ]);

  // Si ya completó onboarding, mandar a home
  if (box?.onboardingCompletedAt) redirect("/atleta");

  // Si NO es Box Personal (atleta invitado por coach), saltar wizard
  if (box && !isPersonalBoxSlug(box.slug)) redirect("/atleta");

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
