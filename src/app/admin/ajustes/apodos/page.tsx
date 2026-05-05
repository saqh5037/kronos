import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/server/auth";
import { listAliasesForTenant, removeAlias } from "@/server/actions/aliases";

export const metadata = { title: "Apodos de atletas — Kronos" };

async function DeleteAliasButton({
  aliasId,
  isOwner,
}: {
  aliasId: string;
  isOwner: boolean;
}) {
  if (!isOwner) return null;

  async function handleDelete() {
    "use server";
    await removeAlias(aliasId);
  }

  return (
    <form action={handleDelete}>
      <button type="submit" className="text-xs text-[--pr] hover:underline">
        Eliminar
      </button>
    </form>
  );
}

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
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <p className="k-eyebrow">Ajustes</p>
        <h1 className="text-2xl font-display font-bold text-white mt-1">
          Apodos de atletas
        </h1>
        <p className="text-white/60 text-sm mt-1">
          El sistema de OCR aprende los apodos que usas en la pizarra para
          mejorar el reconocimiento automático.
        </p>
      </div>

      {aliases.length === 0 ? (
        <div className="k-card p-8 text-center text-white/40">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-medium">Sin apodos registrados</p>
          <p className="text-sm mt-1">
            Los apodos se aprenden automáticamente al cargar pizarras y corregir
            los matches.
          </p>
        </div>
      ) : (
        <div className="k-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-white/40 font-normal">
                  Apodo en pizarra
                </th>
                <th className="px-4 py-3 text-left text-white/40 font-normal">
                  Atleta
                </th>
                <th className="px-4 py-3 text-left text-white/40 font-normal">
                  Registrado
                </th>
                {isOwner && (
                  <th className="px-4 py-3 text-left text-white/40 font-normal">
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {aliases.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2"
                >
                  <td className="px-4 py-3 font-mono text-white">{a.alias}</td>
                  <td className="px-4 py-3 text-white/80">{a.athleteName}</td>
                  <td className="px-4 py-3 text-white/40">
                    {a.createdAt.toLocaleDateString("es-MX")}
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      <DeleteAliasButton aliasId={a.id} isOwner={isOwner} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-white/30">
        Los apodos son específicos de tu box. No se comparten entre tenants.
      </p>
    </main>
  );
}
