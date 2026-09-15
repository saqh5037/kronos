import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { authOptions } from "@/server/auth";
import { listAliasesForTenant } from "@/server/actions/aliases";
import AliasCardList from "@/components/admin/AliasCardList";
import { SettingsShell } from "../_components/SettingsShell";

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
    <SettingsShell
      active="apodos"
      title="Tus"
      emphasis="apodos"
      description="Cuando subes una foto del pizarrón, Kronos lee los nombres escritos a mano. Aquí aprende los apodos que usa tu box para reconocer a cada atleta."
    >
      {aliases.length === 0 ? (
        <div className="k-card p-10 text-center">
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line-2)",
              color: "var(--k-t2)",
            }}
          >
            <Tag size={20} strokeWidth={1.8} aria-hidden />
          </div>
          <p className="text-text font-medium">Aún no hay apodos</p>
          <p className="text-text-3 mx-auto mt-1 max-w-sm text-sm">
            Se irán guardando conforme subas fotos del pizarrón y corrijas a qué
            atleta corresponde cada nombre.
          </p>
        </div>
      ) : (
        <AliasCardList aliases={aliases} isOwner={isOwner} />
      )}

      <p className="text-text-3 mt-6 text-xs">
        Los apodos son solo de tu box. Ningún otro box los ve.
      </p>
    </SettingsShell>
  );
}
