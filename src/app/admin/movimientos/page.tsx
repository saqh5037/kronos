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
        <p className="k-eyebrow mb-1">Configuración</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Biblioteca de movimientos
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          {movements.length} movimientos · puedes personalizar el video de cada
          uno
        </p>
      </div>

      <MovementAdminClient movements={movements} />
    </div>
  );
}
