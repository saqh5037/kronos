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
    <div className="p-8 relative">
      <div className="mb-7 relative">
        <span className="k-eyebrow-bar">Kronos AI · Vision</span>
        <div className="mt-3 flex items-baseline gap-3 flex-wrap">
          <span
            className="font-display text-[34px] leading-none"
            style={{ color: "var(--k-accent)" }}
          >
            Análisis de
          </span>
          <h1
            className="k-h-italic font-display font-extrabold text-[44px] leading-[1.05] tracking-[-0.02em]"
            style={{ color: "var(--k-t1)" }}
          >
            <em>forma</em>
          </h1>
        </div>
        <p
          className="mt-3 text-[14px] leading-[1.6] max-w-[560px]"
          style={{ color: "var(--k-t2)" }}
        >
          Subí una foto de un atleta ejecutando un movimiento. Gemini Vision te
          devuelve fortalezas, áreas de mejora y banderas de seguridad — todo
          informativo, no diagnóstico médico.
        </p>
      </div>

      {movements.length === 0 ? (
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            No tienes permisos o no hay movimientos cargados. Verifica que seas
            COACH/OWNER.
          </p>
        </div>
      ) : (
        <FormAnalyzerClient athletes={athletes} movements={movements} />
      )}
    </div>
  );
}
