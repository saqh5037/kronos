import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { listAliasesForTenant } from "@/server/actions/aliases";
import AliasCardList from "@/components/admin/AliasCardList";

export const metadata = { title: "Apodos de atletas — Kronos" };

export default async function AliasesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.tenantId) redirect("/login");

  const role = session.user.role;
  if (role !== "OWNER" && role !== "COACH" && role !== "STAFF") {
    redirect("/admin");
  }

  const isOwner = role === "OWNER";
  const aliases = await listAliasesForTenant();

  return (
    <main className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="k-eyebrow">Ajustes</p>
        <h1 className="text-2xl font-display font-bold text-text mt-1">
          Apodos de atletas
        </h1>
        <p className="text-text-2 text-sm mt-1">
          La app aprende los apodos que usas en la pizarra para mejorar el
          reconocimiento automático.
        </p>
      </div>

      {aliases.length === 0 ? (
        <div className="k-card p-10 text-center">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-medium text-text">Aún no hay apodos</p>
          <p className="text-sm text-text-3 mt-1 max-w-sm mx-auto">
            La app aprenderá conforme uses la pizarra OCR y corrijas los matches
            de nombres.
          </p>
        </div>
      ) : (
        <AliasCardList aliases={aliases} isOwner={isOwner} />
      )}

      <p className="text-xs text-text-3">
        Los apodos son específicos de tu box. No se comparten entre tenants.
      </p>
    </main>
  );
}
