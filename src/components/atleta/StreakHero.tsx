"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type Status = "dormant" | "safe" | "warning" | "critical";

interface StreakHeroProps {
  count: number;
  lastEventAt: Date | string | null;
  /** Override status (e.g. for storybook/visual demos). */
  forceStatus?: Status;
}

const PALETTE: Record<Status, { glow: string; tag: string; line: string }> = {
  dormant: {
    glow: "rgba(200, 255, 45, 0.10)",
    tag: "PRIMERA RACHA",
    line: "Empieza hoy con tu primera clase",
  },
  safe: {
    glow: "rgba(200, 255, 45, 0.22)",
    tag: "EN LLAMAS",
    line: "No la rompas hoy",
  },
  warning: {
    glow: "rgba(255, 176, 32, 0.28)",
    tag: "NO LA SUELTES",
    line: "Tu racha está en juego",
  },
  critical: {
    glow: "rgba(255, 90, 90, 0.32)",
    tag: "RACHA EN RIESGO",
    line: "Quedan horas para mantenerla",
  },
};

function computeStatus(
  count: number,
  lastEventAt: Date | null,
  now: Date,
): Status {
  if (count === 0) return "dormant";
  if (!lastEventAt) return "safe";
  const sameDay =
    lastEventAt.getFullYear() === now.getFullYear() &&
    lastEventAt.getMonth() === now.getMonth() &&
    lastEventAt.getDate() === now.getDate();
  if (sameDay) return "safe";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday =
    lastEventAt.getFullYear() === yesterday.getFullYear() &&
    lastEventAt.getMonth() === yesterday.getMonth() &&
    lastEventAt.getDate() === yesterday.getDate();
  if (!wasYesterday) return "safe";
  const hour = now.getHours();
  if (hour >= 21) return "critical";
  if (hour >= 18) return "warning";
  return "safe";
}

export function StreakHero({
  count,
  lastEventAt,
  forceStatus,
}: StreakHeroProps) {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>(forceStatus ?? "safe");

  useEffect(() => {
    if (forceStatus) {
      setStatus(forceStatus);
      return;
    }
    const last = lastEventAt ? new Date(lastEventAt) : null;
    setStatus(computeStatus(count, last, new Date()));
  }, [count, lastEventAt, forceStatus]);

  const palette = PALETTE[status];
  const flameKey = `${status}-${reduce ? "static" : "anim"}`;

  // Fire backdrop sólo cuando hay racha activa (status !== dormant). Las light
  // trails verdes refuerzan la sensación de energía/velocidad sin saturar el
  // estado dormant (que debe verse calmado, esperando).
  const showFireBackdrop = status !== "dormant";

  return (
    <div
      className="k-card relative overflow-hidden"
      style={{
        padding: "20px 18px",
        background:
          "linear-gradient(180deg, var(--k-elevated) 0%, var(--k-surface) 100%)",
      }}
      data-testid="streak-hero"
      data-status={status}
    >
      {showFireBackdrop && (
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity:
              status === "critical" ? 0.32 : status === "warning" ? 0.24 : 0.18,
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{
            backgroundImage: "url(/images/app/streaks-fire-backdrop.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center right",
            mixBlendMode: "screen",
          }}
        />
      )}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 70% 30%, ${palette.glow}, transparent 60%)`,
        }}
        animate={
          reduce
            ? undefined
            : {
                opacity: status === "safe" ? [0.6, 1, 0.6] : [0.7, 1, 0.7],
              }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative flex items-start gap-5">
        <div className="shrink-0">
          <Flame status={status} reduce={reduce ?? false} key={flameKey} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="k-eyebrow" style={{ color: "var(--k-t2)" }}>
            {palette.tag}
          </div>
          <div
            className="k-mono"
            style={{
              fontSize: 56,
              lineHeight: 1,
              color: "var(--k-t1)",
              fontVariantNumeric: "tabular-nums",
              marginTop: 4,
              opacity: status === "dormant" ? 0.45 : 1,
              transition: "opacity 320ms ease",
            }}
          >
            {count}
          </div>
          <div
            className="k-mono"
            style={{ color: "var(--k-t2)", fontSize: 11, letterSpacing: 1 }}
          >
            DÍA{count === 1 ? "" : "S"} DE RACHA
          </div>
          <div
            className="k-body"
            style={{ color: "var(--k-t2)", fontSize: 13, marginTop: 8 }}
          >
            {palette.line}
          </div>
        </div>
      </div>
    </div>
  );
}

function Flame({ status, reduce }: { status: Status; reduce: boolean }) {
  const fill =
    status === "critical"
      ? "var(--k-danger)"
      : status === "warning"
        ? "var(--k-warning)"
        : "var(--k-accent)";

  const shake =
    status === "critical" && !reduce
      ? { rotate: [-1.5, 1.5, -1, 1, 0], x: [0, -1, 1, 0] }
      : undefined;

  // Dormant: llama "respirando" lenta, opacity 0.4↔0.7. Sin escala (estático
  // en tamaño, solo intensidad). Visual: viva pero baja energía. Esperando.
  const outerAnim =
    status === "dormant"
      ? reduce
        ? undefined
        : { opacity: [0.4, 0.7, 0.4] }
      : reduce
        ? undefined
        : { scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] };

  const outerDuration = status === "dormant" ? 3.2 : 1.6;

  return (
    <motion.svg
      width={64}
      height={72}
      viewBox="0 0 64 72"
      fill="none"
      animate={shake}
      transition={
        shake
          ? { duration: 0.6, repeat: Infinity, repeatDelay: 2.5 }
          : undefined
      }
    >
      <motion.path
        d="M32 6 C 38 18, 50 24, 48 38 C 47 50, 38 60, 32 64 C 26 60, 17 50, 16 38 C 14 24, 26 18, 32 6 Z"
        fill={fill}
        opacity={0.9}
        animate={outerAnim}
        transition={{
          duration: outerDuration,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ transformOrigin: "32px 64px" }}
      />
      <motion.path
        d="M32 22 C 36 30, 42 34, 40 42 C 39 50, 35 56, 32 58 C 29 56, 25 50, 24 42 C 22 34, 28 30, 32 22 Z"
        fill="var(--k-bg)"
        opacity={status === "dormant" ? 0.7 : 0.55}
        animate={
          reduce || status === "dormant"
            ? undefined
            : { scale: [0.95, 1.05, 0.95] }
        }
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "32px 58px" }}
      />
    </motion.svg>
  );
}
