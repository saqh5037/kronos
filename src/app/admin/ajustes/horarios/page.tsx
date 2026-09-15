import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBoxSchedule } from "@/server/actions/box";
import { ScheduleForm } from "./ScheduleForm";
import { SettingsShell } from "../_components/SettingsShell";

export const metadata = { title: "Kronos — Horarios" };

export default async function HorariosPage() {
  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "OWNER";
  const schedule = await getBoxSchedule();

  return (
    <SettingsShell
      active="horarios"
      title="Tus"
      emphasis="horarios"
      description="Qué días abre el box y a qué horas. La grilla de Programación se arma con estos horarios."
    >
      <ScheduleForm initial={schedule} canEdit={canEdit} />
    </SettingsShell>
  );
}
