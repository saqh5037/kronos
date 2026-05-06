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
      <span className="k-eyebrow-bar">Configuración</span>
      <div className="mt-2 mb-6 flex items-baseline gap-2 flex-wrap">
        <span
          className="font-script text-[26px] leading-none"
          style={{ color: "var(--red)" }}
        >
          Tus
        </span>
        <h1
          className="k-h-italic font-display font-extrabold text-[40px] leading-[1] tracking-[-0.02em]"
          style={{ color: "var(--text)" }}
        >
          <em>ajustes</em>
        </h1>
      </div>
      <BoxSettingsForm box={box} canEdit={canEdit} />
    </div>
  );
}
