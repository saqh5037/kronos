import { listMyScores, type MyScoreRow } from "@/server/actions/scores";
import { listMyPRs, type PRRow } from "@/server/actions/prs";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import { formatScore } from "@/lib/scores";
import { formatDayMonth } from "@/lib/week";

export const metadata = { title: "Kronos — Perfil" };

export default async function PerfilPage() {
  let home: AthleteHome = null;
  let prs: PRRow[] = [];
  let scores: MyScoreRow[] = [];

  try {
    [home, prs, scores] = await Promise.all([
      getAthleteHome(),
      listMyPRs(),
      listMyScores(30),
    ]);
  } catch {
    // Sesión ausente
  }

  if (!home || !home.athlete) {
    return (
      <div className="p-4 pt-16">
        <p className="k-eyebrow mb-2">Atleta</p>
        <h1 className="font-display font-bold text-3xl">Mi perfil</h1>
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Perfil no disponible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pt-16 pb-24">
      <p className="k-eyebrow mb-1" style={{ color: "var(--text-2)" }}>
        Atleta
      </p>
      <h1 className="font-display font-bold text-3xl">
        {home.athlete.firstName} {home.athlete.lastName}
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <Stat label="Racha" value={String(home.streak)} tone="strain" />
        <Stat label="PRs" value={String(home.prCount)} tone="pr" />
        <Stat
          label="Esta sem"
          value={String(home.weekAttendance)}
          tone="recovery"
        />
      </div>

      {prs.length > 0 && (
        <section className="mt-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Tus PRs
          </p>
          <div
            className="rounded-xl border"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <ul className="flex flex-col">
              {prs.map((p) => (
                <li
                  key={p.id}
                  className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between"
                  style={{ borderColor: "var(--line)" }}
                >
                  <div>
                    <p className="font-medium text-sm">{p.movementName}</p>
                    <p
                      className="text-[10px] mt-0.5"
                      style={{ color: "var(--text-3)" }}
                    >
                      {formatDayMonth(p.achievedAt)}
                    </p>
                  </div>
                  <span
                    className="font-mono font-bold text-base"
                    style={{ color: "var(--recovery)" }}
                  >
                    {p.value} {p.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {scores.length > 0 && (
        <section className="mt-6">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Historial de scores
          </p>
          <div className="flex flex-col gap-2">
            {scores.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border flex items-center justify-between gap-3"
                style={{
                  borderColor: "var(--line)",
                  background: "var(--card)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-sm truncate">
                    {s.wodName}
                  </p>
                  <p
                    className="text-[10px] mt-0.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    {formatDayMonth(s.createdAt)} · {s.scaling}
                  </p>
                </div>
                <span
                  className="font-mono font-bold text-sm"
                  style={{ color: "var(--text)" }}
                >
                  {formatScore(s.value, s.scoreType)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {prs.length === 0 && scores.length === 0 && (
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            Aún no tienes scores ni PRs. Empieza subiendo tu primer score en
            /atleta/wod.
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "recovery" | "strain" | "pr";
}) {
  const color =
    tone === "recovery"
      ? "var(--recovery)"
      : tone === "strain"
        ? "var(--strain)"
        : "var(--pr)";
  return (
    <div
      className="p-3 rounded-xl border text-center"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <p className="font-display font-bold text-2xl" style={{ color }}>
        {value}
      </p>
      <p className="k-eyebrow mt-1" style={{ color: "var(--text-3)" }}>
        {label}
      </p>
    </div>
  );
}
