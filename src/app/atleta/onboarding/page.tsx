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
      className="relative min-h-screen flex items-start justify-center p-4 pt-12 overflow-hidden"
      style={{ background: "var(--k-bg)" }}
    >
      {/* Backdrop ambient — gym dark con neón lima, opacity baja para que el
          contenido del wizard siga siendo el foco. Sutil pero le da textura
          al fondo sin competir con el branding V3. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: "url(/images/wizard/step1-bg-motivation.webp)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
        }}
      />
      {/* Gradient overlay para que el contenido del card destaque por encima */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0.85) 100%)",
        }}
      />
      <div className="relative z-10 w-full flex justify-center">
        <OnboardingWizard
          isB2B={isB2B}
          boxName={box?.name ?? ""}
          coachName={coachName}
        />
      </div>
    </main>
  );
}
