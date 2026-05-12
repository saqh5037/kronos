import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import TabBar from "@/components/kronos/TabBar";
import NotificationBell from "@/components/atleta/NotificationBell";
import InstallPwaBanner from "@/components/atleta/InstallPwaBanner";
import PwaRegister from "@/components/PwaRegister";
import VisitTracker from "@/components/atleta/VisitTracker";
import { getBoxMode } from "@/server/actions/box-mode";
import { getMyCoachCards } from "@/server/actions/coach-cards";
import AthleteDrawer from "@/components/atleta/AthleteDrawer";
import DesktopTabBar from "@/components/atleta/DesktopTabBar";

export default async function AtletaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const { isPersonal } = await getBoxMode();

  const coachCards = await getMyCoachCards().catch(() => []);
  const yoBadge = coachCards.length > 0;

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "var(--k-bg)" }}
    >
      <PwaRegister />
      <VisitTracker />

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

      {/* Desktop: top bar with nav */}
      <div
        className="hidden lg:flex"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          height: 56,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: "rgba(8,8,10,0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--k-line)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: "1.5px solid var(--k-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--k-font-display)",
              fontSize: 13,
              fontWeight: 700,
              color: "var(--k-accent)",
              letterSpacing: "-0.04em",
            }}
          >
            K
          </div>
          <span
            style={{
              fontFamily: "var(--k-font-display)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--k-t1)",
            }}
          >
            KRONOS
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NotificationBell />
        </div>
      </div>

      <InstallPwaBanner />

      {/* Content area */}
      <main
        className="pb-24 lg:pb-16"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 12px)",
        }}
      >
        <div className="mx-auto lg:max-w-3xl">{children}</div>
      </main>

      {/* Mobile: bottom tab bar */}
      <div className="lg:hidden">
        <TabBar mode={isPersonal ? "personal" : "box"} yoBadge={yoBadge} />
      </div>

      {/* Desktop: horizontal tabs */}
      <div className="hidden lg:block">
        <DesktopTabBar
          mode={isPersonal ? "personal" : "box"}
          yoBadge={yoBadge}
        />
      </div>
    </div>
  );
}
