import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-bg lg:overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 lg:overflow-y-auto">{children}</main>
    </div>
  );
}
