import { listAllPRs, type PRRow } from "@/server/actions/prs";

export const metadata = { title: "Kronos — PRs" };

export default async function PRsPage() {
  let prs: PRRow[] = [];
  try {
    prs = await listAllPRs();
  } catch {
    // BD/sesión ausentes
  }

  const byMovement = new Map<string, PRRow[]>();
  for (const pr of prs) {
    if (!byMovement.has(pr.movementName)) byMovement.set(pr.movementName, []);
    byMovement.get(pr.movementName)!.push(pr);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
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
          {prs.length === 1 ? "" : "s"} en {byMovement.size} movimiento
          {byMovement.size === 1 ? "" : "s"}
        </p>
      </div>

      {prs.length === 0 ? (
        <div className="k-card p-6 text-center">
          <p className="text-sm" style={{ color: "var(--k-t2)" }}>
            Aún no hay PRs registrados. Se generan automáticamente al subir
            scores en WODs tipo STRENGTH con un solo movimiento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from(byMovement.entries()).map(([movementName, movePRs]) => {
            const sorted = [...movePRs].sort((a, b) => b.value - a.value);
            const top = sorted[0];
            const rest = sorted.slice(1);

            return (
              <div
                key={movementName}
                className="k-card overflow-hidden flex flex-col"
              >
                {/* Top PR hero */}
                <div
                  className="px-4 py-4 relative overflow-hidden"
                  style={{
                    background: "var(--hero-bg)",
                    borderBottom: "1px solid var(--k-line)",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "radial-gradient(ellipse at 80% 0%, rgba(58,163,255,0.18), transparent 55%), radial-gradient(ellipse at 0% 100%, rgba(25,240,139,0.12), transparent 60%)",
                    }}
                  />
                  <div className="relative">
                    <p
                      className="k-eyebrow mb-2"
                      style={{ color: "var(--k-t2)" }}
                    >
                      {movementName.toUpperCase()}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-display font-bold text-4xl"
                        style={{
                          letterSpacing: "-0.03em",
                          background: "var(--k-accent)",
                          WebkitBackgroundClip: "text",
                          backgroundClip: "text",
                          color: "transparent",
                        }}
                      >
                        {top.value}
                      </span>
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: "var(--k-t3)" }}
                      >
                        {top.unit}
                      </span>
                    </div>
                    <p
                      className="text-xs mt-1"
                      style={{ color: "var(--k-t2)" }}
                    >
                      {top.athleteName} ·{" "}
                      {top.achievedAt.toLocaleDateString("es-MX")}
                    </p>
                  </div>
                </div>

                {/* Rest of leaderboard */}
                {rest.length > 0 && (
                  <div className="flex-1">
                    <ul className="flex flex-col">
                      {rest.map((pr, idx) => (
                        <li
                          key={pr.id}
                          className="px-4 py-2.5 border-b last:border-b-0 flex items-center justify-between"
                          style={{ borderColor: "var(--k-line)" }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className="font-mono text-xs w-5"
                              style={{ color: "var(--k-t3)" }}
                            >
                              {idx + 2}
                            </span>
                            <span className="text-sm font-medium truncate">
                              {pr.athleteName}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-sm flex-shrink-0">
                            {pr.value} {pr.unit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {rest.length === 0 && (
                  <div className="flex-1 flex items-center justify-center p-4">
                    <p
                      className="text-xs text-center"
                      style={{ color: "var(--k-t3)" }}
                    >
                      Solo 1 PR registrado
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
