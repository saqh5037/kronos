import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import TabBar from "@/components/kronos/TabBar";
import NotificationBell from "@/components/atleta/NotificationBell";
import InstallPwaBanner from "@/components/atleta/InstallPwaBanner";
import PwaRegister from "@/components/PwaRegister";

export default async function AtletaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div
      className="relative min-h-screen"
      style={{ background: "var(--k-bg)", paddingBottom: 96 }}
    >
      <PwaRegister />
      {/* Notification bell flota top-right, sin header bar */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          zIndex: 30,
        }}
      >
        <NotificationBell />
      </div>
      <InstallPwaBanner />
      {children}
      <TabBar />
    </div>
  );
}
