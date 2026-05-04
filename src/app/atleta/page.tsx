import Link from "next/link";
import {
  getAthleteHome,
  type AthleteHome,
} from "@/server/actions/athlete-home";
import HaloRing from "@/components/kronos/HaloRing";
import { formatScore } from "@/lib/scores";
import { formatDayMonth, formatTime } from "@/lib/week";
import type { ScoreType } from "@/lib/validations/wod";

export const metadata = { title: "Kronos — Inicio" };

export default async function AtletaHomePage() {
  let home: AthleteHome = null;
  try {
    home = await getAthleteHome();
  } catch {
    // Sesión ausente
  }

  if (!home) {
    return (
      <div className="p-4 pt-16">
        <p className="k-eyebrow mb-2">App del atleta</p>
        <h1 className="font-display font-bold text-3xl">Inicio</h1>
        <div
          className="mt-6 p-6 rounded-xl border text-center"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-2)" }}>
            No tienes perfil de atleta vinculado. Contacta al coach del box.
          </p>
        </div>
      </div>
    );
  }

  const weekRatio = Math.min(1, home.weekAttendance / home.weekGoal);

  return (
    <div className="p-4 pt-16 pb-24">
      <p className="k-eyebrow mb-1" style={{ color: "var(--text-2)" }}>
        Hola
      </p>
      <h1 className="font-display font-bold text-3xl">
        {home.athlete?.firstName}
      </h1>

      {/* Hero stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <StatTile>
          <HaloRing
            size={88}
            value={weekRatio}
            color="#19f08b"
            displayValue={String(home.weekAttendance)}
            label="ESTA SEM"
          />
        </StatTile>
        <StatTile>
          <HaloRing
            size={88}
            value={Math.min(1, home.streak / 14)}
            color="#3aa3ff"
            displayValue={String(home.streak)}
            label="RACHA"
          />
        </StatTile>
        <StatTile>
          <HaloRing
            size={88}
            value={Math.min(1, home.prCount / 10)}
            color="#ff5e5e"
            displayValue={String(home.prCount)}
            label="PRs"
          />
        </StatTile>
      </div>

      {/* Next booking */}
      <section className="mt-6">
        <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
          Próxima clase
        </p>
        {home.nextBooking ? (
          <Link
            href="/atleta/reservar"
            className="block p-4 rounded-xl border"
            style={{
              borderColor: "var(--recovery)",
              background: "var(--card)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="font-mono text-xs"
                  style={{ color: "var(--text-3)" }}
                >
                  {formatDayMonth(home.nextBooking.startsAt)} ·{" "}
                  {formatTime(home.nextBooking.startsAt)}
                </p>
                <p className="font-display font-bold text-lg mt-0.5">
                  {home.nextBooking.wodName ?? "WOD por definir"}
                </p>
                {home.nextBooking.coachName && (
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-3)" }}
                  >
                    Coach: {home.nextBooking.coachName}
                  </p>
                )}
              </div>
              <span
                className={`k-chip ${
                  home.nextBooking.status === "BOOKED"
                    ? "k-chip-recovery"
                    : "k-chip-ghost"
                }`}
              >
                {home.nextBooking.status}
              </span>
            </div>
          </Link>
        ) : (
          <Link
            href="/atleta/reservar"
            className="block p-4 rounded-xl border text-center"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              Sin reservas activas. Toca para reservar.
            </p>
          </Link>
        )}
      </section>

      {/* Last score */}
      {home.lastScore && (
        <section className="mt-4">
          <p className="k-eyebrow mb-2" style={{ color: "var(--text-2)" }}>
            Último score
          </p>
          <div
            className="p-4 rounded-xl border flex items-center justify-between"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <div>
              <p className="font-display font-bold text-base">
                {home.lastScore.wodName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {formatDayMonth(home.lastScore.createdAt)}
              </p>
            </div>
            <span
              className="font-mono font-bold text-lg"
              style={{ color: "var(--recovery)" }}
            >
              {formatScore(
                home.lastScore.value,
                home.lastScore.scoreType as ScoreType,
              )}
            </span>
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="mt-6 grid grid-cols-2 gap-3">
        <QuickLink href="/atleta/wod" label="WOD del día" tone="strain" />
        <QuickLink href="/atleta/reservar" label="Reservar" tone="recovery" />
        <QuickLink href="/atleta/perfil" label="Mi perfil" tone="ghost" />
        <QuickLink href="/atleta/wod" label="Subir score" tone="ghost" />
      </section>
    </div>
  );
}

function StatTile({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="p-3 rounded-xl border flex items-center justify-center"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      {children}
    </div>
  );
}

function QuickLink({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "recovery" | "strain" | "ghost";
}) {
  const color =
    tone === "recovery"
      ? "var(--recovery)"
      : tone === "strain"
        ? "var(--strain)"
        : "var(--text-2)";
  return (
    <Link
      href={href}
      className="p-4 rounded-xl border flex items-center justify-center text-center text-sm font-display font-semibold"
      style={{ borderColor: "var(--line)", background: "var(--card)", color }}
    >
      {label}
    </Link>
  );
}
