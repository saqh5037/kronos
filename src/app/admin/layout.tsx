import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import { getSensitiveEventCount } from "@/server/actions/owner-feed";
import { SidebarGate } from "./_components/SidebarGate";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.role;
  const sensitiveCount =
    role === "OWNER" ? await getSensitiveEventCount().catch(() => 0) : 0;

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-bg lg:overflow-hidden">
      <SidebarGate sensitiveCount={sensitiveCount} role={role} />
      <main className="flex-1 lg:overflow-y-auto">{children}</main>
    </div>
  );
}
