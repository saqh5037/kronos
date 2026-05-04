import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import BoxSettingsForm from "@/components/admin/BoxSettingsForm";

export const metadata = { title: "Kronos — Ajustes" };

export default async function AjustesPage() {
  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "OWNER";
  const box = await getBox();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <p className="k-eyebrow mb-2">Configuración</p>
      <h1 className="font-display font-bold text-3xl tracking-tight mb-6">
        Ajustes
      </h1>
      <BoxSettingsForm box={box} canEdit={canEdit} />
    </div>
  );
}
