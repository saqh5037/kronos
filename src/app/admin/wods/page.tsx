import { listWODs, type WODSummary } from "@/server/actions/wods";
import { listMovements } from "@/server/actions/movements";
import WODForm from "@/components/WODForm";
import MovementForm from "@/components/MovementForm";
import { AnimatedWODCard } from "@/components/kronos/AnimatedWODCard";

export const metadata = { title: "Kronos — WODs" };

type MovementRow = {
  id: string;
  name: string;
  equipment: string[];
  videoUrl: string | null;
  standardDescription: string | null;
};

export default async function WODsPage() {
  let wods: WODSummary[] = [];
  let movements: MovementRow[] = [];

  try {
    [wods, movements] = await Promise.all([listWODs(), listMovements()]);
  } catch {
    // BD ausente o sin sesión — render vacío
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
        <div>
          <span className="k-eyebrow-bar">Programación · Biblioteca</span>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span
              className="font-script text-[28px] leading-none"
              style={{ color: "var(--red)" }}
            >
              Tus
            </span>
            <h1
              className="k-h-italic font-display font-extrabold text-[42px] leading-[1] tracking-[-0.02em]"
              style={{ color: "var(--text)" }}
            >
              <em>WODs</em>
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
            Biblioteca de WODs y movimientos del box
          </p>
        </div>
        <WODForm movements={movements} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WOD library */}
        <div className="lg:col-span-2">
          <p className="k-eyebrow mb-3" style={{ color: "var(--text-2)" }}>
            {wods.length} WOD{wods.length === 1 ? "" : "s"} activo
            {wods.length === 1 ? "" : "s"}
          </p>
          {wods.length === 0 ? (
            <div className="k-card p-6 text-center">
              <p className="text-sm" style={{ color: "var(--text-2)" }}>
                No hay WODs aún. Crea el primero con el botón de arriba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {wods.map((w) => (
                <WODCard key={w.id} w={w} />
              ))}
            </div>
          )}
        </div>

        {/* Movements sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="k-eyebrow" style={{ color: "var(--text-2)" }}>
              Biblioteca de movimientos
            </p>
            <MovementForm />
          </div>
          <div className="k-card overflow-hidden max-h-[60vh] overflow-y-auto">
            {movements.length === 0 ? (
              <p
                className="text-xs p-4 text-center"
                style={{ color: "var(--text-3)" }}
              >
                Sin movimientos. Crea el primero.
              </p>
            ) : (
              <ul className="flex flex-col">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between group hover:bg-hover-subtle transition-colors"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.equipment.length > 0 && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--text-3)" }}
                        >
                          {m.equipment.join(" · ")}
                        </p>
                      )}
                    </div>
                    <span className="text-lg opacity-0 group-hover:opacity-40 transition-opacity">
                      ›
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WODCard({ w }: { w: WODSummary }) {
  return (
    <AnimatedWODCard>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display font-bold text-lg">{w.name}</h3>
        <span className="k-chip k-chip-steel text-[10px] flex-shrink-0">
          {w.type}
        </span>
      </div>
      {w.description && (
        <p
          className="text-xs mt-3 line-clamp-3 leading-relaxed"
          style={{ color: "var(--text-2)" }}
        >
          {w.description}
        </p>
      )}
      <div
        className="flex items-center gap-3 mt-4 text-[10px]"
        style={{ color: "var(--text-3)" }}
      >
        <span className="font-mono font-semibold">{w.movementCount} mov.</span>
        <span className="opacity-40">·</span>
        <span className="font-mono font-semibold">{w.scoreType}</span>
        {w.timeCap && (
          <>
            <span className="opacity-40">·</span>
            <span className="font-mono font-semibold">{w.timeCap}min cap</span>
          </>
        )}
      </div>
    </AnimatedWODCard>
  );
}
