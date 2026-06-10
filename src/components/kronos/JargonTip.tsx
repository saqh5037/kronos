"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
} from "@floating-ui/react";
import { AnimatePresence, m } from "framer-motion";
import { cn } from "@/lib/utils";
import { lookupTerm, GLOSSARY_KEYS } from "@/lib/crossfit-glossary";

export type {} from "@/lib/crossfit-glossary"; // re-export path hint for consumers

// Re-export so consumers can enumerate available terms without importing glossary separately
export { GLOSSARY_KEYS };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JargonTipProps {
  /**
   * Term to look up. Lookup is case-insensitive.
   * If not in the glossary, renders children/term with no popover.
   */
  term: string;
  /**
   * Optional label override. When provided, wraps this content with the
   * popover affordance instead of rendering a bare "?" badge.
   *
   * Usage A — standalone badge:   <JargonTip term="AMRAP" />
   * Usage B — wrap a label:       <JargonTip term="AMRAP">AMRAP</JargonTip>
   */
  children?: ReactNode;
  /** Extra class on the root wrapper span. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JargonTip({ term, children, className }: JargonTipProps) {
  const definition = lookupTerm(term);
  const hasDefinition = definition !== undefined;

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const { refs, floatingStyles } = useFloating({
    placement: "top",
    middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  // Dismiss on Esc
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Dismiss on outside click / touch
  useEffect(() => {
    if (!open) return;
    function onOutside(e: PointerEvent) {
      const floating = refs.floating.current;
      const trigger = triggerRef.current;
      if (
        floating &&
        !floating.contains(e.target as Node) &&
        trigger &&
        !trigger.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open, refs.floating]);

  // If no definition, render plain content without any interactive affordance
  if (!hasDefinition) {
    return <span className={cn("inline", className)}>{children ?? term}</span>;
  }

  const label = term.toUpperCase();

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {/* Main content (children or nothing — badge is always rendered) */}
      {children && <span className="inline">{children}</span>}

      {/* Trigger button — "?" badge or, when no children, acts as the term label */}
      <button
        ref={(el) => {
          triggerRef.current = el;
          refs.setReference(el);
        }}
        type="button"
        aria-label={`Ver definición de ${label}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        // Hover only on non-touch devices
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          minWidth: 18,
          borderRadius: "50%",
          background: "var(--k-accent-soft)",
          border: "1px solid var(--k-accent-line)",
          color: "var(--k-accent)",
          fontFamily: "var(--k-font-display)",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: 1,
          cursor: "pointer",
          // Ensure tap target is >=44px on mobile via touch padding trick
          padding: 0,
          // We expand the touch area without changing visual size:
          position: "relative",
        }}
      >
        ?{/* Invisible larger hit area for mobile */}
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: "-13px",
            borderRadius: "50%",
          }}
        />
      </button>

      {/* Floating popover */}
      <AnimatePresence>
        {open && (
          <div
            ref={refs.setFloating}
            role="dialog"
            aria-label={`Definición de ${label}`}
            style={{
              ...floatingStyles,
              zIndex: 9999,
              maxWidth: "min(280px, calc(100vw - 24px))",
              pointerEvents: "auto",
            }}
          >
            <m.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                background: "var(--k-elevated)",
                border: "1px solid var(--k-accent-line)",
                borderRadius: 12,
                padding: "10px 14px",
                boxShadow:
                  "0 16px 40px rgba(0,0,0,0.4), 0 0 16px rgba(200,255,45,0.10)",
              }}
            >
              {/* Term header */}
              <p
                style={{
                  margin: "0 0 4px",
                  fontFamily: "var(--k-font-display)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--k-accent)",
                  lineHeight: 1,
                }}
              >
                {label}
              </p>

              {/* Definition */}
              <p
                style={{
                  margin: 0,
                  fontFamily: "var(--k-font-body)",
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: "var(--k-t2)",
                }}
              >
                {definition}
              </p>
            </m.div>
          </div>
        )}
      </AnimatePresence>
    </span>
  );
}
