/**
 * Help centre.
 *
 * Audit 2026-09-15: "Back link overlapped by the hamburger ('NICIO'). Tutorial
 * thumbnails are composite mock UI whose text bleeds outside its cards ('¡Qué
 * gran logro, Bernardo!')" — another persona inside Emma's help centre — plus
 * Title Case buttons against UPPERCASE mono everywhere else and a footer that
 * sent "¿Necesitas más ayuda?" to Ajustes, which is not help.
 *
 * The composite screenshots are gone: each tutorial gets a lucide icon tile and
 * its title. No borrowed persona, no text bleeding out of a mock.
 */

import Link from "next/link";
import type { Route } from "next";
import {
  BookOpen,
  CalendarCheck,
  CircleUser,
  HeartPulse,
  Home,
  Play,
  Target,
  type LucideIcon,
} from "lucide-react";
import AthleteBackLink from "@/components/atleta/AthleteBackLink";
import { getCachedSession } from "@/server/session";
import { db } from "@/server/db";

export const metadata = { title: "Kronos — Centro de Ayuda" };

type Tutorial = {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: LucideIcon;
  guideUrl: string;
  videoUrl: string;
};

const tutorials: Tutorial[] = [
  {
    id: "home-tour",
    title: "Tu inicio en 30 segundos",
    description:
      "Recorrido por la pantalla principal: saludo, coach IA, racha, registro de WOD y PRs recientes.",
    duration: "27 s",
    icon: Home,
    guideUrl: "/tutorials/home-tour/index.html",
    videoUrl: "/tutorials/home-tour/tutorial.mp4",
  },
  {
    id: "reserva-clases",
    title: "Cómo reservar una clase",
    description: "Aparta tu lugar en una clase paso a paso.",
    duration: "26 s",
    icon: CalendarCheck,
    guideUrl: "/tutorials/reserva-clases/index.html",
    videoUrl: "/tutorials/reserva-clases/tutorial.mp4",
  },
  {
    id: "wod-del-dia",
    title: "Cómo registrar tu WOD",
    description:
      "Anota tu WOD y tu resultado en una sola pantalla: nombre, tipo, métrica y score.",
    duration: "27 s",
    icon: BookOpen,
    guideUrl: "/tutorials/wod-del-dia/index.html",
    videoUrl: "/tutorials/wod-del-dia/tutorial.mp4",
  },
  {
    id: "skills-atleta",
    title: "Cómo usar Skills",
    description:
      "Tu skill activo, las progresiones, el foco de hoy y cómo cambiar de objetivo.",
    duration: "32 s",
    icon: Target,
    guideUrl: "/tutorials/skills-atleta/index.html",
    videoUrl: "/tutorials/skills-atleta/tutorial.mp4",
  },
  {
    id: "perfil-y-prs",
    title: "Tu perfil, racha y PRs",
    description:
      "PRs por movimiento, historial de scores, logros y stats acumulados.",
    duration: "26 s",
    icon: CircleUser,
    guideUrl: "/tutorials/perfil-y-prs/index.html",
    videoUrl: "/tutorials/perfil-y-prs/tutorial.mp4",
  },
  {
    id: "salud-wellness",
    title: "Registra tu progreso físico",
    description:
      "Peso, composición corporal y metas. Tu evolución más allá del entrenamiento.",
    duration: "27 s",
    icon: HeartPulse,
    guideUrl: "/tutorials/salud-wellness/index.html",
    videoUrl: "/tutorials/salud-wellness/tutorial.mp4",
  },
];

export default async function AyudaPage() {
  // The box name is the only contact detail the schema carries today, so the
  // footer names the box and stays plain text instead of faking a link.
  let boxName: string | null = null;
  try {
    const session = await getCachedSession();
    if (session?.user?.tenantId) {
      const box = await db.box.findUnique({
        where: { id: session.user.tenantId },
        select: { name: true },
      });
      boxName = box?.name ?? null;
    }
  } catch {
    // anonymous / stale session — the footer works without the box name
  }

  return (
    <div className="min-h-full pb-32 px-4 pt-6 max-w-lg mx-auto">
      <div className="mb-8">
        <div className="pl-12 lg:pl-0" style={{ marginBottom: 8 }}>
          <AthleteBackLink href="/atleta" label="Inicio" />
        </div>
        <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
          Ayuda
        </div>
        <h1
          className="text-2xl font-bold tracking-tight mt-1"
          style={{
            fontFamily: "var(--k-font-display)",
            color: "var(--k-t1)",
            textTransform: "uppercase",
          }}
        >
          Centro de ayuda
        </h1>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--k-t2)", lineHeight: 1.5 }}
        >
          Tutoriales cortos para sacarle todo el provecho a Kronos.
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
              padding: 16,
            }}
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div
                aria-hidden
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  background: "var(--k-accent-soft)",
                  border: "1px solid var(--k-accent-line)",
                  color: "var(--k-accent)",
                }}
              >
                <t.icon size={20} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  className="k-mono"
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.16em",
                    color: "var(--k-t3)",
                    textTransform: "uppercase",
                  }}
                >
                  {t.duration}
                </div>
                <h2
                  className="text-base font-semibold"
                  style={{
                    fontFamily: "var(--k-font-display)",
                    color: "var(--k-t1)",
                    marginTop: 2,
                  }}
                >
                  {t.title}
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: "var(--k-t2)", lineHeight: 1.5 }}
                >
                  {t.description}
                </p>
              </div>
            </div>

            {/* UPPERCASE mono, like every other button in the app. */}
            <div className="mt-4 flex gap-3">
              <Link
                href={t.guideUrl as Route}
                target="_blank"
                className="flex-1 text-center"
                style={{
                  minHeight: 44,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "var(--k-accent)",
                  color: "var(--k-accent-on)",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Ver guía
              </Link>
              <Link
                href={t.videoUrl as Route}
                target="_blank"
                className="flex-1"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  minHeight: 44,
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: "transparent",
                  color: "var(--k-t1)",
                  border: "1px solid var(--k-line-2)",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                <Play size={13} aria-hidden />
                Ver video
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div
        className="mt-8 p-4 rounded-xl text-center"
        style={{
          background: "var(--k-surface)",
          border: "1px solid var(--k-line)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--k-t2)", margin: 0 }}>
          ¿Necesitas más ayuda? Escríbele a tu coach
          {boxName ? ` en ${boxName}` : " en el box"}.
        </p>
      </div>
    </div>
  );
}
