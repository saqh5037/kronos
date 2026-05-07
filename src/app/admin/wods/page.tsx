import { listWODs } from "@/server/actions/wods";
import type { WODSummary } from "@/server/actions/wods";
import { listMovements } from "@/server/actions/movements";
import WODForm from "@/components/WODForm";
import MovementForm from "@/components/MovementForm";
import { WODHeroCard } from "@/components/kronos/WODHeroCard";

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
              className="font-display text-[28px] leading-none"
              style={{ color: "var(--k-accent)" }}
            >
              Tus
            </span>
            <h1
              className="k-h-italic font-display font-extrabold text-[42px] leading-[1] tracking-[-0.02em]"
              style={{ color: "var(--k-t1)" }}
            >
              <em>WODs</em>
            </h1>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--k-t2)" }}>
            Biblioteca de WODs y movimientos del box
          </p>
        </div>
        <WODForm movements={movements} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WOD library */}
        <div className="lg:col-span-2">
          <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
            {wods.length} WOD{wods.length === 1 ? "" : "s"} activo
            {wods.length === 1 ? "" : "s"}
          </p>
          {wods.length === 0 ? (
            <div className="k-card p-6 text-center">
              <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                No hay WODs aún. Crea el primero con el botón de arriba.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wods.map((w) => (
                <WODHeroCard key={w.id} w={w} />
              ))}
            </div>
          )}
        </div>

        {/* Movements sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              Biblioteca de movimientos
            </p>
            <MovementForm />
          </div>
          <div className="k-card overflow-hidden max-h-[60vh] overflow-y-auto">
            {movements.length === 0 ? (
              <p
                className="text-xs p-4 text-center"
                style={{ color: "var(--k-t3)" }}
              >
                Sin movimientos. Crea el primero.
              </p>
            ) : (
              <ul className="flex flex-col">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between group hover:bg-[var(--k-elevated)] transition-colors"
                    style={{ borderColor: "var(--k-line)" }}
                  >
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.equipment.length > 0 && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--k-t3)" }}
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
