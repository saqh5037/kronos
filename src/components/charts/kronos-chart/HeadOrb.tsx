"use client";

import { m } from "framer-motion";

interface HeadOrbProps {
  cx: number;
  cy: number;
  color: string;
  animate: boolean;
  reduceMotion: boolean;
  delay?: number;
  /** When true, render a more pronounced radial halo (cinematic). */
  intense?: boolean;
}

export function HeadOrb({
  cx,
  cy,
  color,
  animate,
  reduceMotion,
  delay = 1.2,
  intense = false,
}: HeadOrbProps) {
  const skipPulse = !animate || reduceMotion;

  const outerR = intense ? 22 : 12;
  const coreR = intense ? 6.5 : 5;
  const dotR = intense ? 2.8 : 2.2;
  const outerOpacity = intense ? 0.22 : 0.16;
  const coreShadow = intense
    ? `drop-shadow(0 0 14px ${color}) drop-shadow(0 0 6px ${color})`
    : `drop-shadow(0 0 8px ${color})`;

  return (
    <g style={{ pointerEvents: "none" }}>
      {intense && (
        <m.circle
          cx={cx}
          cy={cy}
          r={outerR * 1.7}
          fill={color}
          opacity={0.06}
          initial={skipPulse ? false : { scale: 0.6, opacity: 0 }}
          animate={
            skipPulse
              ? { scale: 1, opacity: 0.06 }
              : { scale: [0.9, 1.4, 0.9], opacity: [0.12, 0.02, 0.12] }
          }
          transition={
            skipPulse
              ? { duration: 0 }
              : {
                  duration: 3.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay,
                }
          }
          style={{
            transformOrigin: `${cx}px ${cy}px`,
            transformBox: "fill-box",
            filter: `blur(2px)`,
          }}
        />
      )}
      <m.circle
        cx={cx}
        cy={cy}
        r={outerR}
        fill={color}
        opacity={outerOpacity}
        initial={skipPulse ? false : { scale: 0.6, opacity: 0 }}
        animate={
          skipPulse
            ? { scale: 1, opacity: outerOpacity }
            : {
                scale: [0.8, 1.6, 0.8],
                opacity: [
                  outerOpacity * 1.5,
                  outerOpacity * 0.25,
                  outerOpacity * 1.5,
                ],
              }
        }
        transition={
          skipPulse
            ? { duration: 0 }
            : {
                duration: 2.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay,
              }
        }
        style={{ transformOrigin: `${cx}px ${cy}px`, transformBox: "fill-box" }}
      />
      <m.circle
        cx={cx}
        cy={cy}
        r={coreR}
        fill={color}
        style={{ filter: coreShadow }}
        initial={skipPulse ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          skipPulse
            ? { duration: 0 }
            : { duration: 0.5, ease: [0.16, 1, 0.3, 1], delay }
        }
      />
      <m.circle
        cx={cx}
        cy={cy}
        r={dotR}
        fill="#ffffff"
        initial={skipPulse ? false : { opacity: 0 }}
        animate={{ opacity: intense ? 1 : 0.95 }}
        transition={
          skipPulse ? { duration: 0 } : { duration: 0.4, delay: delay + 0.15 }
        }
      />
    </g>
  );
}
