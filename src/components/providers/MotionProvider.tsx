"use client";

import { LazyMotion, domMax } from "framer-motion";

/**
 * Loads framer-motion features lazily (domMax — includes layout animations
 * and layoutId shared element transitions). Replaces the full ~40kb bundle
 * with a ~20kb async chunk loaded only when this provider mounts.
 *
 * strict=true: any remaining `motion.*` component (instead of `m.*`) will
 * throw in development, acting as a compile-time safety net.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      {children}
    </LazyMotion>
  );
}
