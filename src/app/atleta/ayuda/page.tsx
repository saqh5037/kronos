import Link from "next/link";
import type { Route } from "next";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";

export const metadata = { title: "Kronos — Centro de Ayuda" };

const tutorials = [
  {
    id: "home-tour",
    title: "Tu Home en 30 segundos",
    description:
      "Recorrido por la pantalla principal: hero personalizado, coach IA, racha, registro de WOD y PRs recientes.",
    target: "Atleta",
    duration: "27s",
    thumbnail: "/tutorials/home-tour/screenshots/01-hero.png",
    guideUrl: "/tutorials/home-tour/index.html",
    videoUrl: "/tutorials/home-tour/tutorial.mp4",
  },
  {
    id: "reserva-clases",
    title: "Cómo reservar una clase",
    description:
      "Aprende a reservar tu lugar en una clase de CrossFit paso a paso.",
    target: "Atleta",
    duration: "26s",
    thumbnail: "/tutorials/reserva-clases/screenshots/01-home.png",
    guideUrl: "/tutorials/reserva-clases/index.html",
    videoUrl: "/tutorials/reserva-clases/tutorial.mp4",
  },
  {
    id: "wod-del-dia",
    title: "Cómo registrar tu WOD",
    description:
      "Anota tu WOD y tu resultado en una sola pantalla: nombre, tipo, métrica y score.",
    target: "Atleta",
    duration: "27s",
    thumbnail: "/tutorials/wod-del-dia/screenshots/01-wod.png",
    guideUrl: "/tutorials/wod-del-dia/index.html",
    videoUrl: "/tutorials/wod-del-dia/tutorial.mp4",
  },
  {
    id: "skills-atleta",
    title: "Cómo usar Skills",
    description:
      "Entiende tu skill activo, progresiones, foco de hoy y cómo cambiar de objetivo.",
    target: "Atleta",
    duration: "32s",
    thumbnail: "/tutorials/skills-atleta/screenshots/01-skills-home.png",
    guideUrl: "/tutorials/skills-atleta/index.html",
    videoUrl: "/tutorials/skills-atleta/tutorial.mp4",
  },
  {
    id: "perfil-y-prs",
    title: "Tu perfil, racha y PRs",
    description:
      "PRs por movimiento, historial de scores, badges y stats acumulados.",
    target: "Atleta",
    duration: "26s",
    thumbnail: "/tutorials/perfil-y-prs/screenshots/01-perfil.png",
    guideUrl: "/tutorials/perfil-y-prs/index.html",
    videoUrl: "/tutorials/perfil-y-prs/tutorial.mp4",
  },
  {
    id: "salud-wellness",
    title: "Registra tu progreso físico",
    description:
      "Peso, composición corporal y metas de wellness. Tu evolución más allá del entrenamiento.",
    target: "Atleta",
    duration: "27s",
    thumbnail: "/tutorials/salud-wellness/screenshots/01-salud.png",
    guideUrl: "/tutorials/salud-wellness/index.html",
    videoUrl: "/tutorials/salud-wellness/tutorial.mp4",
  },
];

export default function AyudaPage() {
  return (
    <div className="min-h-full pb-32 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-8">
        <div style={{ marginBottom: 8 }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{
            fontFamily: "var(--k-font-display)",
            color: "var(--k-accent)",
          }}
        >
          CENTRO DE AYUDA
        </h1>
        <p
          className="mt-2 text-sm"
          style={{
            color: "var(--k-t3)",
            lineHeight: 1.5,
          }}
        >
          Tutoriales visuales para sacarle el máximo provecho a Kronos.
        </p>
      </div>

      <div className="space-y-4">
        {tutorials.map((t) => (
          <article
            key={t.id}
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-line)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div className="relative aspect-[16/9] overflow-hidden">
              <img
                src={t.thumbnail}
                alt={t.title}
                className="w-full h-full object-cover opacity-90"
                loading="lazy"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,10,10,0.9) 0%, transparent 60%)",
                }}
              />
              <div className="absolute bottom-3 left-4 right-4">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--k-font-display)",
                    color: "var(--k-accent)",
                  }}
                >
                  {t.target} · {t.duration}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h2
                className="text-base font-semibold"
                style={{
                  fontFamily: "var(--k-font-display)",
                  color: "var(--k-t1)",
                }}
              >
                {t.title}
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--k-t3)", lineHeight: 1.5 }}
              >
                {t.description}
              </p>

              <div className="mt-4 flex gap-3">
                <Link
                  href={t.guideUrl as Route}
                  target="_blank"
                  className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "var(--k-accent)",
                    color: "var(--k-dark)",
                    fontFamily: "var(--k-font-display)",
                  }}
                >
                  Ver Guía Interactiva
                </Link>
                <Link
                  href={t.videoUrl as Route}
                  target="_blank"
                  className="flex-1 text-center py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: "var(--k-surface)",
                    color: "var(--k-t1)",
                    border: "1px solid var(--k-line)",
                    fontFamily: "var(--k-font-display)",
                  }}
                >
                  Ver Video
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Link
        href="/atleta/ajustes"
        className="mt-8 p-4 rounded-xl text-center block"
        style={{
          background: "rgba(200,255,45,0.06)",
          border: "1px solid rgba(200,255,45,0.12)",
          textDecoration: "none",
        }}
      >
        <p className="text-sm" style={{ color: "var(--k-t3)" }}>
          ¿Necesitas más ayuda? Pregunta a tu coach en el box.
        </p>
        <p
          className="text-xs mt-1 font-semibold"
          style={{
            fontFamily: "var(--k-font-display)",
            color: "var(--k-accent)",
            letterSpacing: "0.12em",
          }}
        >
          VER MIS AJUSTES →
        </p>
      </Link>
    </div>
  );
}
