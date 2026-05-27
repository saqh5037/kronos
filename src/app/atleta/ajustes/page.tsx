import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import { SignOutButton } from "@/components/auth/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";
import Eyebrow from "@/components/kronos/Eyebrow";
import { TourTriggerButton } from "@/components/tour/TourTriggerButton";
import { ajustesTour } from "@/components/tour/tours/ajustes";

export const metadata = { title: "Kronos — Ajustes" };

export default async function AjustesAtletaPage() {
  const session = await getServerSession(authOptions);
  const userName = session?.user?.name ?? session?.user?.email ?? "Atleta";
  const userEmail = session?.user?.email ?? null;

  // Check if onboarding is pending (skipped but not completed)
  let showCompleteProfile = false;
  if (session?.user?.id && session?.user?.tenantId) {
    const athlete = await db.athlete.findFirst({
      where: { userId: session.user.id, tenantId: session.user.tenantId },
      select: { onboardingCompletedAt: true, onboardingSkippedAt: true },
    });
    showCompleteProfile =
      !!athlete &&
      !athlete.onboardingCompletedAt &&
      !!athlete.onboardingSkippedAt;
  }

  return (
    <div className="pb-28 px-4 pt-10">
      <div data-tour="ajustes.header" className="flex items-center gap-3 mb-6">
        <Link
          href="/atleta/perfil"
          aria-label="Volver"
          className="w-9 h-9 rounded-full flex items-center justify-center k-glass shrink-0"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <Eyebrow>Cuenta</Eyebrow>
          <h1 className="font-display font-extrabold text-2xl leading-none mt-1">
            Ajustes
          </h1>
        </div>
        <div className="ml-auto">
          <TourTriggerButton tourId={ajustesTour.id} />
        </div>
      </div>

      {/* User card */}
      <section data-tour="ajustes.user-card" className="k-card p-5 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg font-bold"
            style={{
              background: "var(--k-t1)",
              color: "#0a0a0c",
            }}
          >
            {userName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-base truncate">{userName}</p>
            {userEmail && (
              <p className="text-xs truncate" style={{ color: "var(--k-t3)" }}>
                {userEmail}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section data-tour="ajustes.preferencias" className="k-card p-5 mb-4">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--k-t3)" }}
        >
          Preferencias
        </p>
        {showCompleteProfile && (
          <Link
            href="/atleta/onboarding"
            className="flex items-center justify-between gap-3 py-2 -mx-1 px-1 rounded-lg transition-colors"
            style={{ color: "var(--k-accent)" }}
          >
            <div>
              <p
                className="font-medium text-sm"
                style={{ color: "var(--k-accent)" }}
              >
                Completar mi perfil
              </p>
              <p className="text-xs" style={{ color: "var(--k-t3)" }}>
                Terminar el asistente de configuración
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        )}
        <div className="flex items-center justify-between gap-3 py-2">
          <div>
            <p className="font-medium text-sm">Tema</p>
            <p className="text-xs" style={{ color: "var(--k-t3)" }}>
              Claro u oscuro
            </p>
          </div>
          <ThemeToggle />
        </div>
      </section>

      {/* Session */}
      <section data-tour="ajustes.sesion" className="k-card p-5">
        <p
          className="font-mono text-[10px] font-bold uppercase tracking-wider mb-3"
          style={{ color: "var(--k-t3)" }}
        >
          Sesión
        </p>
        <SignOutButton variant="danger" />
      </section>

      <p
        className="text-center text-[10px] mt-8"
        style={{ color: "var(--k-t3)" }}
      >
        Kronos · v1.0
      </p>
    </div>
  );
}
