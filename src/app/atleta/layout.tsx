import { getCachedSession } from "@/server/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { db } from "@/server/db";
import PwaRegister from "@/components/PwaRegister";
import AthleteDrawer from "@/components/atleta/AthleteDrawer";

const TabBar = dynamic(() => import("@/components/kronos/TabBar"));
const NotificationBell = dynamic(
  () => import("@/components/atleta/NotificationBell"),
);
const InstallPwaBanner = dynamic(
  () => import("@/components/atleta/InstallPwaBanner"),
);

export default async function AtletaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedSession();
  if (!session) redirect("/login");

  // Gate de onboarding: el JWT en cookie puede estar stale, así que el gate
  // real consulta DB. La ruta /atleta/onboarding queda exenta del gate; su
  // page.tsx hace el bypass inverso (redirige a /atleta cuando ya completed).
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isOnboarding = pathname.startsWith("/atleta/onboarding");

  if (session.user.role === "ATHLETE" && !isOnboarding) {
    const athlete = await db.athlete.findFirst({
      where: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
      },
      select: { onboardingCompletedAt: true, onboardingSkippedAt: true },
    });
    // Gate: redirect to onboarding only when the athlete has neither completed
    // nor explicitly skipped. A skipped athlete gets full access immediately.
    if (!athlete?.onboardingCompletedAt && !athlete?.onboardingSkippedAt) {
      redirect("/atleta/onboarding");
    }
  }

  // El onboarding es un flow fullscreen — sin drawer/tabbar/install banner
  // para que el atleta complete los 9 pasos sin distracción ni navegación
  // a rutas que aún no debería visitar.
  if (isOnboarding) {
    return (
      <div
        className="relative min-h-screen"
        style={{ background: "var(--k-bg)" }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "var(--k-bg)", paddingBottom: 96 }}
    >
      <PwaRegister />
      {/* Mobile: drawer trigger + notification bell */}
      <div className="lg:hidden">
        <AthleteDrawer />
        <div
          style={{
            position: "fixed",
            top: "max(env(safe-area-inset-top), 12px)",
            right: 12,
            zIndex: 30,
          }}
        >
          <NotificationBell />
        </div>
      </div>
      {/* Desktop: notification bell only */}
      <div className="hidden lg:block">
        <div
          style={{
            position: "fixed",
            top: "max(env(safe-area-inset-top), 12px)",
            right: 12,
            zIndex: 30,
          }}
        >
          <NotificationBell />
        </div>
      </div>
      <InstallPwaBanner />
      {children}
      <TabBar />
    </div>
  );
}
