import { listAllPRs, type PRRow } from "@/server/actions/prs";
import { PRsBoard } from "./_components/PRsBoard";

export const metadata = { title: "Kronos — PRs" };

export default async function PRsPage() {
  let prs: PRRow[] = [];
  try {
    prs = await listAllPRs();
  } catch {
    // BD/sesión ausentes
  }

  const movementCount = new Set(prs.map((p) => p.movementName)).size;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <span className="k-eyebrow-bar">Performance</span>
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span
            className="font-display text-[28px] leading-none"
            style={{ color: "var(--k-accent)" }}
          >
            Records
          </span>
          <h1
            className="k-h-italic font-display font-extrabold text-[42px] leading-[1] tracking-[-0.02em]"
            style={{ color: "var(--k-t1)" }}
          >
            <em>personales</em>
          </h1>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--k-t2)" }}>
          {prs.length} PR{prs.length === 1 ? "" : "s"} registrado
          {prs.length === 1 ? "" : "s"} en {movementCount} movimiento
          {movementCount === 1 ? "" : "s"}
        </p>
      </div>

      {prs.length === 0 ? (
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Aún no hay PRs registrados. Se generan automáticamente al subir
            scores en WODs de fuerza con un solo movimiento.
          </p>
        </div>
      ) : (
        <PRsBoard prs={prs} />
      )}
    </div>
  );
}
