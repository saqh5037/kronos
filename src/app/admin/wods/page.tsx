import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth";
import { listWODs } from "@/server/actions/wods";
import type { WODSummary } from "@/server/actions/wods";
import { listMovements } from "@/server/actions/movements";
import SmartWODForm from "@/components/wod-form/SmartWODForm";
import MovementForm from "@/components/MovementForm";
import { getCachedBoxDiscipline } from "@/server/cache";
import { WodLibrary } from "./_components/WodLibrary";

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
  let disciplineSlug: string | null = null;

  try {
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId;
    const [w, m, disc] = await Promise.all([
      listWODs(),
      listMovements(),
      tenantId ? getCachedBoxDiscipline(tenantId) : Promise.resolve(null),
    ]);
    wods = w;
    movements = m;
    disciplineSlug = disc?.slug ?? null;
  } catch {
    // BD ausente o sin sesión — render vacío
  }

  return (
    <div className="p-6 lg:p-8">
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
        <SmartWODForm movements={movements} disciplineSlug={disciplineSlug} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* WOD library */}
        <div className="lg:col-span-2">
          {wods.length === 0 ? (
            <div className="k-card p-6 text-center">
              <p className="text-sm" style={{ color: "var(--k-t2)" }}>
                No hay WODs aún. Crea el primero con el botón de arriba.
              </p>
            </div>
          ) : (
            <WodLibrary wods={wods} />
          )}
        </div>

        {/* Movements sidebar */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
              Biblioteca de movimientos ({movements.length})
            </p>
            <MovementForm />
          </div>
          {/* The rail scrolls with a visible affordance instead of clipping
              its 8th row against a fixed height (audit /admin/wods P2). */}
          <div className="k-card overflow-hidden">
            {movements.length === 0 ? (
              <p
                className="text-xs p-4 text-center"
                style={{ color: "var(--k-t2)" }}
              >
                Sin movimientos. Crea el primero.
              </p>
            ) : (
              <>
                <ul className="flex max-h-[70vh] flex-col overflow-y-auto overscroll-contain">
                  {movements.map((m) => (
                    <li
                      key={m.id}
                      className="px-4 py-3 border-b last:border-b-0 hover:bg-[var(--k-elevated)] transition-colors"
                      style={{ borderColor: "var(--k-line)" }}
                    >
                      <p className="text-sm font-medium">{m.name}</p>
                      {m.equipment.length > 0 && (
                        <p
                          className="text-[10px] mt-0.5"
                          style={{ color: "var(--k-t2)" }}
                        >
                          {m.equipment.join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
                <p
                  className="border-t px-4 py-2 text-[10px]"
                  style={{
                    borderColor: "var(--k-line)",
                    color: "var(--k-t2)",
                  }}
                >
                  Desliza para ver los {movements.length} movimientos · edítalos
                  en Movimientos
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
