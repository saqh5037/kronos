"use client";

import { LazyMotion, MotionConfig, domMax } from "framer-motion";

/**
 * Loads framer-motion features lazily and applies one global motion policy.
 *
 * `domMax` (not `domAnimation`) because layout animations are actually in use:
 * `MovementCatalog.tsx` (`layoutId="movement-cat-pill"` + `<m.div layout>`) and
 * `AuditFilters.tsx` (`layoutId="audit-filter-pill"`). `domAnimation` drops the
 * layout/drag feature bundle, which would silently break those shared-element
 * transitions. Revisit only once those two components stop using `layout`.
 *
 * `strict`: any remaining `motion.*` component (instead of `m.*`) throws in
 * development, acting as a compile-time safety net.
 *
 * `MotionConfig reducedMotion="user"`: honours the OS
 * `prefers-reduced-motion` setting for every descendant. Before this, reduced
 * motion was opt-in per component (`useReducedMotion` in only 25 of the 69
 * files using `m.*`), so up to 44 animated components ignored the setting
 * (2026-09-15 technical audit §B).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
