"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { m } from "framer-motion";
import type { TourDefinition } from "./types";
import { useTargetBox } from "./useTargetBox";
import { useTour } from "./TourProvider";
import { TourTooltip } from "./TourTooltip";

const SPRING = { type: "spring" as const, stiffness: 260, damping: 32 };
const PAD_DEFAULT = 8;

export function TourOverlay({
  tour,
  stepIndex,
}: {
  tour: TourDefinition;
  stepIndex: number;
}) {
  const step = tour.steps[stepIndex];
  const { box, element, missing } = useTargetBox(step?.anchor ?? null);
  const { next, endTour } = useTour();

  // If anchor never resolves, skip the step automatically (e.g. empty list).
  useEffect(() => {
    if (missing) {
      if (stepIndex < tour.steps.length - 1) {
        next();
      } else {
        endTour();
      }
    }
  }, [missing, stepIndex, tour.steps.length, next, endTour]);

  if (typeof document === "undefined") return null;
  if (!step) return null;

  const pad = step.spotlightPadding ?? PAD_DEFAULT;

  // While we're still measuring, render a flat dim layer so the user sees something.
  const measured = box !== null;
  const spotTop = measured ? Math.max(0, box.top - pad) : 0;
  const spotLeft = measured ? Math.max(0, box.left - pad) : 0;
  const spotW = measured ? box.width + pad * 2 : 0;
  const spotH = measured ? box.height + pad * 2 : 0;

  const overlay = (
    <div
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483600,
        pointerEvents: "none",
      }}
    >
      {/* Four backdrop slabs around the spotlight. Each slab carries the blur. */}
      {/* TOP */}
      <m.div
        initial={false}
        animate={{
          height: measured ? spotTop : "100vh",
          opacity: 1,
        }}
        transition={SPRING}
        onClick={() => endTour()}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "rgba(8, 8, 10, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />
      {/* BOTTOM */}
      <m.div
        initial={false}
        animate={{
          top: measured ? spotTop + spotH : 0,
        }}
        transition={SPRING}
        onClick={() => endTour()}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(8, 8, 10, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />
      {/* LEFT */}
      <m.div
        initial={false}
        animate={{
          top: measured ? spotTop : 0,
          height: measured ? spotH : 0,
          width: measured ? spotLeft : 0,
        }}
        transition={SPRING}
        onClick={() => endTour()}
        style={{
          position: "fixed",
          left: 0,
          background: "rgba(8, 8, 10, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />
      {/* RIGHT */}
      <m.div
        initial={false}
        animate={{
          top: measured ? spotTop : 0,
          height: measured ? spotH : 0,
          left: measured ? spotLeft + spotW : "100vw",
        }}
        transition={SPRING}
        onClick={() => endTour()}
        style={{
          position: "fixed",
          right: 0,
          background: "rgba(8, 8, 10, 0.72)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          pointerEvents: "auto",
          cursor: "pointer",
        }}
      />

      {/* Lime neon ring around the spotlight. Sits ABOVE the slabs but
          intercepts no clicks — the target underneath stays interactive. */}
      {measured ? (
        <m.div
          initial={false}
          animate={{
            top: spotTop,
            left: spotLeft,
            width: spotW,
            height: spotH,
            opacity: 1,
          }}
          transition={SPRING}
          style={{
            position: "fixed",
            borderRadius: 14,
            boxShadow:
              "0 0 0 2px var(--k-accent), 0 0 24px rgba(200, 255, 45, 0.32)",
            pointerEvents: "none",
            mixBlendMode: "normal",
          }}
        />
      ) : null}

      {measured && element ? (
        <TourTooltip
          step={step}
          stepIndex={stepIndex}
          total={tour.steps.length}
          anchorEl={element}
        />
      ) : null}
    </div>
  );

  return createPortal(overlay, document.body);
}
