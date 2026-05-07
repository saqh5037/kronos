import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { getBoxSchedule } from "@/server/actions/box";
import { ScheduleForm } from "./ScheduleForm";
import Eyebrow from "@/components/kronos/Eyebrow";

export const metadata = { title: "Kronos — Horarios" };

export default async function HorariosPage() {
  const session = await getServerSession(authOptions);
  const canEdit = session?.user?.role === "OWNER";
  const schedule = await getBoxSchedule();

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <Eyebrow>Configuración</Eyebrow>
      <h1 className="k-h-italic font-display font-extrabold text-3xl lg:text-[38px] leading-[1] tracking-[-0.02em] mt-2">
        Horarios <em>operativos</em>
      </h1>
      <p
        className="text-sm mt-2 mb-6 font-medium"
        style={{ color: "var(--k-t2)" }}
      >
        Define qué días opera el box y a qué horas. La grilla de Programación se
        renderiza en base a esto.
      </p>

      <ScheduleForm initial={schedule} canEdit={canEdit} />
    </div>
  );
}
