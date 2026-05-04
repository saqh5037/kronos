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
      <div className="mb-6">
        <p className="k-eyebrow mb-1">Performance</p>
        <h1 className="font-display font-bold text-3xl tracking-tight">PRs</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          {prs.length} PR{prs.length === 1 ? "" : "s"} registrado
          {prs.length === 1 ? "" : "s"} en {byMovement.size} movimiento
          {byMovement.size === 1 ? "" : "s"}
        </p>
      </div>

      {prs.length === 0 ? (
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Aún no hay PRs registrados. Se generan automáticamente al subir
            scores en WODs tipo STRENGTH con un solo movimiento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Array.from(byMovement.entries()).map(([movementName, movePRs]) => {
            const sorted = [...movePRs].sort((a, b) => b.value - a.value);
            return (
              <div
                key={movementName}
                className="rounded-xl border"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--card)",
                }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between"
                  style={{ borderColor: "var(--line)" }}
                >
                  <h3 className="font-display font-bold text-base">
                    {movementName}
                  </h3>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    {sorted.length} atleta{sorted.length === 1 ? "" : "s"}
                  </span>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--line)",
                        color: "var(--text-3)",
                      }}
                    >
                      <th className="text-left px-4 py-2 k-eyebrow w-12">#</th>
                      <th className="text-left px-4 py-2 k-eyebrow">Atleta</th>
                      <th className="text-left px-4 py-2 k-eyebrow">PR</th>
                      <th className="text-left px-4 py-2 k-eyebrow">Logrado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((pr, idx) => (
                      <tr
                        key={pr.id}
                        style={{ borderBottom: "1px solid var(--line)" }}
                      >
                        <td
                          className="px-4 py-2 font-mono text-xs"
                          style={{
                            color:
                              idx === 0 ? "var(--recovery)" : "var(--text-3)",
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td className="px-4 py-2 font-medium">
                          {pr.athleteName}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className="font-mono font-bold"
                            style={{
                              color:
                                idx === 0 ? "var(--recovery)" : "var(--text)",
                            }}
                          >
                            {pr.value} {pr.unit}
                          </span>
                        </td>
                        <td
                          className="px-4 py-2 font-mono text-xs"
                          style={{ color: "var(--text-3)" }}
                        >
                          {pr.achievedAt.toLocaleDateString("es-MX")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
