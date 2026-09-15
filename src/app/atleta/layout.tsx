import { getCachedSession } from "@/server/session";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";
import { db } from "@/server/db";
import { getBoxMode } from "@/server/actions/box-mode";
import PwaRegister from "@/components/PwaRegister";
import AthleteDrawer from "@/components/atleta/AthleteDrawer";
import { QueryProvider } from "@/components/providers/QueryProvider";

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
  // a rutas que aún no debería visitar. Su page.tsx aporta su propio <main>.
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

  // Box mode se resuelve UNA vez acá (getBoxMode está memoizado por request)
  // y baja al TabBar, que esconde las tabs de box (Reservar) cuando el atleta
  // está en Box Personal. Las páginas personal-only NO redirigen: renderizan
  // su propio estado explicativo, porque un `redirect()` a nivel page se
  // resolvía en el cliente DESPUÉS de que este layout ya había streameado su
  // shell → "Rendered more hooks than during the previous render"
  // (audit 2026-09-15, sección C).
  const { isPersonal } = await getBoxMode();

  return (
    <QueryProvider userId={session.user.id}>
      <div
        className="relative min-h-screen"
        style={{ background: "var(--k-bg)", paddingBottom: 96 }}
      >
        <PwaRegister />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2 focus:text-xs focus:font-bold focus:uppercase focus:tracking-widest focus:no-underline focus:bg-[var(--k-accent)] focus:text-[var(--k-accent-on)]"
        >
          Saltar al contenido
        </a>
        {/* Drawer trigger: solo mobile/tablet. En lg+ la navegación vive en el
            TabBar, así que el drawer no aporta nada. */}
        <div className="lg:hidden">
          <AthleteDrawer />
        </div>
        {/* Una sola instancia del bell. Su posición es CSS, no duplicación por
            breakpoint: antes se montaba dos veces (mobile + desktop) y eso
            duplicaba el polling de notificaciones cada 60s. */}
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
        <InstallPwaBanner />
        <main id="main">{children}</main>
        <TabBar mode={isPersonal ? "personal" : "box"} />
      </div>
    </QueryProvider>
  );
}
