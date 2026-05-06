import {
  listAthletesForFormPicker,
  listMovementsForFormPicker,
} from "@/server/actions/ai";
import FormAnalyzerClient from "./_components/FormAnalyzerClient";

export const metadata = { title: "Kronos — Análisis de forma (IA)" };

export default async function FormaPage() {
  let athletes: Array<{ id: string; name: string }> = [];
  let movements: Array<{ id: string; name: string; category: string }> = [];
  try {
    [athletes, movements] = await Promise.all([
      listAthletesForFormPicker(),
      listMovementsForFormPicker(),
    ]);
  } catch {
    // sesión ausente / no permitido
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p
          className="k-eyebrow mb-1"
          style={{
            color: "#ff2bd6",
            textShadow: "0 0 12px rgba(255,43,214,0.35)",
          }}
        >
          Kronos AI · Vision
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Análisis de forma
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-2)" }}>
          Subí una foto de un atleta ejecutando un movimiento. Gemini Vision te
          devuelve fortalezas, áreas de mejora y banderas de seguridad — todo
          informativo, no diagnóstico médico.
        </p>
      </div>

      {movements.length === 0 ? (
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No tenés permisos o no hay movimientos cargados. Verificá que seas
            COACH/OWNER.
          </p>
        </div>
      ) : (
        <FormAnalyzerClient athletes={athletes} movements={movements} />
      )}
    </div>
  );
}
