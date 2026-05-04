import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import TabBar from "@/components/kronos/TabBar";

export default async function AtletaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen pb-28 bg-bg">
      {children}
      <TabBar />
    </div>
  );
}
