"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";

export type AchievementBadge = {
  badgeId: string;
  code: string;
  name: string;
  description: string;
  xp: number;
};

const ACCENT = "#c8ff2d";
const EVENT = "kronos:achievement";
const DEFAULT_DURATION = 7000;

type ToastInternal = AchievementBadge & {
  toastId: string;
  createdAt: number;
};

let counter = 0;
const newId = () => `ach-${Date.now()}-${counter++}`;

export function fireAchievementToast(badges: AchievementBadge[]) {
  if (!badges || badges.length === 0) return;
  if (typeof window === "undefined") return;

  if ("vibrate" in navigator) {
    try {
      navigator.vibrate?.([12, 40, 18]);
    } catch {
      /* ignore */
    }
  }

  fireConfetti();

  for (const b of badges) {
    const detail: ToastInternal = {
      ...b,
      toastId: newId(),
      createdAt: Date.now(),
    };
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent(EVENT, { detail }));
    }, 0);
  }
}

export function AchievementToastHost() {
  const [items, setItems] = useState<ToastInternal[]>([]);

  useEffect(() => {
    function onAdd(e: Event) {
      const detail = (e as CustomEvent<ToastInternal>).detail;
      setItems((prev) => [...prev, detail].slice(-3));
    }
    window.addEventListener(EVENT, onAdd);
    return () => window.removeEventListener(EVENT, onAdd);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    const handles = items.map((t) => {
      const elapsed = Date.now() - t.createdAt;
      const remaining = Math.max(400, DEFAULT_DURATION - elapsed);
      return window.setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.toastId !== t.toastId));
      }, remaining);
    });
    return () => handles.forEach((h) => window.clearTimeout(h));
  }, [items]);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      style={{
        position: "fixed",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 110,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        width: "min(92vw, 380px)",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div
            key={t.toastId}
            initial={{ scale: 0.92, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            role="status"
            data-testid="achievement-toast"
            data-badge-code={t.code}
            onClick={() =>
              setItems((prev) => prev.filter((x) => x.toastId !== t.toastId))
            }
            style={{
              background: "var(--k-elevated)",
              border: "1px solid var(--k-accent-line)",
              borderRadius: 14,
              padding: "14px 16px",
              boxShadow: "var(--k-accent-glow)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              pointerEvents: "auto",
              cursor: "pointer",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "var(--k-accent-soft)",
                border: "1px solid var(--k-accent-line)",
                display: "grid",
                placeItems: "center",
                color: "var(--k-accent)",
                flexShrink: 0,
              }}
            >
              <TrophyIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="k-mono"
                style={{
                  fontSize: 9,
                  color: "var(--k-accent)",
                  letterSpacing: 1.5,
                  marginBottom: 2,
                }}
              >
                LOGRO DESBLOQUEADO · +{t.xp} XP
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--k-t1)",
                  lineHeight: 1.2,
                  marginBottom: 2,
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--k-font-body)",
                  fontSize: 12,
                  color: "var(--k-t2)",
                  lineHeight: 1.3,
                }}
              >
                {t.description}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Convenience client component: renders nothing but fires the toast(s)
 * once when `badges` array changes (server returned them after a mutation).
 */
export function AchievementToastEmitter({
  badges,
}: {
  badges: AchievementBadge[] | undefined;
}) {
  useEffect(() => {
    if (badges?.length) fireAchievementToast(badges);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [badges?.map((b) => b.badgeId).join("|")]);
  return null;
}

function fireConfetti() {
  const opts = {
    particleCount: 60,
    spread: 70,
    origin: { y: 0.3 },
    colors: [ACCENT, "#a8d726", "#f5f5f7"],
    scalar: 0.9,
    ticks: 200,
  };
  try {
    confetti(opts);
    setTimeout(
      () => confetti({ ...opts, particleCount: 30, spread: 100 }),
      220,
    );
  } catch {
    /* ignore */
  }
}

function TrophyIcon() {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4a2 2 0 0 0 0 4h3" />
      <path d="M17 6h3a2 2 0 0 1 0 4h-3" />
    </svg>
  );
}
