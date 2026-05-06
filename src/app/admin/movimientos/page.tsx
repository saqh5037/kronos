import { listMovements } from "@/server/actions/movements";
import MovementAdminClient from "./_components/MovementAdminClient";

export const metadata = { title: "Kronos Admin — Movimientos" };

export default async function AdminMovimientosPage() {
  let movements: Awaited<ReturnType<typeof listMovements>> = [];

  try {
    movements = await listMovements();
  } catch {
    // BD/auth
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <span className="k-eyebrow-bar">Configuración</span>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span
            className="font-script text-[26px] leading-none"
            style={{ color: "var(--red)" }}
          >
            Biblioteca de
          </span>
          <h1
            className="k-h-italic font-display font-extrabold text-[38px] leading-[1] tracking-[-0.02em]"
            style={{ color: "var(--text)" }}
          >
            <em>movimientos</em>
          </h1>
        </div>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          {movements.length} movimientos · puedes personalizar el video de cada
          uno
        </p>
      </div>

      <MovementAdminClient movements={movements} />
    </div>
  );
}
