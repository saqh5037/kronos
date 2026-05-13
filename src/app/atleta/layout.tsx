import { getCachedSession } from "@/server/session";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
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
