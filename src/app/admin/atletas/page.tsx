import { listAthletes } from "@/server/actions/athletes";
import AthleteForm from "@/components/AthleteForm";

export const metadata = { title: "Kronos — Atletas" };

export default async function AtletasPage() {
  let athletes: Awaited<ReturnType<typeof listAthletes>> = [];
  try {
    athletes = await listAthletes();
  } catch {
    // Graceful fallback — DB may not be seeded yet
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="k-eyebrow mb-1">CRM</p>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            Atletas
          </h1>
        </div>
        <AthleteForm />
      </div>

      {athletes.length === 0 ? (
        <div
          className="p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No hay atletas aún. Agrega el primero.
          </p>
        </div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: "var(--line)" }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--line)",
                  background: "var(--card)",
                }}
              >
                <th className="text-left px-4 py-3 k-eyebrow">Nombre</th>
                <th className="text-left px-4 py-3 k-eyebrow">Teléfono</th>
                <th className="text-left px-4 py-3 k-eyebrow">Estado</th>
                <th className="text-left px-4 py-3 k-eyebrow">Registro</th>
              </tr>
            </thead>
            <tbody>
              {athletes.map((a) => (
                <tr
                  key={a.id}
                  style={{ borderBottom: "1px solid var(--line)" }}
                  className="hover:bg-card transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {a.firstName} {a.lastName}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-2)" }}>
                    {a.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`k-chip ${a.status === "ACTIVE" ? "k-chip-recovery" : "k-chip-ghost"}`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 font-mono text-xs"
                    style={{ color: "var(--text-3)" }}
                  >
                    {new Date(a.createdAt).toLocaleDateString("es-MX")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
