"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  closeOnBackdrop?: boolean;
  labelId?: string;
};

const MAX_W: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export function KModal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdrop = true,
  labelId = "kmodal-title",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const focusable = ref.current?.querySelector<HTMLElement>(
      "input, select, textarea, button:not([disabled])",
    );
    focusable?.focus();
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelId}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={closeOnBackdrop ? onClose : undefined}
            className="absolute inset-0 cursor-default"
            style={{
              background: "rgba(0,0,0,0.62)",
              backdropFilter: "blur(8px)",
              border: 0,
            }}
          />
          <motion.div
            ref={ref}
            className={`relative w-full ${MAX_W[size]} rounded-2xl p-5 sm:p-6 max-h-[90vh] overflow-y-auto`}
            style={{
              background: "var(--k-surface)",
              border: "1px solid var(--k-line-2)",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px var(--k-line)",
            }}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h2
                  id={labelId}
                  className="font-display font-extrabold text-xl sm:text-2xl leading-tight"
                  style={{ color: "var(--k-t1)" }}
                >
                  {title}
                </h2>
                {description ? (
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--k-t2)", lineHeight: 1.5 }}
                  >
                    {description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base"
                style={{
                  background: "var(--k-elevated)",
                  border: "1px solid var(--k-line-2)",
                  color: "var(--k-t2)",
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
