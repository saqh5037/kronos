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

  const initials = `${home.athlete.firstName[0]}${home.athlete.lastName ? home.athlete.lastName[0] : ""}`;

  return (
    <div className="pb-24">
      {/* HEADER + AVATAR */}
      <div className="px-[18px] pt-14 pb-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full p-0.5"
              style={{ background: "var(--grad)" }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center font-display font-bold text-[22px]"
                style={{ background: "var(--card)" }}
              >
                {initials}
              </div>
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 rounded-full p-0.5"
              style={{ background: "var(--bg)" }}
            >
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#0a1a14]"
                style={{ background: "var(--recovery)" }}
              >
                ✓
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[22px] font-bold truncate">
              {home.athlete.firstName} {home.athlete.lastName}
            </div>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.1em]"
              style={{ color: "var(--text-3)" }}
            >
              ATLETA · ACTIVO
            </div>
          </div>
          <button
            className="w-9 h-9 rounded-[10px] flex items-center justify-center"
            style={{
              background: "var(--card)",
              border: "1px solid var(--line)",
            }}
            aria-label="Ajustes"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.68 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* RACHA HERO */}
      <div className="px-3.5 pb-3.5">
        <div className="k-card p-4 relative overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background: "var(--grad-soft)",
              opacity: 0.5,
            }}
          />
          <div className="relative flex items-center gap-4">
            <div
              className="font-display font-bold text-6xl leading-none"
              style={{
                letterSpacing: "-0.04em",
                background: "var(--grad)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {home.streak}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold mb-1">Días de racha</div>
              <div
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--text-2)" }}
              >
                Vas por buen camino — no rompas hoy.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="px-3.5 pb-3.5 grid grid-cols-2 gap-2">
        <StatCard
          label="ASISTENCIAS"
          value={String(home.weekAttendance)}
          detail="ESTA SEMANA"
          color="var(--recovery)"
        />
        <StatCard
          label="PRs"
          value={String(home.prCount)}
          detail="TOTALES"
          color="var(--pr)"
        />
        <StatCard
          label="RACHA"
          value={String(home.streak)}
          detail="DÍAS"
          color="var(--strain)"
        />
        <StatCard
          label="SCORES"
          value={String(scores.length)}
          detail="REGISTRADOS"
          color="var(--recovery)"
        />
      </div>

      {/* PRs GRID */}
      {prs.length > 0 && (
        <section className="mt-2">
          <div className="flex items-baseline justify-between px-[18px] pb-2">
            <div className="k-eyebrow" style={{ color: "var(--text-2)" }}>
              RECORDS PERSONALES
            </div>
            <div
              className="font-mono text-[10px] font-bold tracking-[0.08em]"
              style={{ color: "var(--text-3)" }}
            >
              VER TODOS →
            </div>
          </div>
          <div className="px-3.5 grid grid-cols-2 gap-2">
            {prs.map((pr) => (
              <div key={pr.id} className="k-card p-3 relative">
                <div
                  className="text-[11px] font-semibold mb-1.5 truncate"
                  style={{ color: "var(--text-2)" }}
                >
                  {pr.movementName}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span
                    className="font-display font-bold text-2xl"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {pr.value}
                  </span>
                  <span
                    className="font-mono text-[11px] font-bold"
                    style={{ color: "var(--text-3)" }}
                  >
                    {pr.unit}
                  </span>
                </div>
                <div
                  className="font-mono text-[9px] font-bold tracking-[0.06em]"
                  style={{ color: "var(--text-3)" }}
                >
                  {formatDayMonth(pr.achievedAt).toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* HISTORIAL */}
      {scores.length > 0 && (
        <section className="mt-5 px-3.5">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Historial de scores
          </p>
          <div className="flex flex-col gap-2">
            {scores.map((s) => (
              <div
                key={s.id}
                className="k-card p-3 flex items-center justify-between gap-3"
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
        <div className="px-3.5 mt-6">
          <div
            className="p-6 rounded-xl border text-center"
            style={{
              borderColor: "var(--line)",
              background: "var(--card)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Aún no tienes scores ni PRs. Empieza subiendo tu primer score en
              /atleta/wod.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="k-card p-3.5">
      <div
        className="font-mono text-[9px] font-bold tracking-[0.14em] mb-2"
        style={{ color }}
      >
        {label}
      </div>
      <div
        className="font-display font-bold text-[26px] mb-1"
        style={{ letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      <div
        className="font-mono text-[9px] font-bold tracking-[0.08em]"
        style={{ color: "var(--text-3)" }}
      >
        {detail}
      </div>
    </div>
  );
}
