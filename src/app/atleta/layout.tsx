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
    <div className="relative min-h-screen pb-28 bg-bg">
      <PwaRegister />
      {/* Header with notification bell */}
      <header className="flex items-center justify-end px-4 pt-4 pb-0">
        <NotificationBell />
      </header>
      {/* PWA Install Banner */}
      <InstallPwaBanner />
      {children}
      <TabBar />
    </div>
  );
}
