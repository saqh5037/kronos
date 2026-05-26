import { Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import PushSubscribeButton from "@/components/atleta/PushSubscribeButton";
import {
  AnimatedSection,
  AnimatedItem,
} from "@/components/kronos/AnimatedSection";
import { PerfilHeroSection } from "./_components/sections/PerfilHeroSection";
import { PRsSection } from "./_components/sections/PRsSection";
import { GoalsSection } from "./_components/sections/GoalsSection";
import { PredictionsSection } from "./_components/sections/PredictionsSection";
import { ScoresSection } from "./_components/sections/ScoresSection";
import { TimelineSection } from "./_components/sections/TimelineSection";
import { CapabilitySection } from "./_components/sections/CapabilitySection";
import { HeatmapSection } from "./_components/sections/HeatmapSection";
import {
  PerfilHeroSkeleton,
  PRsSkeleton,
  ScoresSkeleton,
  ChartSkeleton,
} from "./skeletons";

export const metadata = { title: "Kronos — Perfil" };

/**
 * Perfil page — streaming version.
 *
 * Each data section is its own Suspense boundary so they stream in
 * independently. Optional sections (Goals, Predictions, Timeline,
 * Capability, Heatmap) wrap their fetch in try/catch → return null,
 * so a failure in one never blanks the page.
 *
 * getAthleteHome() is deduplicated across PerfilHeroSection via
 * _components/request-cache.ts — keyed by (userId, tenantId).
 */
export default function PerfilPage() {
  return (
    <div className="pb-28 relative">
      {/* Hero + racha + stats — waits for getAthleteHome + listMyScores */}
      <Suspense fallback={<PerfilHeroSkeleton />}>
        <PerfilHeroSection />
      </Suspense>

      {/* PRs grid */}
      <Suspense fallback={<PRsSkeleton />}>
        <PRsSection />
      </Suspense>

      {/* Goals — optional */}
      <Suspense fallback={null}>
        <GoalsSection />
      </Suspense>

      {/* AI predictions — optional, can be slow */}
      <Suspense fallback={null}>
        <PredictionsSection />
      </Suspense>

      {/* Scores historial + sparkline */}
      <Suspense fallback={<ScoresSkeleton />}>
        <ScoresSection />
      </Suspense>

      {/* Progress timeline */}
      <Suspense fallback={<ChartSkeleton />}>
        <TimelineSection />
      </Suspense>

      {/* Capability radar */}
      <Suspense fallback={<ChartSkeleton />}>
        <CapabilitySection />
      </Suspense>

      {/* Attendance heatmap */}
      <Suspense fallback={<ChartSkeleton />}>
        <HeatmapSection />
      </Suspense>

      {/* Exploration hub — static links, no fetch needed */}
      <AnimatedSection data-tour="perfil.explorar" className="mt-6 px-3.5">
        <AnimatedItem>
          <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
            EXPLORAR
          </p>
          <div className="grid grid-cols-2 gap-2">
            <HubCard
              href="/atleta/movimientos"
              label="Movimientos"
              hint="Biblioteca + cues"
              icon="dumbbell"
            />
            <HubCard
              href="/atleta/leaderboard"
              label="Ranking"
              hint="Top del box"
              icon="trophy"
            />
            <HubCard
              href="/atleta/historial"
              label="Historial"
              hint="Tus clases"
              icon="history"
            />
            <HubCard
              href="/atleta/plan"
              label="Plan IA"
              hint="Tu camino"
              icon="target"
            />
            <HubCard
              href="/atleta/pagos"
              label="Pagos"
              hint="Cuotas y comprobantes"
              icon="card"
            />
            <HubCard
              href="/atleta/ajustes"
              label="Ajustes"
              hint="Cuenta y privacidad"
              icon="settings"
            />
          </div>
        </AnimatedItem>
      </AnimatedSection>

      {/* Push notifications */}
      <AnimatedSection className="mt-5 px-3.5">
        <AnimatedItem>
          <div className="k-card p-4">
            <p className="k-eyebrow mb-3" style={{ color: "var(--k-t2)" }}>
              NOTIFICACIONES
            </p>
            <PushSubscribeButton />
          </div>
        </AnimatedItem>
      </AnimatedSection>
    </div>
  );
}

// ─── Hub helpers (static, no data) ────────────────────────────────────────────

type HubIcon =
  | "dumbbell"
  | "trophy"
  | "history"
  | "target"
  | "card"
  | "settings";

function HubCard({
  href,
  label,
  hint,
  icon,
}: {
  href: string;
  label: string;
  hint: string;
  icon: HubIcon;
}) {
  const iconNode = renderHubIcon(icon);

  return (
    <Link
      href={href as Route}
      className="k-tap"
      style={{
        background: "var(--k-surface)",
        border: "1px solid var(--k-line)",
        borderRadius: 14,
        padding: "14px 12px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textDecoration: "none",
        color: "var(--k-t1)",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: "var(--k-elevated)",
          border: "1px solid var(--k-line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--k-t2)",
          flexShrink: 0,
        }}
      >
        {iconNode}
      </div>
      <div className="min-w-0 flex-1">
        <div
          style={{
            fontFamily: "var(--k-font-display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "var(--k-t1)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--k-font-body)",
            fontSize: 11,
            color: "var(--k-t3)",
            marginTop: 2,
          }}
        >
          {hint}
        </div>
      </div>
      <span
        aria-hidden
        style={{
          color: "var(--k-t3)",
          fontSize: 16,
          fontFamily: "var(--k-font-display)",
        }}
      >
        ›
      </span>
    </Link>
  );
}

function renderHubIcon(icon: HubIcon) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (icon === "dumbbell")
    return (
      <svg {...common}>
        <path d="M2 12h2M20 12h2M5 8h3v8H5zM16 8h3v8h-3zM8 12h8" />
      </svg>
    );
  if (icon === "trophy")
    return (
      <svg {...common}>
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
        <path d="M3 6h4M17 6h4M9 20h6M12 15v5" />
      </svg>
    );
  if (icon === "history")
    return (
      <svg {...common}>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5M12 7v5l3 2" />
      </svg>
    );
  if (icon === "target")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  if (icon === "card")
    return (
      <svg {...common}>
        <rect x="2" y="6" width="20" height="14" rx="2" />
        <path d="M2 11h20M6 16h4" />
      </svg>
    );
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.25.61.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z" />
    </svg>
  );
}
