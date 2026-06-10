"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { m } from "framer-motion";

type Props = {
  count: number;
  prDetected?: boolean;
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    function animate(timestamp: number) {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    }
    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

export default function Step3Confirm({ count, prDetected }: Props) {
  const router = useRouter();
  const animatedCount = useCountUp(count);

  useEffect(() => {
    const confetti = (
      window as unknown as { confetti?: (opts: unknown) => void }
    ).confetti;
    if (!confetti) return;

    // Confetti burst
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const particleCount = randomInRange(30, 60);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#4a7c59", "#dc4b17", "#e8893a", "#64748b"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#4a7c59", "#dc4b17", "#e8893a", "#64748b"],
      });
    }, 400);

    setTimeout(() => clearInterval(interval), 1600);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="k-card p-8 max-w-md mx-auto text-center space-y-6 relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(74,124,89,0.08), transparent 60%)",
        }}
      />

      {/* Animated checkmark */}
      <div className="relative flex justify-center">
        <m.div
          className="w-20 h-20 rounded-full bg-[var(--k-accent-soft)] border border-[var(--k-accent-line)] flex items-center justify-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <m.svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <m.path
              d="M10 20L17 27L30 13"
              stroke="var(--k-accent)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
            />
          </m.svg>
        </m.div>
      </div>

      <div className="space-y-2">
        <m.h2
          className="text-2xl font-display font-bold text-text"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <span className="text-[var(--k-accent)]">{animatedCount}</span> score
          {count !== 1 ? "s" : ""} guardado{count !== 1 ? "s" : ""}
        </m.h2>
        <m.p
          className="text-text-2 text-sm"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.4 }}
        >
          Los atletas recibirán una notificación en la app. Los PRs fueron
          detectados y registrados automáticamente.
        </m.p>

        {prDetected && (
          <m.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--fire-soft)] to-[var(--amber-soft)] text-[var(--k-accent)] border border-[var(--fire-line)] rounded-full px-4 py-1.5 text-sm font-bold mt-2"
          >
            <span className="text-lg">🏆</span>
            PR detectado
            <m.span
              className="inline-block w-2 h-2 rounded-full bg-[var(--k-accent)]"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </m.div>
        )}
      </div>

      <m.div
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <m.button
          onClick={() => router.push(`/admin/asistencia`)}
          className="k-btn-grad py-3 text-sm font-semibold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Ver asistencia
        </m.button>
        <m.button
          onClick={() => router.push(`/admin/leaderboards`)}
          className="k-btn-ghost py-3 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Ver leaderboard
        </m.button>
      </m.div>
    </div>
  );
}
