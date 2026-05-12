"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type TourStep = {
  target: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
};

const DEFAULT_STEPS: TourStep[] = [
  {
    target: '[data-tour="reservar"]',
    title: "Reservá tu clase",
    description:
      "Acá ves todos los horarios disponibles. Tu horario habitual se resalta automáticamente.",
    position: "top",
  },
  {
    target: '[data-tour="wod"]',
    title: "Registrá tu WOD",
    description:
      "Después de entrenar, entrá acá y cargá tu resultado. Kronos detecta automáticamente si fue un PR.",
    position: "top",
  },
  {
    target: '[data-tour="skills"]',
    title: "Tu progresión de Skills",
    description:
      "Seguí tu evolución en cada movimiento. Kronos te dice qué practicar y qué nivel estás por alcanzar.",
    position: "top",
  },
  {
    target: '[data-tour="salud"]',
    title: "Registrá tu wellness",
    description:
      "Peso, medidas, metas. Todo lo que necesitás para ver tu evolución más allá del box.",
    position: "top",
  },
  {
    target: '[data-tour="perfil"]',
    title: "Tu perfil",
    description:
      "PRs, racha, logros y configuración. Todo sobre tu progreso en un solo lugar.",
    position: "top",
  },
];

const STORAGE_KEY = "kronos-tour-completed";

export default function SpotlightTour({
  steps = DEFAULT_STEPS,
  onComplete,
}: {
  steps?: TourStep[];
  onComplete?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const resizeTimer = useRef<number | undefined>(undefined);

  // Check if tour was already completed
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay to let the page render
      const timer = setTimeout(() => setActive(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const calculatePositions = useCallback(() => {
    const step = steps[currentStep];
    if (!step) return;

    const el = document.querySelector(step.target);
    if (!el) {
      // If target not found, skip to next
      if (currentStep < steps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        finishTour();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    setTargetRect(rect);

    // Calculate tooltip position
    const tooltipWidth = 280;
    const tooltipHeight = 120;
    const gap = 16;

    let x = rect.left + rect.width / 2 - tooltipWidth / 2;
    let y = rect.top - tooltipHeight - gap;

    // Clamp to viewport
    x = Math.max(12, Math.min(window.innerWidth - tooltipWidth - 12, x));
    y = Math.max(12, Math.min(window.innerHeight - tooltipHeight - 12, y));

    // If tooltip would go above viewport, place below
    if (y < 60 && step.position !== "bottom") {
      y = rect.bottom + gap;
    }

    setTooltipPos({ x, y });
  }, [currentStep, steps]);

  useEffect(() => {
    if (!active) return;
    calculatePositions();

    const onResize = () => {
      if (resizeTimer.current) window.clearTimeout(resizeTimer.current);
      resizeTimer.current = window.setTimeout(calculatePositions, 100);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      if (resizeTimer.current) window.clearTimeout(resizeTimer.current);
    };
  }, [active, calculatePositions]);

  const finishTour = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
    onComplete?.();
  };

  const goNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      finishTour();
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const skipTour = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setActive(false);
  };

  if (!active || !targetRect) return null;

  const step = steps[currentStep];
  const padding = 8;
  const holeX = targetRect.left - padding;
  const holeY = targetRect.top - padding;
  const holeW = targetRect.width + padding * 2;
  const holeH = targetRect.height + padding * 2;

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[500]"
        >
          {/* Dark overlay with hole */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "auto" }}
          >
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                <rect
                  x={holeX}
                  y={holeY}
                  width={holeW}
                  height={holeH}
                  rx={16}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(8,8,10,0.82)"
              mask="url(#spotlight-mask)"
            />
            {/* Animated border around the hole */}
            <motion.rect
              x={holeX}
              y={holeY}
              width={holeW}
              height={holeH}
              rx={16}
              fill="none"
              stroke="var(--k-t1)"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              style={{
                filter: "drop-shadow(0 0 12px rgba(255,255,255,0.15))",
              }}
            />
          </svg>

          {/* Pulse animation around target */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: holeX - 4,
              top: holeY - 4,
              width: holeW + 8,
              height: holeH + 8,
              borderRadius: 20,
              border: "2px solid var(--k-t1)",
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.6, 0.2, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Tooltip */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              width: 280,
            }}
          >
            <div
              className="p-5 rounded-2xl"
              style={{
                background: "var(--k-elevated)",
                border: "1px solid var(--k-line-2)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
              }}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex gap-1.5">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === currentStep ? 16 : 6,
                        height: 6,
                        background:
                          i === currentStep
                            ? "var(--k-t1)"
                            : i < currentStep
                              ? "var(--k-t2)"
                              : "var(--k-line-2)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    fontFamily: "var(--k-font-display)",
                    color: "var(--k-t3)",
                  }}
                >
                  {currentStep + 1} / {steps.length}
                </span>
              </div>

              {/* Content */}
              <h3
                className="text-base font-bold mb-1.5"
                style={{
                  fontFamily: "var(--k-font-display)",
                  color: "var(--k-t1)",
                }}
              >
                {step.title}
              </h3>
              <p
                className="text-sm leading-relaxed mb-4"
                style={{ color: "var(--k-t2)" }}
              >
                {step.description}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    onClick={goPrev}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                    style={{
                      fontFamily: "var(--k-font-display)",
                      background: "var(--k-surface)",
                      color: "var(--k-t2)",
                      border: "1px solid var(--k-line)",
                    }}
                  >
                    Atrás
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
                  style={{
                    fontFamily: "var(--k-font-display)",
                    background: "var(--k-t1)",
                    color: "var(--k-bg)",
                  }}
                >
                  {currentStep === steps.length - 1 ? "¡Listo!" : "Siguiente"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Skip button */}
          <button
            onClick={skipTour}
            className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
            style={{
              fontFamily: "var(--k-font-display)",
              background: "rgba(15,15,17,0.8)",
              backdropFilter: "blur(8px)",
              color: "var(--k-t3)",
              border: "1px solid var(--k-line)",
              zIndex: 510,
            }}
          >
            Saltar tour
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
