"use client";

import { useEffect, useMemo } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  type Placement,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import type { TourStep } from "./types";
import { useTour } from "./TourProvider";

function toFloatingPlacement(p: TourStep["placement"]): Placement {
  switch (p) {
    case "top":
      return "top";
    case "bottom":
      return "bottom";
    case "left":
      return "left";
    case "right":
      return "right";
    default:
      return "bottom";
  }
}

export function TourTooltip({
  step,
  stepIndex,
  total,
  anchorEl,
}: {
  step: TourStep;
  stepIndex: number;
  total: number;
  anchorEl: HTMLElement;
}) {
  const { next, prev, endTour } = useTour();

  const placement = useMemo(
    () => toFloatingPlacement(step.placement),
    [step.placement],
  );

  const { refs, floatingStyles, update } = useFloating({
    placement,
    middleware: [offset(16), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    refs.setReference(anchorEl);
  }, [anchorEl, refs]);

  useEffect(() => {
    update();
  }, [stepIndex, update]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...floatingStyles,
        zIndex: 2147483647,
        pointerEvents: "auto",
        maxWidth: "min(320px, calc(100vw - 24px))",
      }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={stepIndex}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          style={{
            background: "var(--k-elevated)",
            border: "1px solid var(--k-accent-line)",
            borderRadius: 16,
            padding: 16,
            boxShadow:
              "0 24px 48px rgba(0, 0, 0, 0.45), 0 0 24px rgba(200, 255, 45, 0.10)",
            color: "var(--k-t1)",
            fontFamily: "var(--k-font-body)",
            minWidth: 240,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "var(--k-accent)",
              }}
            >
              {stepIndex + 1}/{total}
            </span>
            <button
              type="button"
              onClick={() => endTour()}
              aria-label="Cerrar tour"
              style={{
                width: 24,
                height: 24,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                color: "var(--k-t2)",
                cursor: "pointer",
                borderRadius: 6,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <h3
            style={{
              margin: 0,
              fontFamily: "var(--k-font-display)",
              fontSize: 18,
              fontWeight: 700,
              fontStyle: "italic",
              letterSpacing: "-0.01em",
              color: "var(--k-t1)",
              lineHeight: 1.15,
            }}
          >
            {step.title}
          </h3>

          <p
            style={{
              margin: "8px 0 16px",
              fontFamily: "var(--k-font-body)",
              fontSize: 13,
              lineHeight: 1.45,
              color: "var(--k-t2)",
            }}
          >
            {step.body}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={prev}
              disabled={isFirst}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "9px 14px",
                borderRadius: 10,
                background: "transparent",
                color: isFirst ? "var(--k-t3)" : "var(--k-t2)",
                border: `1px solid ${isFirst ? "var(--k-line)" : "var(--k-line-2)"}`,
                cursor: isFirst ? "not-allowed" : "pointer",
                opacity: isFirst ? 0.5 : 1,
              }}
            >
              Atrás
            </button>

            <button
              type="button"
              onClick={isLast ? () => endTour() : next}
              style={{
                fontFamily: "var(--k-font-display)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                padding: "9px 16px",
                borderRadius: 10,
                background: "var(--k-accent)",
                color: "var(--k-accent-on)",
                border: "none",
                cursor: "pointer",
                boxShadow: "var(--k-accent-glow)",
              }}
            >
              {isLast ? "Listo" : "Siguiente"}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
