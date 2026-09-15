import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBox } from "@/server/actions/box";
import BoxSettingsForm from "@/components/admin/BoxSettingsForm";
import { SettingsShell } from "./_components/SettingsShell";

export const metadata = { title: "Kronos — Ajustes" };

export default async function AjustesPage() {
  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "OWNER";
  const box = await getBox();

  return (
    <SettingsShell
      active="box"
      title="Tus"
      emphasis="ajustes"
      description="La identidad del box y cómo opera: nombre, marca, idioma, moneda, zona horaria y la capacidad que traen las clases nuevas. La capacidad por clase se define solo aquí."
    >
      <BoxSettingsForm box={box} canEdit={canEdit} />
    </SettingsShell>
  );
}
